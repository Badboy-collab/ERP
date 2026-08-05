"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { ClipboardList, Filter, RefreshCw, CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface DeliveryOrderItem {
  id: string;
  ordered_qty: number;
  delivered_qty: number;
  pending_qty: number;
  product: {
    code: string;
    name: string;
  };
}

interface DeliveryOrder {
  id: string;
  order_no: string;
  order_date: string;
  status: "Pending" | "Partial" | "Complete";
  depot: {
    id: string;
    name: string;
    code: string;
  };
  dealer: {
    name: string;
    phone: string;
  };
  items: DeliveryOrderItem[];
}

interface Depot {
  id: string;
  name: string;
  code: string;
}

export default function DeliveryOrderListPage() {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [selectedDepotId, setSelectedDepotId] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchDepots();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [selectedDepotId, selectedStatus]);

  const fetchDepots = async () => {
    try {
      const res = await fetch("/api/admin/depots");
      if (res.ok) setDepots(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let url = `/api/orders?`;
      if (selectedDepotId) url += `depot_id=${selectedDepotId}&`;
      if (selectedStatus) url += `status=${selectedStatus}&`;

      const res = await fetch(url);
      if (res.ok) setOrders(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-emerald-400" />
              Delivery Orders (D.O) Master Management
            </h1>
            <p className="text-sm text-slate-400">
              Role-Based Access Control: Real-time tracking of D.O statuses (Pending, Partial, Complete) across depot branches.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-emerald-400" />
              <select
                value={selectedDepotId}
                onChange={(e) => setSelectedDepotId(e.target.value)}
                className="bg-transparent text-white font-semibold focus:outline-none"
              >
                <option value="" className="bg-slate-900">All Depots Consolidated</option>
                {depots.map((d) => (
                  <option key={d.id} value={d.id} className="bg-slate-900">
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent text-white font-semibold focus:outline-none"
              >
                <option value="" className="bg-slate-900">All Statuses</option>
                <option value="Pending" className="bg-slate-900">Pending Only</option>
                <option value="Partial" className="bg-slate-900">Partial Only</option>
                <option value="Complete" className="bg-slate-900">Complete Only</option>
              </select>
            </div>

            <button
              onClick={fetchOrders}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2 rounded-xl border border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* D.O Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-4">D.O Ref No</th>
                  <th className="p-4">Order Date</th>
                  <th className="p-4">Depot</th>
                  <th className="p-4">Dealer Name</th>
                  <th className="p-4">Products & Quantities Breakdown</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500 animate-pulse">
                      Loading Delivery Orders...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500">
                      No Delivery Orders found for this selection.
                    </td>
                  </tr>
                ) : (
                  orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-mono font-bold text-emerald-400">{ord.order_no}</td>
                      <td className="p-4 text-xs text-slate-400">
                        {new Date(ord.order_date).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-xs font-semibold text-slate-300">
                        {ord.depot?.name}
                      </td>
                      <td className="p-4 font-semibold text-white">
                        {ord.dealer?.name}
                        <span className="text-xs text-slate-400 block font-normal font-mono">
                          {ord.dealer?.phone}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          {ord.items.map((it) => (
                            <div key={it.id} className="text-xs flex justify-between gap-4 font-mono">
                              <span className="text-slate-300">[{it.product.code}] {it.product.name}</span>
                              <span className="text-slate-400">
                                Ord: {it.ordered_qty} | Del: {it.delivered_qty} | Pnd:{" "}
                                <strong className={it.pending_qty > 0 ? "text-amber-400" : "text-emerald-400"}>
                                  {it.pending_qty}
                                </strong>
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        {ord.status === "Complete" && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                            COMPLETE
                          </span>
                        )}
                        {ord.status === "Partial" && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-950 text-amber-400 border border-amber-800 animate-pulse">
                            PARTIAL
                          </span>
                        )}
                        {ord.status === "Pending" && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                            PENDING
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
