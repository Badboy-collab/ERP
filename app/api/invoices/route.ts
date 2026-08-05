import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || undefined;

    const invoices = await prisma.invoice.findMany({
      where: query
        ? {
            OR: [
              { invoice_no: { contains: query } },
              { dealer: { name: { contains: query } } },
              { destination: { contains: query } },
            ],
          }
        : undefined,
      include: {
        dealer: true,
        order: true,
        items: {
          include: {
            product: true,
            lot: true,
          },
        },
      },
      orderBy: { date: "desc" },
      take: 100,
    });

    return NextResponse.json(invoices);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
