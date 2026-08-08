import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getSession(req);
    if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "ORG_ADMIN")) {
      return NextResponse.json({ error: "Forbidden: Only Admin can update branding." }, { status: 403 });
    }
    const org_id = session.org_id;

    const formData = await req.formData();
    const type = formData.get("type") as string; // 'logo' or 'favicon'
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (type !== 'logo' && type !== 'favicon') {
      return NextResponse.json({ error: "Invalid type. Must be 'logo' or 'favicon'" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    
    // Check file size (max 2MB to prevent huge DB bloat)
    if (bytes.byteLength > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds 2MB limit. Please upload a smaller image." }, { status: 400 });
    }

    const buffer = Buffer.from(bytes);
    const mimeType = file.type;
    const base64Data = buffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    // Update DB
    const updateData = type === 'logo' ? { logo_url: dataUrl } : { favicon_url: dataUrl };
    
    const updatedOrg = await prisma.organization.update({
      where: { id: org_id },
      data: updateData,
    });

    return NextResponse.json({ 
      message: `${type === 'logo' ? 'Logo' : 'Favicon'} updated successfully`,
      url: dataUrl
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
