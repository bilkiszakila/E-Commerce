import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!process.env.XENDIT_SECRET_KEY) {
    return NextResponse.json({
      demo: true,
      invoice_url: "/payment/demo",
      message: "Set XENDIT_SECRET_KEY and NEXT_PUBLIC_APP_URL to enable live Xendit invoices.",
    }, { status: 200 });
  }
  if (!body.external_id || !body.amount) {
    return NextResponse.json({ error: "external_id and amount are required" }, { status: 400 });
  }
  const response = await fetch("https://api.xendit.co/v2/invoices", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${process.env.XENDIT_SECRET_KEY}:`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      external_id: body.external_id,
      amount: body.amount,
      payer_email: body.email,
      description: body.description || "Pesanan Adi Cetak",
      success_redirect_url: body.success_url,
      failure_redirect_url: body.failure_url,
    }),
  });
  const invoice = await response.json();
  if (!response.ok) return NextResponse.json(invoice, { status: response.status });
  return NextResponse.json(invoice);
}
