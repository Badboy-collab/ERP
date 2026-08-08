import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ error: "Organization name is required" }, { status: 400 });
    }

    const org = await prisma.organization.findFirst({
      where: {
        name: {
          equals: slug,
          mode: "insensitive"
        }
      },
      select: {
        id: true,
        name: true,
        logo_url: true,
        favicon_url: true
      }
    });

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    return NextResponse.json(org);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
