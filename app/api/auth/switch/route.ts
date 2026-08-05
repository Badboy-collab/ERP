import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signJWT } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Find the requested user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { depot: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Sign new JWT session
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      depot_id: user.depot_id,
      depot: user.depot ? { id: user.depot.id, name: user.depot.name, code: user.depot.code } : null,
      can_create_do: user.can_create_do,
      can_edit_sales: user.can_edit_sales,
      can_delete_sales: user.can_delete_sales,
      can_create_sales: user.can_create_sales,
      can_receive_stock: user.can_receive_stock,
      can_view_reports: user.can_view_reports,
      can_view_accounting: user.can_view_accounting,
      can_manage_accounting: user.can_manage_accounting,
    };

    const token = await signJWT(payload);

    const response = NextResponse.json({
      success: true,
      user: payload
    });

    response.cookies.set({
      name: "session",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
