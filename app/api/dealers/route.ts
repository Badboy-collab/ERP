import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const dealers = await prisma.dealer.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(dealers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const dealer = await prisma.dealer.create({
      data: {
        name: body.name,
        phone: body.phone,
        address: body.address || null,
        current_balance: Number(body.current_balance) || 0.0,
      },
    });
    return NextResponse.json(dealer, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
