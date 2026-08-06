import { NextResponse } from "next/server";
import { ERPService } from "@/lib/services/erpService";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const org_id = session.org_id;

    const { searchParams } = new URL(req.url);
    const depotId = searchParams.get("depot_id") || undefined;
    const date = searchParams.get("date") || undefined;

    const report = await ERPService.getRealtimeStockReport(org_id, depotId, date);
    return NextResponse.json(report);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
