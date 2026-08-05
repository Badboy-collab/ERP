import { NextResponse } from "next/server";
import { ERPService } from "@/lib/services/erpService";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const receives = await prisma.receiveLog.findMany({
      include: {
        product: true,
        lot: true,
      },
      orderBy: { receive_date: "desc" },
      take: 50,
    });
    return NextResponse.json(receives);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await ERPService.recordStockReceive(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
