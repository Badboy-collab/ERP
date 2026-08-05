import { NextResponse } from "next/server";
import { ERPService } from "@/lib/services/erpService";
import { verifyJWT } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const sessionToken = req.headers.get("cookie")
      ?.split(";")
      .find((c) => c.trim().startsWith("session="))
      ?.split("=")[1];

    const user = sessionToken ? await verifyJWT(sessionToken) : null;
    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "STOCK") {
      const { depot_id, product_id, quantity } = body;
      if (!depot_id || !product_id || quantity === undefined) {
        return NextResponse.json({ error: "Missing required fields for stock setup" }, { status: 400 });
      }

      const result = await ERPService.initializeOpeningStock({
        depot_id,
        product_id,
        quantity: parseFloat(quantity)
      });
      return NextResponse.json({ success: true, result });
    } 
    
    if (action === "CASH") {
      const { depot_id, amount } = body;
      if (!depot_id || amount === undefined) {
        return NextResponse.json({ error: "Missing required fields for petty cash setup" }, { status: 400 });
      }

      const result = await ERPService.initializeOpeningPettyCash({
        depot_id,
        amount: parseFloat(amount)
      });
      return NextResponse.json({ success: true, result });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
