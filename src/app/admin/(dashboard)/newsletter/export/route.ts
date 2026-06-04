import { NextResponse } from "next/server";
import { newsletterRepository } from "@/lib/repositories/newsletter.repository";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    const subscribers = await newsletterRepository.getSubscribers();

    const headers = ["ID", "Email", "Subscribed At"];
    const rows = subscribers.map((s) => [
      s.id,
      s.email,
      new Date(s.subscribed_at).toISOString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="subscribers-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
