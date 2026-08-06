import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const org_id = session.org_id;

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || undefined;

    const invoices = await prisma.invoice.findMany({
      where: {
        org_id,
        ...(query ? {
            OR: [
              { invoice_no: { contains: query } },
              { dealer: { name: { contains: query } } },
              { destination: { contains: query } },
            ],
          } : {})
      },
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
