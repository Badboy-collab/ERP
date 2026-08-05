"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { AlertTriangle, Printer, RefreshCw, Filter } from "lucide-react";

interface ExpiryItem {
  lot_id: string;
  depot_name: string;
  product_name: string;
  product_code: string;
  lot_no: string;
  available_bag: number;
  available_kg: number;
  mfg_date: string;
  exp_date: string;
  days_to_expiry: number;
  status: "URGENT" | "WARNING" | "CAUTION" | "ACTIVE" | "EXPIRED";
}

interface Depot {
  id: string;
  name: string;
  code: string;
}

export default function ExpiryReportPage() {
  const [expiryData, setExpiryData] = useState<ExpiryItem[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [selectedDepotId, setSelectedDepotId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchDepots();
  }, []);

  useEffect(() => {
    fetchExpiryData();
  }, [selectedDepotId]);

  const fetchDepots = async () => {
    try {
      const res = await fetch("/api/admin/depots");
      if (res.ok) setDepots(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchExpiryData = async () => {
    setLoading(true);
    try {
      const url = selectedDepotId
        ? `/api/reports/expiry?depot_id=${selectedDepotId}`
        : `/api/reports/expiry`;
      const res = await fetch(url);
      if (res.ok) setExpiryData(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <div className="print:hidden">
        <Navbar />
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 print:p-0 print:max-w-none">
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-rose-400" />
              Depot Lot Expiry Report Generation
            </h1>
            <p className="text-sm text-slate-400">
              Sorted by nearest expiration dates (Ascending). Printable warehouse checking sheet with URGENT (&le;10d) alerts.
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-3 print:hidden">
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

            <button
              onClick={fetchExpiryData}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2 rounded-xl border border-slate-700 transition-colors"
              title="Refresh Expiry Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={handlePrint}
              className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-4 h-4" /> Generate / Print Report
            </button>
          </div>
        </div>

        {/* Paper Header */}
        <div className="hidden print:block text-slate-900 mb-6">
          <h1 className="text-2xl font-black uppercase">Matber Agro Industries Ltd</h1>
          <p className="text-xs font-bold uppercase">
            Official Warehouse Lot Expiry Audit Report • {selectedDepotId ? "Branch Depot" : "Consolidated Depots"}
          </p>
          <p className="text-xs">Date Generated: {new Date().toLocaleString()}</p>
        </div>

        {/* Expiry Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl print:p-0 print:border-none print:shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs print:text-slate-900 print:border print:border-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider print:bg-slate-100 print:text-slate-900">
                <tr>
                  <th className="p-3 border-r border-slate-800 print:border-slate-300">Product Name</th>
                  <th className="p-3 border-r border-slate-800 print:border-slate-300">Lot No</th>
                  <th className="p-3 border-r border-slate-800 print:border-slate-300 text-right">Avail Qty (Kg)</th>
                  <th className="p-3 border-r border-slate-800 print:border-slate-300 text-right">Avail Bag</th>
                  <th className="p-3 border-r border-slate-800 print:border-slate-300">MFG Date</th>
                  <th className="p-3 border-r border-slate-800 print:border-slate-300">EXP Date</th>
                  <th className="p-3 border-r border-slate-800 print:border-slate-300 text-center">Days To Expiry</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium print:divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-500 animate-pulse">
                      Analyzing active lot shelf lives...
                    </td>
                  </tr>
                ) : expiryData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-500">
                      No active stock batches found.
                    </td>
                  </tr>
                ) : (
                  expiryData.map((item) => (
                    <tr key={item.lot_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-semibold text-slate-100 print:text-slate-900">
                        <div>{item.product_name}</div>
                        <span className="text-[10px] text-slate-500 font-mono print:text-slate-600">
                          [{item.product_code}] • {item.depot_name}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-emerald-400 print:text-slate-900">
                        {item.lot_no}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-200 print:text-slate-900 font-bold">
                        {item.available_kg.toLocaleString()} kg
                      </td>
                      <td className="p-3 text-right font-mono text-white font-extrabold print:text-slate-900">
                        {item.available_bag} bags
                      </td>
                      <td className="p-3 font-mono text-slate-400 print:text-slate-800">
                        {new Date(item.mfg_date).toLocaleDateString()}
                      </td>
                      <td className="p-3 font-mono text-slate-400 print:text-slate-800">
                        {new Date(item.exp_date).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-sm">
                        {item.days_to_expiry <= 0 ? (
                          <span className="text-rose-500 font-black">0 days (Expired)</span>
                        ) : (
                          <span>{item.days_to_expiry} days</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {item.status === "URGENT" && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-950 text-rose-400 border border-rose-800 animate-pulse print:border-rose-900">
                            🚨 URGENT (&le;10d)
                          </span>
                        )}
                        {item.status === "WARNING" && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950 text-amber-400 border border-amber-800 print:border-amber-900">
                            ⚠️ WARNING (&le;20d)
                          </span>
                        )}
                        {item.status === "CAUTION" && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-950 text-yellow-300 border border-yellow-800">
                            ⚡ CAUTION (&le;30d)
                          </span>
                        )}
                        {item.status === "ACTIVE" && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                            ACTIVE
                          </span>
                        )}
                        {item.status === "EXPIRED" && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-950 text-rose-500 border border-rose-800">
                            EXPIRED
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

        {/* Print Signatures */}
        <div className="hidden print:grid grid-cols-2 gap-12 pt-12 text-xs font-bold text-slate-800">
          <div className="border-t border-slate-400 pt-2 text-center">Warehouse Quality Inspector</div>
          <div className="border-t border-slate-400 pt-2 text-center">Depot Manager Approval</div>
        </div>
      </main>
    </div>
  );
}
