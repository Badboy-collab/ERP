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
    const dealerId = searchParams.get("dealer_id") || undefined;
    const depotId = searchParams.get("depot_id") || undefined;
    const status = searchParams.get("status") || undefined;
    const dateFrom = searchParams.get("date_from") || undefined;
    const dateTo = searchParams.get("date_to") || undefined;
    const searchText = searchParams.get("search") || undefined;
    const limit = Number(searchParams.get("limit") || 1000);
    const offset = Number(searchParams.get("offset") || 0);
    const sortField = searchParams.get("sort_field") || "order_date";
    const sortDirection = searchParams.get("sort_direction") === "asc" ? "asc" : "desc";

    const whereClause: any = {
      org_id,
      ...(dealerId ? { dealer_id: dealerId } : {}),
      ...(depotId ? { depot_id: depotId } : {}),
      ...(status ? { status } : {}),
      ...(dateFrom || dateTo
        ? {
            order_date: {
              ...(dateFrom ? { gte: new Date(`${dateFrom}T00:00:00.000Z`) } : {}),
              ...(dateTo ? { lte: new Date(`${dateTo}T23:59:59.999Z`) } : {}),
            },
          }
        : {}),
      ...(searchText
        ? {
            OR: [
              { order_no: { contains: searchText, mode: "insensitive" } },
              { dealer: { name: { contains: searchText, mode: "insensitive" } } },
              { depot: { name: { contains: searchText, mode: "insensitive" } } },
              { items: { some: { product: { name: { contains: searchText, mode: "insensitive" } } } } },
            ],
          }
        : {}),
    };

    const orders = await prisma.deliveryOrder.findMany({
      where: whereClause,
      include: {
        dealer: true,
        depot: true,
        items: {
          include: { product: true },
        },
      },
      orderBy: [{ [sortField]: sortDirection }],
      skip: offset,
      take: limit,
    });

    return NextResponse.json(orders);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let parsedBody: any = null;
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const org_id = session.org_id;

    parsedBody = await req.json();
    const result = await ERPService.createDeliveryOrder(org_id, parsedBody);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
