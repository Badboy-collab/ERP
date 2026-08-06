import { NextResponse } from "next/server";
import { ERPService } from "@/lib/services/erpService";
import { getSession } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const org_id = session.org_id;

    const orderData = await ERPService.getDeliveryOrderForAutoPopulate(org_id, params.id);
    if (!orderData) {
      return NextResponse.json({ error: "Delivery Order not found" }, { status: 404 });
    }
    return NextResponse.json(orderData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
