import { NextResponse } from "next/server";
import { ERPService } from "@/lib/services/erpService";
import { getSession } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const org_id = session.org_id;

    const { searchParams } = new URL(req.url);
    const depot_id = searchParams.get("depot_id") || undefined;
    const order_date = searchParams.get("order_date") || undefined;
    const nextDONumber = await ERPService.getNextDONumber(org_id, depot_id, true, order_date);
    return NextResponse.json({ order_no: nextDONumber });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
