import { NextResponse } from "next/server";
import { ERPService } from "@/lib/services/erpService";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const depotId = searchParams.get("depot_id") || undefined;

    const receives = await prisma.receiveLog.findMany({
      where: {
        ...(depotId ? { depot_id: depotId } : {}),
      },
      include: {
        product: true,
        lot: true,
        depot: true,
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

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "ReceiveLog ID is required" }, { status: 400 });
    }

    await prisma.receiveLog.delete({
      where: { id },
    });
    
    return NextResponse.json({ message: "Receive record deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
