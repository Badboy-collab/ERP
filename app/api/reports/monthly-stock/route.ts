import { NextResponse } from "next/server";
import { ERPService } from "@/lib/services/erpService";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const depotId = searchParams.get("depot_id") || undefined;

    const report = await ERPService.getRealtimeStockReport(depotId);
    return NextResponse.json(report);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
