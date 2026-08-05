import { NextResponse } from "next/server";
import { ERPService } from "@/lib/services/erpService";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("product_id");
    const depotId = searchParams.get("depot_id") || undefined;
    const isFifo = searchParams.get("fifo") === "true";
    const includeZero = searchParams.get("include_zero") === "true";

    if (productId && isFifo) {
      const suggestedLot = await ERPService.suggestFIFOLot(productId, depotId);
      return NextResponse.json(suggestedLot || null);
    }

    const lots = await prisma.lotTracker.findMany({
      where: {
        ...(productId ? { product_id: productId } : {}),
        ...(depotId ? { depot_id: depotId } : {}),
        ...(!includeZero ? { available_qty: { gt: 0 } } : {}),
      },
      include: {
        product: true,
      },
      orderBy: { exp_date: "asc" },
    });

    return NextResponse.json(lots);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
