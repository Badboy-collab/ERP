import { NextResponse } from "next/server";
import { ERPService } from "@/lib/services/erpService";
import { verifyJWT } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const sessionToken = req.headers.get("cookie")
      ?.split(";")
      .find((c) => c.trim().startsWith("session="))
      ?.split("=")[1];

    const user = sessionToken ? await verifyJWT(sessionToken) : null;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    let depotId = searchParams.get("depot_id") || undefined;

    // Enforce depot isolation for non-super admins & non-org admins
    if (user.role !== "SUPER_ADMIN" && user.role !== "ORG_ADMIN") {
      depotId = user.depot_id || "no-depot";
    }

    const transactions = await ERPService.getDepotTransactions(depotId);
    const summary = await ERPService.getDepotCashBalance(depotId);

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
    const sessionToken = req.headers.get("cookie")
      ?.split(";")
      .find((c) => c.trim().startsWith("session="))
      ?.split("=")[1];

    const user = sessionToken ? await verifyJWT(sessionToken) : null;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    let depotId = body.depot_id;
    if (user.role !== "SUPER_ADMIN" && user.role !== "ORG_ADMIN") {
      depotId = user.depot_id || "";
    }

    if (!depotId) {
      return NextResponse.json({ error: "Depot ID is required" }, { status: 400 });
    }

    const transaction = await ERPService.recordDepotTransaction({
      depot_id: depotId,
      transaction_type: body.transaction_type,
      category: body.category,
      amount: parseFloat(body.amount),
      date: body.date,
      remarks: body.remarks,
      created_by: user.name,
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, amount, category, transaction_type, remarks, date } = body;

    const updated = await prisma.depotTransaction.update({
      where: { id },
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
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "DepotTransaction ID is required" }, { status: 400 });
    }

    await prisma.depotTransaction.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Petty cash entry deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
