import { NextResponse } from "next/server";
import { ERPService } from "@/lib/services/erpService";

export async function GET() {
  try {
    const report = await ERPService.getLotReconciliation();
    return NextResponse.json(report);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
