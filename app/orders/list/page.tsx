"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { ClipboardList, Filter, RefreshCw, ShieldCheck, Building2, AlertCircle } from "lucide-react";
import { getSessionUser, SessionUser, hasGlobalAccess, isSuperAdmin } from "@/lib/userSession";

interface DeliveryOrderItem {
  id: string;
  ordered_qty: number;
  delivered_qty: number;
  pending_qty: number;
  product: { code: string; name: string; bag_size_kg: number };
}

interface DeliveryOrder {
  id: string;
  order_no: string;
  order_date: string;
  status: "Pending" | "Partial" | "Complete";
  depot: { id: string; name: string; code: string };
  dealer: { name: string; phone: string };
  items: DeliveryOrderItem[];
}

interface Depot {
  id: string;
  name: string;
  code: string;
}

export default function DeliveryOrderListPage() {
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [selectedDepotId, setSelectedDepotId] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const user = getSessionUser();
    setCurrentUser(user);

    // For DEPOT_ADMIN / OPERATOR: force-lock to their depot
    if (user && !hasGlobalAccess(user) && user.depot_id) {
      setSelectedDepotId(user.depot_id);
    }

    if (hasGlobalAccess(user)) {
      fetchDepots();
    }
  }, []);

  useEffect(() => {
    if (currentUser !== undefined) {
      fetchOrders();
    }
  }, [selectedDepotId, selectedStatus, currentUser]);

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

      // RBAC: DEPOT_ADMIN / OPERATOR can only see their depot's orders
      const user = getSessionUser();
      if (user && !isSuperAdmin(user) && user.depot_id) {
        url += `depot_id=${user.depot_id}&`;
      } else if (selectedDepotId) {
        url += `depot_id=${selectedDepotId}&`;
      }

      if (selectedStatus) url += `status=${selectedStatus}&`;

      const res = await fetch(url);
      if (res.ok) setOrders(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (status: string) => {
    if (status === "Complete")
      return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">✓ COMPLETE</span>;
    if (status === "Partial")
      return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-800 animate-pulse">◑ PARTIAL</span>;
    return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-300">○ PENDING</span>;
  };

  const userHasGlobal = hasGlobalAccess(currentUser);
  const userIsSuper = isSuperAdmin(currentUser);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-emerald-600" />
              Delivery Orders (D.O) List
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {userIsSuper
                ? "Super Admin View — All depots visible with full filter control."
                : currentUser
                ? `Depot View — Showing orders for: ${currentUser.depot?.name || "Your Depot"} only.`
                : "Please select an active user from the Navbar to apply role-based filters."}
            </p>
          </div>

          {/* Role Badge */}
          <div className="flex items-center gap-2">
            {currentUser ? (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold ${
                userIsSuper
                  ? "bg-amber-50 text-amber-600 border-amber-800"
                  : "bg-sky-950 text-sky-400 border-sky-800"
              }`}>
                <ShieldCheck className="w-3.5 h-3.5" />
                {currentUser.role.replace("_", " ")}
                {!userIsSuper && currentUser.depot && ` • ${currentUser.depot.code}`}
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold bg-rose-50 text-rose-600 border-rose-800">
                <AlertCircle className="w-3.5 h-3.5" />
                No Active Session
              </div>
            )}
          </div>
        </div>

        {/* No session warning */}
        {!currentUser && (
          <div className="bg-amber-50/40 border border-amber-800 rounded-xl px-4 py-3 flex items-center gap-3 text-amber-300 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>
              <strong>Role not set!</strong> Click the <strong>"Switch User"</strong> button in the top-right navbar to select your account. Data is showing unfiltered.
            </span>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Depot Filter — Global visibility for SUPER_ADMIN & ORG_ADMIN */}
          {userHasGlobal && (
            <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs">
              <Building2 className="w-3.5 h-3.5 text-amber-600" />
              <select
                value={selectedDepotId}
                onChange={(e) => setSelectedDepotId(e.target.value)}
                className="bg-transparent text-slate-900 font-semibold focus:outline-none"
              >
                <option value="" className="bg-white">All Depots (Consolidated)</option>
                {depots.map((d) => (
                  <option key={d.id} value={d.id} className="bg-white">
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Depot label for non-admin */}
          {!userIsSuper && currentUser?.depot && (
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs">
              <Building2 className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-slate-900 font-bold">{currentUser.depot.name}</span>
              <span className="text-slate-500">({currentUser.depot.code})</span>
              <span className="text-[10px] text-sky-400 border border-sky-800 bg-sky-950 px-1.5 py-0.5 rounded-full font-bold ml-1">
                🔒 Locked
              </span>
            </div>
          )}

          {/* Status Filter */}
          <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-emerald-600" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-slate-900 font-semibold focus:outline-none"
            >
              <option value="" className="bg-white">All Statuses</option>
              <option value="Pending" className="bg-white">Pending Only</option>
              <option value="Partial" className="bg-white">Partial Only</option>
              <option value="Complete" className="bg-white">Complete Only</option>
            </select>
          </div>

          {/* Refresh */}
          <button
            onClick={fetchOrders}
            className="bg-slate-100 hover:bg-slate-200 text-slate-200 p-2 rounded-xl border border-slate-300 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          {/* Count badge */}
          {!loading && (
            <span className="text-xs text-slate-500 ml-auto">
              <strong className="text-slate-900">{orders.length}</strong> order{orders.length !== 1 ? "s" : ""} found
            </span>
          )}
        </div>

        {/* D.O Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-4">D.O Ref No</th>
                  <th className="p-4">Order Date</th>
                  {(userIsSuper || !currentUser) && <th className="p-4">Depot</th>}
                  <th className="p-4">Dealer</th>
                  <th className="p-4">Products & Qty Breakdown</th>
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
                    <tr key={ord.id} className="hover:bg-slate-100/40 transition-colors">
                      <td className="p-4 font-mono font-bold text-emerald-600">{ord.order_no}</td>
                      <td className="p-4 text-xs text-slate-500">
                        {new Date(ord.order_date).toLocaleDateString("en-BD", {
                          day: "2-digit", month: "short", year: "numeric"
                        })}
                      </td>
                      {(userIsSuper || !currentUser) && (
                        <td className="p-4 text-xs font-semibold text-slate-600">
                          <span className="px-2 py-0.5 bg-slate-100 rounded-lg border border-slate-300">
                            {ord.depot?.name} <span className="text-slate-500">({ord.depot?.code})</span>
                          </span>
                        </td>
                      )}
                      <td className="p-4 font-semibold text-slate-900">
                        {ord.dealer?.name}
                        <span className="text-xs text-slate-500 block font-normal font-mono">
                          {ord.dealer?.phone}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          {ord.items.map((it) => {
                            const bagSize = it.product.bag_size_kg || 50.0;
                            const ordBags = Math.round((it.ordered_qty / bagSize) * 100) / 100;
                            const delBags = Math.round((it.delivered_qty / bagSize) * 100) / 100;
                            const pndBags = Math.round((it.pending_qty / bagSize) * 100) / 100;
                            return (
                              <div key={it.id} className="text-[11px] flex justify-between gap-4 font-mono">
                                <span className="text-slate-600">[{it.product.code}] {it.product.name}</span>
                                <span className="text-slate-500 whitespace-nowrap">
                                  Ord: <strong className="text-slate-900">{it.ordered_qty} kg ({ordBags} b)</strong> |
                                  Del: <strong className="text-emerald-600">{it.delivered_qty} kg ({delBags} b)</strong> |
                                  Pnd:{" "}
                                  <strong className={it.pending_qty > 0 ? "text-amber-600" : "text-emerald-600"}>
                                    {it.pending_qty} kg ({pndBags} b)
                                  </strong>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td className="p-4 text-center">{statusBadge(ord.status)}</td>
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
