import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        depot_id: true,
        can_create_do: true,
        can_edit_sales: true,
        can_delete_sales: true,
        can_create_sales: true,
        can_receive_stock: true,
        can_view_reports: true,
        can_view_accounting: true,
        can_manage_accounting: true,
        depot: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: { role: "asc" },
    });
    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
