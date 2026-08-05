import { NextResponse } from "next/server";
import { ERPService } from "@/lib/services/erpService";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dealerId = searchParams.get("dealer_id") || undefined;
    const depotId = searchParams.get("depot_id") || undefined;
    const status = searchParams.get("status") || undefined;

    const orders = await prisma.deliveryOrder.findMany({
      where: {
        ...(dealerId ? { dealer_id: dealerId } : {}),
        ...(depotId ? { depot_id: depotId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        dealer: true,
        depot: true,
        items: {
          include: { product: true },
        },
      },
      orderBy: { order_date: "desc" },
    });

    return NextResponse.json(orders);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await ERPService.createDeliveryOrder(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
