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

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, code, name, address, phone } = body;

    const updated = await prisma.depot.update({
      where: { id },
      data: {
        ...(code ? { code } : {}),
        ...(name ? { name } : {}),
        ...(address !== undefined ? { address } : {}),
        ...(phone !== undefined ? { phone } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Depot ID is required" }, { status: 400 });
    }

    await prisma.depot.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Depot deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
