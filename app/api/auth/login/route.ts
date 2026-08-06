import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signJWT } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { organization, email, password } = await req.json();

    if (!organization) {
      return NextResponse.json({ error: "Organization Name is required." }, { status: 400 });
    }

    if (!email || !password) {
      return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
    }

    // 1. Find Organization
    const org = await prisma.organization.findFirst({
      where: { 
        OR: [
          { name: { equals: organization, mode: "insensitive" } },
          { slug: { equals: organization, mode: "insensitive" } }
        ]
      }
    });

    if (!org) {
      return NextResponse.json({ error: "Organization not found." }, { status: 404 });
    }

    // 2. Find User inside that Organization
    const user = await prisma.user.findFirst({
      where: {
        org_id: org.id,
        OR: [
          { email: { equals: email, mode: "insensitive" } },
          { name: { equals: email, mode: "insensitive" } }
        ]
      },
      include: { depot: true, organization: true }
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid username." }, { status: 401 });
    }

    if (user.role === "SUPER_ADMIN") {
      return NextResponse.json({ error: "Super Admins must use the Super Admin portal." }, { status: 403 });
    }

    // Check password (support legacy plaintext check and automatic bcrypt upgrade)
    let isMatch = false;
    if (user.password_hash.startsWith("$2b$") || user.password_hash.startsWith("$2a$") || user.password_hash.startsWith("$2y$")) {
      isMatch = await bcrypt.compare(password, user.password_hash);
    } else {
      isMatch = password === user.password_hash;
      if (isMatch) {
        // Automatically upgrade legacy plaintext password to bcrypt hash
        const hashed = await bcrypt.hash(password, 10);
        await prisma.user.update({
          where: { id: user.id },
          data: { password_hash: hashed }
        });
      }
    }

    if (!isMatch) {
      return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
    }

    // Sign JWT Session
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      org_id: user.org_id || '',
      org_name: user.organization?.name || '',
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

    // Set cookie
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
