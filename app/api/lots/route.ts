import { NextResponse } from "next/server";
import { ERPService } from "@/lib/services/erpService";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

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
        depot: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(lots);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    // SUPER_ADMIN role guard
    const session = await getSession(req);
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Only Super Admin can override lot records." }, { status: 403 });
    }

    const body = await req.json();
    const { id, initial_qty, available_qty, status } = body;

    if (!id) {
      return NextResponse.json({ error: "Lot ID is required" }, { status: 400 });
    }

    const updated = await prisma.lotTracker.update({
      where: { id },
      data: {
        ...(initial_qty !== undefined ? { initial_qty: Number(initial_qty) } : {}),
        ...(available_qty !== undefined ? { available_qty: Number(available_qty) } : {}),
        ...(status ? { status } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    // SUPER_ADMIN role guard
    const session = await getSession(req);
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Only Super Admin can delete lot records." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Lot ID is required" }, { status: 400 });
    }

    await prisma.lotTracker.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Lot record deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
