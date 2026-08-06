// app/api/admin/deliveryOrders/route.ts
import { NextResponse } from 'next/server';
import { ERPService } from '@/lib/services/erpService';
import { getSession } from '@/lib/auth';

/**
 * API handler for Delivery Orders management (admin side).
 * Supports:
 *  - GET: list delivery orders (with optional filters)
 *  - PUT: update an existing delivery order (SUPER_ADMIN only)
 *  - DELETE: delete a delivery order (SUPER_ADMIN only)
 */

function ensureSuperAdmin(session: any) {
  if (session.role !== 'SUPER_ADMIN') {
    throw new Error('Permission denied: Super Admin only');
  }
}

export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  const org_id = session.org_id;

  const url = new URL(request.url);
  const depotId = url.searchParams.get('depot_id') ?? undefined;

  const { prisma } = await import('@/lib/prisma');
  const orders = await prisma.deliveryOrder.findMany({
    where: {
      org_id,
      ...(depotId ? { depot_id: depotId } : {}),
    },
    include: {
      dealer: true,
      depot: true,
      items: { include: { product: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(orders);
}

export async function PUT(request: Request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  try { ensureSuperAdmin(session); } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 403 }); }
  const org_id = session.org_id;

  try {
    const body = await request.json();
    if (!body.id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const updated = await ERPService.updateDeliveryOrder({
      org_id,
      id: body.id,
      ...(body.dealer_id && { dealer_id: body.dealer_id }),
      ...(body.order_date && { order_date: new Date(body.order_date) }),
      ...(body.remarks !== undefined && { remarks: body.remarks }),
      ...(body.status && { status: body.status }),
      ...(body.items && { items: body.items }),
    });
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  try { ensureSuperAdmin(session); } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 403 }); }
  const org_id = session.org_id;

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id query parameter required' }, { status: 400 });

    const result = await ERPService.deleteDeliveryOrder({ org_id, id });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
