import { NextResponse } from "next/server";
import { ERPService } from "@/lib/services/erpService";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const sales = await prisma.salesLog.findMany({
      include: {
        dealer: true,
        product: true,
        lot: true,
        order: true,
        invoice: true,
      },
      orderBy: { date: "desc" },
      take: 50,
    });
    return NextResponse.json(sales);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await ERPService.recordInvoiceTransaction(body);
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
      return NextResponse.json({ error: "SalesLog ID is required" }, { status: 400 });
    }

    // Super Admin master override with automatic inventory & ledger reversal
    await ERPService.deleteSalesLog(id);
    
    return NextResponse.json({ message: "Sales record reversed and stock restored successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
