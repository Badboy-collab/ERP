import { NextResponse } from "next/server";
import { ERPService } from "@/lib/services/erpService";

export async function GET() {
  try {
    const nextDONumber = await ERPService.getNextDONumber();
    return NextResponse.json({ order_no: nextDONumber });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
