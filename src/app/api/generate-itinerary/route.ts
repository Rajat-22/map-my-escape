import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "MapMyEscape API is healthy. Itinerary generator engine ready.",
  });
}
