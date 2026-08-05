import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const depot_id = searchParams.get("depot_id");

    const whereClause = depot_id ? { depot_id } : {};

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
    const body = await req.json();
    if (!body.depot_id) {
      return NextResponse.json({ error: "depot_id is required" }, { status: 400 });
    }

    const dealer = await prisma.dealer.create({
      data: {
        name: body.name,
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
