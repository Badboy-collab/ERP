import { NextResponse } from "next/server";
import { ERPService } from "@/lib/services/erpService";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const org_id = session.org_id;

    const { searchParams } = new URL(req.url);
    const depotId = searchParams.get("depot_id") || undefined;

    const receives = await prisma.receiveLog.findMany({
      where: {
        org_id,
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
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const org_id = session.org_id;

    const body = await req.json();
    const result = await ERPService.recordStockReceive(org_id, body);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  try {
    // SUPER_ADMIN role guard
    const session = await getSession(req);
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Only Super Admin can override receive records." }, { status: 403 });
    }
    const org_id = session.org_id;

    const body = await req.json();
    const updated = await ERPService.updateStockReceive(org_id, body);
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
      return NextResponse.json({ error: "Forbidden: Only Super Admin can delete receive records." }, { status: 403 });
    }
    const org_id = session.org_id;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "ReceiveLog ID is required" }, { status: 400 });
    }

    await ERPService.deleteStockReceive(org_id, id);
    
    return NextResponse.json({ message: "Stock receive entry reversed and lot quantity deducted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
