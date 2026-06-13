import { NextRequest, NextResponse } from "next/server";
import { getAdminUserFromRequest } from "@/lib/auth";
import { bulkQueueAcquisition, listAcquisitionQueue, queueAcquisition, updateAcquisitionStatus } from "@/lib/knowledge-ecosystem";
import type { AcquisitionProvider, AcquisitionStatus } from "@/lib/knowledge-ecosystem";

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

  if (body.action === "bulk_import") {
    const queued = await bulkQueueAcquisition(body.provider, body.urls ?? []);
    return NextResponse.json({ success: true, queued });
  }

  if (body.action === "approve" || body.action === "reject") {
    const status = body.action === "approve" ? "approved" : "rejected";
    const item = await updateAcquisitionStatus(body.id, status, admin.id);
    return NextResponse.json({ success: true, item });
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
