import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signJWT } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: email, mode: "insensitive" } },
          { name: { equals: email, mode: "insensitive" } }
        ]
      },
      include: { depot: true, organization: true }
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Strictly enforce Super Admin role
    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied. Master Admin privileges required." }, { status: 403 });
    }

    // Check password
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
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Sign JWT Session
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      org_id: '', // Super Admin starts outside any organization
      org_name: 'MASTER SYSTEM',
      depot_id: null,
      depot: null,
      can_create_do: true,
      can_edit_sales: true,
      can_delete_sales: true,
      can_create_sales: true,
      can_receive_stock: true,
      can_view_reports: true,
      can_view_accounting: true,
      can_manage_accounting: true,
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
