import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const org_id = session.org_id;

    const users = await prisma.user.findMany({
      where: { org_id },
      include: { depot: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const org_id = session.org_id;

    const body = await req.json();
    const plainPassword = body.password || "default_hash";
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const user = await prisma.user.create({
      data: {
        org_id,
        name: body.name,
        email: body.email,
        password_hash: hashedPassword,
        role: body.role || "OPERATOR",
        depot_id: body.depot_id || null,
        can_create_do: body.can_create_do ?? false,
        can_edit_sales: body.can_edit_sales ?? false,
        can_delete_sales: body.can_delete_sales ?? false,
        can_create_sales: body.can_create_sales ?? true,
        can_receive_stock: body.can_receive_stock ?? true,
        can_view_reports: body.can_view_reports ?? true,
        can_view_accounting: body.can_view_accounting ?? false,
        can_manage_accounting: body.can_manage_accounting ?? false,
      },
      include: { depot: true },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  try {
    // SUPER_ADMIN role guard
    const session = await getSession(req);
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Only Super Admin can edit user accounts." }, { status: 403 });
    }
    const org_id = session.org_id;

    const body = await req.json();
    const { id, password, ...data } = body;
    
    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const updateData: any = { ...data };
    if (password && password.trim() !== "") {
      updateData.password_hash = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id, org_id },
      data: updateData,
      include: { depot: true },
    });
    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    // SUPER_ADMIN role guard
    const session = await getSession(req);
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Only Super Admin can delete user accounts." }, { status: 403 });
    }
    const org_id = session.org_id;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id, org_id },
    });
    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
