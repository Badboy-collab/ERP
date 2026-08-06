import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getSession(req);
    if (!session?.org_id) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    const org_id = session.org_id;

    const { searchParams } = new URL(req.url);
    const depot_id = searchParams.get("depot_id");

    const whereClause = depot_id ? { org_id, depot_id } : { org_id };

    const dealers = await prisma.dealer.findMany({
      where: whereClause,
      orderBy: { name: "asc" },
      include: { depot: true }
    });
    return NextResponse.json(dealers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession(req);
    if (!session?.org_id) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    const org_id = session.org_id;

    const body = await req.json();
    if (!body.depot_id) {
      return NextResponse.json({ error: "depot_id is required" }, { status: 400 });
    }

    let dealerCode = body.code;
    if (!dealerCode || dealerCode.trim() === "") {
      const count = await prisma.dealer.count({ where: { org_id } });
      dealerCode = `DLR-${String(count + 1).padStart(3, '0')}`;
    }

    const dealer = await prisma.dealer.create({
      data: {
        org_id,
        name: body.name,
        code: dealerCode,
        phone: body.phone,
        address: body.address || null,
        depot_id: body.depot_id,
        current_balance: Number(body.current_balance) || 0.0,
      },
    });
    return NextResponse.json(dealer, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  try {
    // SUPER_ADMIN role guard
    const session = await getSession(req);
    if (!session?.org_id || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Only Super Admin can edit dealer records." }, { status: 403 });
    }
    const org_id = session.org_id;

    const body = await req.json();
    const { id, name, code, phone, address, depot_id, current_balance } = body;

    const updated = await prisma.dealer.update({
      where: { id, org_id },
      data: {
        ...(name ? { name } : {}),
        ...(code ? { code } : {}),
        ...(phone ? { phone } : {}),
        ...(address !== undefined ? { address } : {}),
        ...(depot_id ? { depot_id } : {}),
        ...(current_balance !== undefined ? { current_balance: Number(current_balance) } : {}),
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
      return NextResponse.json({ error: "Forbidden: Only Super Admin can delete dealer records." }, { status: 403 });
    }
    const org_id = session.org_id;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Dealer ID is required" }, { status: 400 });
    }

    await prisma.dealer.delete({
      where: { id, org_id },
    });

    return NextResponse.json({ message: "Dealer deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
