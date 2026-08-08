import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { promises as fs } from "fs";
import path from "path";

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
    const buffer = Buffer.from(bytes);

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const ext = file.name.split(".").pop();
    const fileName = `${org_id}_${type}_${Date.now()}.${ext}`;
    const filePath = path.join(uploadDir, fileName);

    // Write file
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${fileName}`;

    // Update DB
    const updateData = type === 'logo' ? { logo_url: publicUrl } : { favicon_url: publicUrl };
    
    const updatedOrg = await prisma.organization.update({
      where: { id: org_id },
      data: updateData,
    });

    return NextResponse.json({ 
      message: `${type === 'logo' ? 'Logo' : 'Favicon'} updated successfully`,
      url: publicUrl
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
