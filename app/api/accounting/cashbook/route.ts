import { NextResponse } from "next/server";
import { ERPService } from "@/lib/services/erpService";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const org_id = session.org_id;

    const { searchParams } = new URL(req.url);
    let depotId = searchParams.get("depot_id") || undefined;

    // Enforce depot isolation for non-super admins & non-org admins
    if (session.role !== "SUPER_ADMIN" && session.role !== "ORG_ADMIN") {
      depotId = session.depot_id || "no-depot";
    }

    const transactions = await ERPService.getDepotTransactions(org_id, depotId);
    const summary = await ERPService.getDepotCashBalance(org_id, depotId);

    return NextResponse.json({
      transactions,
      summary,
      categories: {
        inflow: ERPService.FUND_INFLOW_CATEGORIES,
        expense: ERPService.EXPENSE_CATEGORIES,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const org_id = session.org_id;

    const body = await req.json();

    let depotId = body.depot_id;
    if (session.role !== "SUPER_ADMIN" && session.role !== "ORG_ADMIN") {
      depotId = session.depot_id || "";
    }

    if (!depotId) {
      return NextResponse.json({ error: "Depot ID is required" }, { status: 400 });
    }

    const transaction = await ERPService.recordDepotTransaction(org_id, {
      depot_id: depotId,
      transaction_type: body.transaction_type,
      category: body.category,
      amount: parseFloat(body.amount),
      date: body.date,
      remarks: body.remarks,
      created_by: session.name,
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const org_id = session.org_id;

    const body = await req.json();
    const { id, amount, category, transaction_type, remarks, date } = body;

    const updated = await prisma.depotTransaction.update({
      where: { id, org_id },
      data: {
        ...(amount !== undefined ? { amount: parseFloat(amount) } : {}),
        ...(category ? { category } : {}),
        ...(transaction_type ? { transaction_type } : {}),
        ...(remarks !== undefined ? { remarks } : {}),
        ...(date ? { date: new Date(date) } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const org_id = session.org_id;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "DepotTransaction ID is required" }, { status: 400 });
    }

    await prisma.depotTransaction.delete({
      where: { id, org_id },
    });

    return NextResponse.json({ message: "Petty cash entry deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
