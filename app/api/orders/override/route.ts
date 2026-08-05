import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ERPService } from "@/lib/services/erpService";

export async function PUT(req: Request) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Only Super Admin can override delivery orders." }, { status: 403 });
    }

    const { id, dealer_id, order_date, remarks } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Delivery Order ID is required" }, { status: 400 });
    }

    const updated = await ERPService.updateDeliveryOrder({ id, dealer_id, order_date, remarks });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Only Super Admin can delete delivery orders." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Delivery Order ID is required" }, { status: 400 });
    }

    const result = await ERPService.deleteDeliveryOrder({ id });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
