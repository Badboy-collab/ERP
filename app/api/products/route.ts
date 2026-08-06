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
        bag_size_kg: Number(body.bag_size_kg) || 50.0,
        opening_stock: Number(body.opening_stock) || 0,
      },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
