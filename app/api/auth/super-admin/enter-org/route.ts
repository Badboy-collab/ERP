import { NextResponse } from "next/server";
import { getSession, signJWT } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { org_id } = await req.json();

    if (!org_id) {
      return NextResponse.json({ error: "org_id is required" }, { status: 400 });
    }

    const org = await prisma.organization.findUnique({ where: { id: org_id } });

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Update the session payload with the impersonated org_id
    const newPayload = {
      ...session,
      org_id: org.id,
      org_name: org.name
    };

    const token = await signJWT(newPayload);

    const response = NextResponse.json({
      success: true,
      user: newPayload
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
