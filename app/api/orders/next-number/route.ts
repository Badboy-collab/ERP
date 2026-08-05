import { NextResponse } from "next/server";
import { ERPService } from "@/lib/services/erpService";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const depot_id = searchParams.get("depot_id") || undefined;
    const nextDONumber = await ERPService.getNextDONumber(depot_id);
    return NextResponse.json({ order_no: nextDONumber });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
