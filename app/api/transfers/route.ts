import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET /api/transfers?to_depot_id=X&status=IN_TRANSIT
export async function GET(req: Request) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const org_id = session.org_id;

    const { searchParams } = new URL(req.url);
    const to_depot_id = searchParams.get("to_depot_id") || undefined;
    const from_depot_id = searchParams.get("from_depot_id") || undefined;
    const status = searchParams.get("status") || undefined;

    const transfers = await prisma.stockTransfer.findMany({
      where: {
        org_id,
        ...(to_depot_id ? { to_depot_id } : {}),
        ...(from_depot_id ? { from_depot_id } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        fromDepot: true,
        toDepot: true,
        product: true,
        lot: true,
      },
      orderBy: { transfer_date: "desc" },
    });

    return NextResponse.json(transfers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/transfers — Dispatch Inter-Branch or Factory Transfer
export async function POST(req: Request) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const org_id = session.org_id;

    const body = await req.json();
    const { from_depot_id, to_depot_id, product_id, lot_id, quantity, notes, created_by } = body;

    if (!product_id || !quantity || quantity <= 0) {
      return NextResponse.json({ error: "Invalid product or quantity" }, { status: 400 });
    }

    if (!from_depot_id && !to_depot_id) {
      return NextResponse.json({ error: "Transfer must have a source or destination depot" }, { status: 400 });
    }

    const qtyKg = parseFloat(quantity);

    const result = await prisma.$transaction(async (tx) => {
      let lotObj = null;

      // 1. Deduct from Sender Depot Lot if transferring from a depot
      if (from_depot_id && lot_id) {
        const lot = await tx.lotTracker.findUnique({ where: { id: lot_id } });
        if (!lot) throw new Error("Lot not found");
        if (lot.available_qty < qtyKg) {
          throw new Error(`Insufficient available stock in lot ${lot.lot_no}. Available: ${lot.available_qty} kg`);
        }

        const newAvailable = lot.available_qty - qtyKg;
        const newTransfer = (lot.transfer_qty || 0) + qtyKg;
        const newStatus = newAvailable <= 0 ? "Depleted" : lot.status;

        await tx.lotTracker.update({
          where: { id: lot.id },
          data: {
            available_qty: newAvailable,
            transfer_qty: newTransfer,
            status: newStatus,
          },
        });
        lotObj = lot;
      }

      // 2. Determine Initial Status
      // If destination is Factory (to_depot_id is null), it completes immediately as a Return
      const isFactoryDestination = !to_depot_id;
      const initialStatus = isFactoryDestination ? "COMPLETED" : "IN_TRANSIT";

      // 3. Create StockTransfer record
      const transfer = await tx.stockTransfer.create({
        data: {
          org_id,
          from_depot_id: from_depot_id || null,
          to_depot_id: to_depot_id || null,
          product_id,
          lot_id: lot_id || null,
          quantity: qtyKg,
          status: initialStatus,
          transfer_date: new Date(),
          receive_date: isFactoryDestination ? new Date() : null,
          created_by: created_by || "System",
          notes: notes || null,
        },
        include: {
          fromDepot: true,
          toDepot: true,
          product: true,
        },
      });

      return transfer;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// PUT /api/transfers — Receive Stock at Destination Depot
export async function PUT(req: Request) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const org_id = session.org_id;

    const body = await req.json();
    const { transfer_id } = body;

    if (!transfer_id) {
      return NextResponse.json({ error: "Transfer ID is required" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const transfer = await tx.stockTransfer.findUnique({
        where: { id: transfer_id, org_id },
        include: { product: true },
      });

      if (!transfer) throw new Error("Stock transfer record not found");
      if (transfer.status === "COMPLETED") throw new Error("Transfer is already marked as received");
      if (!transfer.to_depot_id) throw new Error("Destination is not a valid depot");

      const receiveDate = new Date();

      // 1. Update StockTransfer status to COMPLETED
      const updatedTransfer = await tx.stockTransfer.update({
        where: { id: transfer_id },
        data: {
          status: "COMPLETED",
          receive_date: receiveDate,
        },
      });

      // 2. Create a new active LotTracker record for destination depot
      const lotNo = `TRANS-${transfer.id.slice(-6).toUpperCase()}`;
      const mfgDate = new Date();
      const expDate = new Date();
      expDate.setFullYear(mfgDate.getFullYear() + 2); // 2 years default

      await tx.lotTracker.create({
        data: {
          org_id,
          depot_id: transfer.to_depot_id,
          product_id: transfer.product_id,
          lot_no: lotNo,
          mfg_date: mfgDate,
          exp_date: expDate,
          initial_qty: transfer.quantity,
          available_qty: transfer.quantity,
          status: "Active",
        },
      });

      // 3. Create a ReceiveLog for monthly stock / audit report
      await tx.receiveLog.create({
        data: {
          org_id,
          depot_id: transfer.to_depot_id,
          product_id: transfer.product_id,
          lot_id: (await tx.lotTracker.findFirst({ where: { lot_no: lotNo, depot_id: transfer.to_depot_id } }))!.id,
          invoice_no: `TRX-${transfer.id.slice(-6).toUpperCase()}`,
          receive_date: receiveDate,
          quantity: Math.round(transfer.quantity),
        },
      });

      return updatedTransfer;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
