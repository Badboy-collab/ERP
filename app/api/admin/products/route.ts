import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: [{ sort_order: "asc" }, { category: "asc" }, { code: "asc" }],
    });
    return NextResponse.json(products);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const product = await prisma.product.create({
      data: {
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
    const body = await req.json();
    const { id, code, name, category, bag_size_kg, opening_stock, sort_order } = body;

    const product = await prisma.product.update({
      where: { id },
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
