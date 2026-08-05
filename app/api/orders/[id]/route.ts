import { NextResponse } from "next/server";
import { ERPService } from "@/lib/services/erpService";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const orderData = await ERPService.getDeliveryOrderForAutoPopulate(params.id);
    if (!orderData) {
      return NextResponse.json({ error: "Delivery Order not found" }, { status: 404 });
    }
    return NextResponse.json(orderData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
