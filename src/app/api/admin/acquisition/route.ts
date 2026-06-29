import { NextRequest, NextResponse } from "next/server";
import { getAdminUserFromRequest } from "@/lib/auth/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { bulkQueueAcquisition, listAcquisitionQueue, queueAcquisition, updateAcquisitionStatus, publishApprovedItem } from "@/lib/knowledge-ecosystem";
import { GitHubService } from "@/lib/github/github.service";
import { analyzeProjectEnhanced } from "@/lib/knowledge-ecosystem/enhanced-analysis";
import { checkDuplicate, storeDuplicateCheck } from "@/lib/knowledge-ecosystem/enhanced-duplicate-detection";
import { normalizeRepositoryUrl, extractRepositoryId } from "@/lib/knowledge-ecosystem/url-normalization";
import { contentHash } from "@/lib/knowledge-ecosystem/text";
import type { AcquisitionProvider, AcquisitionStatus } from "@/lib/knowledge-ecosystem";
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const admin = await getAdminUserFromRequest(request);
  if (!admin) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider") as AcquisitionProvider | null;
  const status = searchParams.get("status") as AcquisitionStatus | null;
  const queue = await listAcquisitionQueue({ provider: provider ?? undefined, status: status ?? undefined });

  return NextResponse.json({ success: true, queue });
}

export async function POST(request: NextRequest) {
  const admin = await getAdminUserFromRequest(request);
  if (!admin) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const body = await request.json();

  if (body.action === "github_import") {
    try {
      const githubData = await GitHubService.importRepository(body.url);
      
      const candidate = {
        provider: "github" as AcquisitionProvider,
        externalId: githubData.repository.full_name,
        sourceUrl: githubData.repository.html_url,
        repositoryUrl: githubData.repository.html_url,
        screenshotUrl: GitHubService.generateCoverPlaceholder(
          githubData.repository.owner.login,
          githubData.repository.name
        ),
        title: githubData.repository.name,
        description: githubData.repository.description || "",
        author: githubData.repository.owner.login,
        rawContent: githubData.readme || undefined,
        metadata: {
          languages: GitHubService.extractLanguages(githubData.repository.languages),
          topics: githubData.repository.topics,
          stars: githubData.repository.stargazers_count,
          forks: githubData.repository.forks_count,
          license: githubData.repository.license?.name,
          homepage: githubData.repository.homepage,
          cover_image: GitHubService.generateCoverPlaceholder(
            githubData.repository.owner.login,
            githubData.repository.name
          ),
          default_branch: githubData.repository.default_branch,
          created_at: githubData.repository.created_at,
          updated_at: githubData.repository.updated_at,
        },
      };

      const item = await queueAcquisition(candidate);
      
      // Normalize URL and store canonical URL and repository ID
      const normalized = normalizeRepositoryUrl(candidate.repositoryUrl || candidate.sourceUrl);
      const repositoryId = extractRepositoryId(normalized.canonical);
      const hash = contentHash([candidate.title, candidate.description, candidate.rawContent].filter(Boolean).join("\n"));
      
      // Update queue item with normalized data
      const { error: updateError } = await supabaseServer
        .from("content_acquisition_queue")
        .update({
          canonical_url: normalized.canonical,
          repository_id: repositoryId,
          content_hash: hash,
        })
        .eq("id", item.id);
      
      if (updateError) {
        logger.error("Failed to update normalized data:", updateError);
      }
      
      // Run duplicate detection
      try {
        const duplicateResult = await checkDuplicate(candidate);
        await storeDuplicateCheck(item.id, duplicateResult);
        
        // Auto-reject if exact duplicate
        if (duplicateResult.recommendation === "auto_reject") {
          await updateAcquisitionStatus(item.id, "duplicate", admin.id);
          return NextResponse.json({ 
            success: true, 
            item, 
            githubData,
            duplicateResult,
            warning: "Duplicate detected and auto-rejected"
          });
        }
      } catch (duplicateError) {
        logger.error("Duplicate detection failed:", duplicateError);
        // Don't fail the import if duplicate detection fails
      }
      
      // Automatically trigger AI analysis after successful import
      try {
        await analyzeProjectEnhanced(item.id);
      } catch (analysisError) {
        logger.error("Auto-analysis failed:", analysisError);
        // Don't fail the import if analysis fails
      }
      
      return NextResponse.json({ success: true, item, githubData });
    } catch (error) {
      return NextResponse.json(
        { success: false, error: error instanceof Error ? error.message : "GitHub import failed" },
        { status: 400 }
      );
    }
  }

  if (body.action === "bulk_import") {
    const queued = await bulkQueueAcquisition(body.provider, body.urls ?? []);
    return NextResponse.json({ success: true, queued });
  }

  if (body.action === "approve" || body.action === "reject") {
    const status = body.action === "approve" ? "approved" : "rejected";
    const item = await updateAcquisitionStatus(body.id, status, admin.id);
    return NextResponse.json({ success: true, item });
  }

  if (body.action === "publish") {
    try {
      const result = await publishApprovedItem(body.id, admin.id);
      return NextResponse.json({ success: true, result });
    } catch (error) {
      return NextResponse.json(
        { success: false, error: error instanceof Error ? error.message : "Publish failed" },
        { status: 400 }
      );
    }
  }

  if (body.action === "schedule_import") {
    const item = await queueAcquisition({
      provider: body.provider,
      sourceUrl: body.sourceUrl,
      repositoryUrl: body.repositoryUrl,
      title: body.title,
      description: body.description,
      rawContent: body.rawContent,
      metadata: { ...(body.metadata ?? {}), scheduledFor: body.scheduledFor },
    });
    return NextResponse.json({ success: true, item });
  }

  const item = await queueAcquisition(body);
  return NextResponse.json({ success: true, item });
}
