import Navbar from "@/components/Navbar";
import { ERPService } from "@/lib/services/erpService";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/auth";
import {
  TrendingUp,
  AlertTriangle,
  Layers,
  Clock,
  ArrowRight,
  Package,
} from "lucide-react";

export const revalidate = 0;

export default async function DashboardPage() {
  const cookieStore = cookies();
  const token = cookieStore.get("session")?.value;
  const user = token ? await verifyJWT(token) : null;

  // Enforce depot isolation for non-super admins
  const depotId = user && user.role !== "SUPER_ADMIN" ? user.depot_id : undefined;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaySalesAgg = await prisma.salesLog.aggregate({
    where: { 
      date: { gte: today },
      ...(depotId ? { depot_id: depotId } : {})
    },
    _sum: { quantity: true },
  });

  const pendingOrdersCount = await prisma.deliveryOrder.count({
    where: { 
      status: "Pending",
      ...(depotId ? { depot_id: depotId } : {})
    },
  });

  const activeLotsCount = await prisma.lotTracker.count({
    where: { 
      available_qty: { gt: 0 },
      ...(depotId ? { depot_id: depotId } : {})
    },
  });

  const depotsCount = depotId ? 1 : await prisma.depot.count();

  // Expiry Report filtered by depot
  const expiryReport = await ERPService.getDetailedExpiryReport(depotId || undefined);
  const criticalExpiringLots = expiryReport.filter((l) => l.status !== "ACTIVE");

  // Realtime Stock Report filtered by depot
  const realTimeStock = await ERPService.getRealtimeStockReport(depotId || undefined);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950/60 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-3xl space-y-3">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-semibold uppercase tracking-wider border border-emerald-500/30 inline-block">
              Matber Agro Industries Ltd • {user?.role === "SUPER_ADMIN" ? "Global Master ERP Dashboard" : `${user?.depot?.name || "Depot"} Dashboard`}
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Enterprise Depot Operations & Real-Time Stock Control
            </h1>
            <p className="text-sm sm:text-base text-slate-300">
              Integrated Multi-Depot RBAC, Real-time Stock Display (Kg & Bags), Automatic Delivery Order Auto-Populate, FIFO Lotting & Printable Expiry Reports.
            </p>

            <div className="pt-2 flex flex-wrap gap-4">
              <Link
                href="/pos"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2 text-sm"
              >
                <span>Launch Multi-Product POS</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/reports/stock"
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-5 py-2.5 rounded-xl border border-slate-700 transition-all text-sm"
              >
                View Real-Time Stock Ledger (Kg & Bags)
              </Link>
            </div>
          </div>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Sales Today
              </p>
              <p className="text-2xl font-black text-emerald-400 mt-1">
                {todaySalesAgg._sum.quantity || 0}{" "}
                <span className="text-xs text-slate-400 font-normal">Kg</span>
              </p>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Pending DO Orders
              </p>
              <p className="text-2xl font-black text-amber-400 mt-1">
                {pendingOrdersCount}{" "}
                <span className="text-xs text-slate-400 font-normal">active</span>
              </p>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Active Stock Batches
              </p>
              <p className="text-2xl font-black text-blue-400 mt-1">
                {activeLotsCount}{" "}
                <span className="text-xs text-slate-400 font-normal">lots</span>
              </p>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
              <Layers className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Expiring Lots Flagged
              </p>
              <p className="text-2xl font-black text-rose-400 mt-1">
                {criticalExpiringLots.length}{" "}
                <span className="text-xs text-slate-400 font-normal">lots</span>
              </p>
            </div>
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Dynamic Expiry Alerts Overview */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <h2 className="text-lg font-bold text-white">
                Lot Expiry Alert Summary (Sorted by Nearest Exp Date)
              </h2>
            </div>
            <Link
              href="/reports/expiry"
              className="text-xs text-rose-400 hover:underline font-semibold"
            >
              Open Full Printable Expiry Sheet &rarr;
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Lot No</th>
                  <th className="p-3.5">Depot</th>
                  <th className="p-3.5">Product</th>
                  <th className="p-3.5 text-right">Avail Qty</th>
                  <th className="p-3.5">Exp Date</th>
                  <th className="p-3.5 text-center">Days Remaining</th>
                  <th className="p-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {expiryReport.slice(0, 5).map((lot) => (
                  <tr key={lot.lot_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-mono text-emerald-400 font-bold">{lot.lot_no}</td>
                    <td className="p-3.5 text-xs text-slate-300 font-semibold">{lot.depot_name}</td>
                    <td className="p-3.5">
                      <div>{lot.product_name}</div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {lot.product_code}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-bold text-white">
                      {lot.available_bag} bags ({lot.available_kg} kg)
                    </td>
                    <td className="p-3.5 text-xs text-slate-400">
                      {new Date(lot.exp_date).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 text-center font-mono font-bold">
                      {lot.days_to_expiry <= 0 ? (
                        <span className="text-rose-500">EXPIRED</span>
                      ) : (
                        <span>{lot.days_to_expiry} days</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      {lot.status === "URGENT" && (
                        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-950 text-rose-400 border border-rose-800 animate-pulse">
                          🚨 URGENT (&le;10d)
                        </span>
                      )}
                      {lot.status === "WARNING" && (
                        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-950 text-amber-400 border border-amber-800">
                          ⚠️ WARNING (&le;20d)
                        </span>
                      )}
                      {lot.status === "CAUTION" && (
                        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-yellow-950 text-yellow-300 border border-yellow-800">
                          ⚡ CAUTION (&le;30d)
                        </span>
                      )}
                      {lot.status === "ACTIVE" && (
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                          ACTIVE
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {expiryReport.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-slate-500">
                      No active stock lots found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Real-time Stock Display Table Summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">
                Real-Time Stock Display
              </h2>
            </div>
            <Link href="/reports/stock" className="text-xs text-emerald-400 hover:underline font-semibold">
              Open Full Printable Stock Sheet &rarr;
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Category & Product</th>
                  <th className="p-3.5">Code</th>
                  <th className="p-3.5 text-right">Opening (Kg)</th>
                  <th className="p-3.5 text-right">Received (Kg)</th>
                  <th className="p-3.5 text-right font-bold text-blue-400">Total (Kg)</th>
                  <th className="p-3.5 text-right text-rose-400">Sales (Kg)</th>
                  <th className="p-3.5 text-right text-amber-400">Return (Kg)</th>
                  <th className="p-3.5 text-right font-bold text-emerald-400">Balance (Kg)</th>
                  <th className="p-3.5 text-right font-bold text-emerald-300">Balance (Bags)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {realTimeStock.slice(0, 10).map((row) => (
                  <tr key={row.product_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-semibold text-white">
                      <span className="text-[10px] text-emerald-400 block font-normal uppercase">
                        {row.category}
                      </span>
                      {row.name}
                    </td>
                    <td className="p-3.5 font-mono text-slate-400">{row.code}</td>
                    <td className="p-3.5 text-right font-mono text-slate-400">{row.opening_kg.toLocaleString()}</td>
                    <td className="p-3.5 text-right font-mono text-blue-400">+{row.received_kg.toLocaleString()}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-blue-300">{row.total_kg.toLocaleString()}</td>
                    <td className="p-3.5 text-right font-mono text-rose-400">-{row.sales_kg.toLocaleString()}</td>
                    <td className="p-3.5 text-right font-mono text-amber-400">-{row.return_kg.toLocaleString()}</td>
                    <td className="p-3.5 text-right font-mono font-extrabold text-emerald-400">
                      {row.balance_kg.toLocaleString()} kg
                    </td>
                    <td className="p-3.5 text-right font-mono font-extrabold text-emerald-300">
                      {row.balance_bags} bags
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
