"use client";

import { useEffect, useState } from "react";
import { History, RefreshCw, Trash2 } from "lucide-react";
import { getSessionUser, SessionUser } from "@/lib/userSession";

interface SalesLog {
  id: string;
  invoice_no: string;
  date: string;
  quantity: number;
  dealer: { name: string };
  product: { name: string; code: string };
  lot: { lot_no: string };
  order?: { order_no: string } | null;
}

export function RecentSalesTable() {
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [sales, setSales] = useState<SalesLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sales");
      if (res.ok) {
        setSales(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentUser(getSessionUser());
    fetchSales();
  }, []);

  const handleDelete = async (logId: string) => {
    if (currentUser?.role !== "SUPER_ADMIN") {
      alert("Permission Denied: Only Super Admin (Level 1) can reverse and delete sales records.");
      return;
    }
    if (!confirm("Are you sure you want to reverse & delete this sales record? Stock will be restored and dealer balance updated automatically.")) return;
    try {
      const res = await fetch(`/api/sales?id=${logId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to reverse sales log");
      fetchSales();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
        <div className="flex items-center space-x-2">
          <History className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-bold text-white">Recent Sales Log</h3>
        </div>
        <button
          onClick={fetchSales}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-950 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <tr>
              <th className="p-3.5">Invoice #</th>
              <th className="p-3.5">Date</th>
              <th className="p-3.5">Dealer</th>
              <th className="p-3.5">Product</th>
              <th className="p-3.5">Lot No</th>
              <th className="p-3.5">Order No</th>
              <th className="p-3.5 text-right">Qty (Kg)</th>
              {currentUser?.role === "SUPER_ADMIN" && <th className="p-3.5 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-200 font-medium">
            {sales.length === 0 ? (
              <tr>
                <td colSpan={currentUser?.role === "SUPER_ADMIN" ? 8 : 7} className="text-center py-8 text-slate-500">
                  No sales recorded yet. Use the Sales Entry POS above to execute a sale.
                </td>
              </tr>
            ) : (
              sales.map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 font-mono text-emerald-400 font-bold">{s.invoice_no}</td>
                  <td className="p-3.5 text-xs text-slate-400">
                    {new Date(s.date).toLocaleDateString()}
                  </td>
                  <td className="p-3.5">{s.dealer?.name}</td>
                  <td className="p-3.5">
                    <div>{s.product?.name}</div>
                    <span className="text-[11px] font-mono text-slate-400">{s.product?.code}</span>
                  </td>
                  <td className="p-3.5 font-mono text-xs text-slate-300">{s.lot?.lot_no}</td>
                  <td className="p-3.5 font-mono text-xs">
                    {s.order?.order_no ? (
                      <span className="text-amber-400">{s.order.order_no}</span>
                    ) : (
                      <span className="text-slate-500">Direct</span>
                    )}
                  </td>
                  <td className="p-3.5 text-right font-bold text-white">{s.quantity.toLocaleString()} kg</td>
                  {currentUser?.role === "SUPER_ADMIN" && (
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-950 transition-colors"
                        title="Reverse & Delete Sale Record (Restores Lot Stock)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
