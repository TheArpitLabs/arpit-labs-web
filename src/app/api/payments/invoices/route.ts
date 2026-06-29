import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { paymentRepository } from "@/lib/repositories/payment.repository";
import { generateInvoicePDF } from "@/lib/payments/invoice-utils";
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  if (!authorization) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { data: { user }, error: authError } = await supabaseServer.auth.getUser(authorization);
  if (authError || !user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const invoiceId = searchParams.get("id");

  if (!invoiceId) {
    const invoices = await paymentRepository.getInvoices(user.id);
    return NextResponse.json({ success: true, invoices });
  }

  // Generate PDF for a specific invoice
  try {
    const { data: invoice, error } = await supabaseServer
      .from("invoices")
      .select("*, transaction:transactions(*)")
      .eq("id", invoiceId)
      .eq("user_id", user.id)
      .single();

    if (error || !invoice) {
      return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
    }

    const pdfBuffer = await generateInvoicePDF({
      invoiceNumber: invoice.invoice_number,
      date: new Date(invoice.created_at).toLocaleDateString(),
      customerName: user.user_metadata?.full_name || user.email || "Customer",
      customerEmail: user.email!,
      items: [
        {
          description: invoice.transaction?.type === "subscription" ? "Membership Subscription" : "Marketplace Purchase",
          amount: Number(invoice.amount),
          quantity: 1,
        }
      ],
      total: Number(invoice.amount),
      currency: invoice.currency,
    });

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${invoice.invoice_number}.pdf"`,
      },
    });
  } catch (error) {
    logger.error("Invoice PDF generation error:", error);
    return NextResponse.json({ success: false, error: "Failed to generate invoice" }, { status: 500 });
  }
}
