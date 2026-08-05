import { NextResponse } from "next/server";
import { ERPService } from "@/lib/services/erpService";
import { verifyJWT } from "@/lib/auth";

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

    // Enforce depot isolation for non-super admins
    if (user.role !== "SUPER_ADMIN") {
      depotId = user.depot_id || "no-depot";
    }

    const transactions = await ERPService.getDepotTransactions(depotId);
    const summary = await ERPService.getDepotCashBalance(depotId);

    // Also include category lists for convenience
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
    // Enforce depot isolation for non-super admins
    if (user.role !== "SUPER_ADMIN") {
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
