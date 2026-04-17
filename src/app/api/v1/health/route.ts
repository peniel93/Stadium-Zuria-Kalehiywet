import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      service: "durame-portal-api",
      status: "ok",
      timestamp: new Date().toISOString(),
    },
    error: null,
  });
}
