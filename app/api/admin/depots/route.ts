import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

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
    // SUPER_ADMIN role guard
    const session = await getSession(req);
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Only Super Admin can edit depot records." }, { status: 403 });
    }

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
    // SUPER_ADMIN role guard
    const session = await getSession(req);
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Only Super Admin can delete depot records." }, { status: 403 });
    }

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
