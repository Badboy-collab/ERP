import { NextResponse } from "next/server";
import { ERPService } from "@/lib/services/erpService";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const org_id = session.org_id;

    const { searchParams } = new URL(req.url);
    const dealer_id = searchParams.get("dealer_id");
    
    if (!dealer_id) {
      return NextResponse.json({ error: "dealer_id is required" }, { status: 400 });
    }

    const ledger = await ERPService.getDealerLedger(org_id, dealer_id);
    return NextResponse.json(ledger);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
