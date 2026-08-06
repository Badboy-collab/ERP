import Navbar from "@/components/Navbar";
import { ERPService } from "@/lib/services/erpService";
import { Layers, CheckCircle2, AlertOctagon, RefreshCw } from "lucide-react";
import Link from "next/link";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/auth";

export const revalidate = 0;

export default async function ReconciliationPage() {
  const cookieStore = cookies();
  const token = cookieStore.get("session")?.value;
  const user = token ? await verifyJWT(token) : null;
  const org_id = (user?.org_id as string) || '';

  const reconciliation = await ERPService.getLotReconciliation(org_id);

  const totalDiscrepancies = reconciliation.filter((item) => !item.isBalanced).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Layers className="w-6 h-6 text-emerald-400" />
              Lot Reconciliation & Inventory Audit
            </h1>
            <p className="text-sm text-slate-400">
              Cross-check total active Lot available quantities against total calculated running stock to audit inventory integrity.
            </p>
          </div>

          <div>
            {totalDiscrepancies === 0 ? (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                All Stock Batches Perfectly Balanced
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-950 text-rose-300 border border-rose-800 font-bold text-sm animate-bounce">
                <AlertOctagon className="w-5 h-5 text-rose-400" />
                {totalDiscrepancies} Stock Discrepancy Found!
              </span>
            )}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Product Code</th>
                  <th className="p-4">Feed Product Name</th>
                  <th className="p-4 text-right">Sum of Active Lot Qty</th>
                  <th className="p-4 text-right">Calculated Running Stock</th>
                  <th className="p-4 text-right">Variance / Discrepancy</th>
                  <th className="p-4 text-center">Audit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {reconciliation.map((item) => (
                  <tr key={item.product_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono text-emerald-400 font-bold">{item.code}</td>
                    <td className="p-4 font-semibold text-white">{item.name}</td>
                    <td className="p-4 text-right text-base font-bold text-slate-200">
                      {item.total_lot_available} bags
                    </td>
                    <td className="p-4 text-right text-base font-bold text-slate-200">
                      {item.calculated_running_stock} bags
                    </td>
                    <td className="p-4 text-right font-mono font-extrabold text-base">
                      {item.discrepancy === 0 ? (
                        <span className="text-slate-500">0</span>
                      ) : item.discrepancy > 0 ? (
                        <span className="text-amber-400">+{item.discrepancy}</span>
                      ) : (
                        <span className="text-rose-400">{item.discrepancy}</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {item.isBalanced ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5" /> BALANCED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-950 text-rose-400 border border-rose-800">
                          <AlertOctagon className="w-3.5 h-3.5" /> DISCREPANCY
                        </span>
                      )}
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
