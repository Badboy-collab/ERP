import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const org_id = session.org_id;

    const products = await prisma.product.findMany({
      where: { org_id },
      orderBy: [{ sort_order: "asc" }, { category: "asc" }, { code: "asc" }],
    });
    return NextResponse.json(products);
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
    const product = await prisma.product.create({
      data: {
        org_id,
        code: body.code,
        name: body.name,
        category: body.category || "Broiler",
        bag_size_kg: Number(body.bag_size_kg) || 50.0,
        opening_stock: Number(body.opening_stock) || 0,
        sort_order: body.sort_order ? Number(body.sort_order) : 0,
      },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  try {
    // SUPER_ADMIN role guard
    const session = await getSession(req);
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Only Super Admin can edit product records." }, { status: 403 });
    }
    const org_id = session.org_id;

    const body = await req.json();
    const { id, code, name, category, bag_size_kg, opening_stock, sort_order } = body;

    const product = await prisma.product.update({
      where: { id, org_id },
      data: {
        ...(code ? { code } : {}),
        ...(name ? { name } : {}),
        ...(category ? { category } : {}),
        ...(bag_size_kg !== undefined ? { bag_size_kg: Number(bag_size_kg) } : {}),
        ...(opening_stock !== undefined ? { opening_stock: Number(opening_stock) } : {}),
        ...(sort_order !== undefined ? { sort_order: Number(sort_order) } : {}),
      },
    });
    return NextResponse.json(product);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    // SUPER_ADMIN role guard
    const session = await getSession(req);
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Only Super Admin can delete product records." }, { status: 403 });
    }
    const org_id = session.org_id;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    await prisma.product.delete({
      where: { id, org_id },
    });

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
