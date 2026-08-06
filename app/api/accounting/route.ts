import { NextResponse } from "next/server";
import { ERPService } from "@/lib/services/erpService";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const org_id = session.org_id;

    const { searchParams } = new URL(req.url);
    const depot_id = searchParams.get("depot_id");
    const dealer_id = searchParams.get("dealer_id");
    const date_from = searchParams.get("date_from");
    const date_to = searchParams.get("date_to");

    const where: any = { org_id };
    if (depot_id) where.depot_id = depot_id;
    if (dealer_id) where.dealer_id = dealer_id;
    
    if (date_from || date_to) {
      where.date = {};
      if (date_from) where.date.gte = new Date(date_from);
      if (date_to) where.date.lte = new Date(date_to);
    }

    const transactions = await prisma.financialTransaction.findMany({
      where,
      include: {
        depot: true,
        dealer: true,
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(transactions);
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
    const result = await ERPService.recordPayment(org_id, body);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
