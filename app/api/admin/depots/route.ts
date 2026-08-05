import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const depots = await prisma.depot.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { lots: true, users: true },
        },
      },
    });
    return NextResponse.json(depots);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const depot = await prisma.depot.create({
      data: {
        code: body.code,
        name: body.name,
        address: body.address || null,
        phone: body.phone || null,
      },
    });
    return NextResponse.json(depot, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
