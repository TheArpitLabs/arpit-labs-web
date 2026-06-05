import { jsPDF } from "jspdf";
import "jspdf-autotable";

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerEmail: string;
  items: {
    description: string;
    amount: number;
    quantity: number;
  }[];
  total: number;
  currency: string;
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  const doc = new jsPDF() as any;

  // Header
  doc.setFontSize(20);
  doc.text("ARPIT LABS", 14, 22);
  doc.setFontSize(10);
  doc.text("Innovation & Technology Platform", 14, 28);
  doc.text("Email: hello@arpitlabs.com", 14, 33);

  doc.setFontSize(16);
  doc.text("INVOICE", 140, 22);
  doc.setFontSize(10);
  doc.text(`Invoice #: ${data.invoiceNumber}`, 140, 28);
  doc.text(`Date: ${data.date}`, 140, 33);

  // Bill To
  doc.setFontSize(12);
  doc.text("BILL TO", 14, 50);
  doc.setFontSize(10);
  doc.text(data.customerName, 14, 56);
  doc.text(data.customerEmail, 14, 61);

  // Table
  const tableData = data.items.map(item => [
    item.description,
    item.quantity.toString(),
    `${data.currency} ${item.amount.toFixed(2)}`,
    `${data.currency} ${(item.amount * item.quantity).toFixed(2)}`
  ]);

  doc.autoTable({
    startY: 70,
    head: [["Description", "Qty", "Price", "Total"]],
    body: tableData,
    theme: "striped",
    headStyles: { fillStyle: [20, 20, 20] },
  });

  // Total
  const finalY = (doc as any).lastAutoTable.cursor.y + 10;
  doc.setFontSize(12);
  doc.text(`TOTAL: ${data.currency} ${data.total.toFixed(2)}`, 140, finalY);

  // Footer
  doc.setFontSize(8);
  doc.text("Thank you for your business!", 14, finalY + 20);
  doc.text("Arpit Labs - Building the future of Tech Learning.", 14, finalY + 25);

  return Buffer.from(doc.output("arraybuffer"));
}
