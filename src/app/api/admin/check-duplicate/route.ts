import { NextRequest, NextResponse } from "next/server";
import { getAdminUserFromRequest } from "@/lib/auth/auth";
import { checkDuplicate, storeDuplicateCheck } from "@/lib/knowledge-ecosystem/enhanced-duplicate-detection";
import { supabaseServer } from "@/lib/supabase/server";
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const admin = await getAdminUserFromRequest(request);
  if (!admin) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  try {
    const body = await request.json();
    const { queueItemId } = body;

    if (!queueItemId) {
      return NextResponse.json({ success: false, error: "queueItemId is required" }, { status: 400 });
    }

    // Fetch queue item
    const { data: queueItem, error: fetchError } = await supabaseServer
      .from("content_acquisition_queue")
      .select("*")
      .eq("id", queueItemId)
      .single();

    if (fetchError || !queueItem) {
      return NextResponse.json({ success: false, error: "Queue item not found" }, { status: 404 });
    }

    // Run duplicate check
    const result = await checkDuplicate({
      provider: queueItem.provider,
      externalId: queueItem.external_id,
      sourceUrl: queueItem.source_url,
      repositoryUrl: queueItem.repository_url,
      title: queueItem.title,
      description: queueItem.description,
      author: queueItem.author,
      rawContent: queueItem.raw_content,
      metadata: queueItem.metadata,
    });

    // Store check result
    await storeDuplicateCheck(queueItemId, result);

    // Update queue item with canonical URL and repository ID
    const { normalizeRepositoryUrl, extractRepositoryId } = await import("@/lib/knowledge-ecosystem/url-normalization");
    const normalized = normalizeRepositoryUrl(queueItem.repository_url || queueItem.source_url);
    const repositoryId = extractRepositoryId(normalized.canonical);

    await supabaseServer
      .from("content_acquisition_queue")
      .update({
        canonical_url: normalized.canonical,
        repository_id: repositoryId,
        content_hash: result.signals.find(s => s.type === "content_hash")?.matched ? 
          (await import("@/lib/knowledge-ecosystem/text")).contentHash([
            queueItem.title,
            queueItem.description,
            queueItem.raw_content
          ].filter(Boolean).join("\n")) : null
      })
      .eq("id", queueItemId);

    return NextResponse.json({ success: true, result });
  } catch (error) {
    logger.error("Duplicate check failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Duplicate check failed" },
      { status: 500 }
    );
  }
}
