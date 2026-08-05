import { NextResponse } from "next/server";
import { ERPService } from "@/lib/services/erpService";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dealer_id = searchParams.get("dealer_id");
    
    if (!dealer_id) {
      return NextResponse.json({ error: "dealer_id is required" }, { status: 400 });
    }

    const ledger = await ERPService.getDealerLedger(dealer_id);
    return NextResponse.json(ledger);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
