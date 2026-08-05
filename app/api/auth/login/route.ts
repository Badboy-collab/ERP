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

    // Find user (by email/username or display name case-insensitively)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: email, mode: "insensitive" } },
          { name: { equals: email, mode: "insensitive" } }
        ]
      },
      include: { depot: true }
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
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
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Sign JWT Session
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
