import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body.destination || !body.weight) {
    return NextResponse.json({ error: "Destination and weight are required" }, { status: 400 });
  }
  return NextResponse.json({
    services: [
      { courier: "JNE", service: "REG", price: 17000, etd: "2-3 hari" },
      { courier: "J&T", service: "EZ", price: 19000, etd: "1-2 hari" },
      { courier: "SiCepat", service: "REG", price: 15000, etd: "2-3 hari" },
    ],
  });
}
