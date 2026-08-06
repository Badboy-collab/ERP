import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const orgs = await prisma.organization.findMany({
      include: {
        _count: {
          select: { users: true }
        },
        users: {
          where: { role: { in: ["SUPER_ADMIN", "ORG_ADMIN", "DEPOT_ADMIN"] } },
          select: { name: true, role: true },
          take: 1,
        }
      },
      orderBy: { name: 'asc' }
    });

    const formattedOrgs = orgs.map(org => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      logo_url: org.logo_url,
      status: org.status,
      total_users: org._count.users,
      main_admin: org.users[0]?.name || "N/A"
    }));

    // Stats
    const activeOrgs = orgs.filter(o => o.status === "Active").length;
    const suspendedOrgs = orgs.filter(o => o.status === "Suspended").length;
    const totalUsers = orgs.reduce((sum, org) => sum + org._count.users, 0);

    return NextResponse.json({
      organizations: formattedOrgs,
      stats: {
        total: orgs.length,
        active: activeOrgs,
        suspended: suspendedOrgs,
        totalUsers
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
