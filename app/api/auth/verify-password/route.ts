import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const sessionUser = await getSession();
    if (!sessionUser || !sessionUser.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { password } = await req.json();
    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id }
    });

    if (!user || !user.password_hash) {
      return NextResponse.json({ error: "User not found or misconfigured" }, { status: 404 });
    }

    // Check password
    let isMatch = false;
    if (user.password_hash.startsWith("$2a$") || user.password_hash.startsWith("$2b$")) {
      isMatch = await bcrypt.compare(password, user.password_hash);
    } else {
      isMatch = password === user.password_hash;
    }

    if (!isMatch) {
      return NextResponse.json({ error: "Incorrect password. Authorization denied." }, { status: 403 });
    }

    return NextResponse.json({ success: true, message: "Password verified" });
  } catch (error: any) {
    console.error("Verify Password Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
