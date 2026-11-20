import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const callbackToken = request.headers.get("x-callback-token");
  if (process.env.XENDIT_CALLBACK_TOKEN && callbackToken !== process.env.XENDIT_CALLBACK_TOKEN) {
    return NextResponse.json({ error: "Invalid callback token" }, { status: 401 });
  }
  const event = await request.json();
  if (!event.external_id || !event.status) {
    return NextResponse.json({ error: "Invalid invoice event" }, { status: 400 });
  }
  return NextResponse.json({ received: true, external_id: event.external_id, status: event.status });
}
