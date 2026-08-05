"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Package, Printer, RefreshCw, Filter, Layers, Calendar, Eye, EyeOff } from "lucide-react";
import { getSessionUser, SessionUser, hasGlobalAccess } from "@/lib/userSession";

interface StockRow {
  product_id: string;
  category: string;
  name: string;
  code: string;
  bag_size_kg: number;
  opening_bags: number;
  opening_kg: number;
  received_bags: number;
  received_kg: number;
  total_kg: number;
  sales_bags: number;
  sales_kg: number;
  return_bags: number;
  return_kg: number;
  balance_kg: number;
  balance_bags: number;
}

interface Depot {
  id: string;
  name: string;
  code: string;
}

export default function StockReportPage() {
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [stockData, setStockData] = useState<StockRow[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [selectedDepotId, setSelectedDepotId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [showZeroStock, setShowZeroStock] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const user = getSessionUser();
    setCurrentUser(user);
    if (user && !hasGlobalAccess(user) && user.depot_id) {
      setSelectedDepotId(user.depot_id);
    }
    fetchDepots();
  }, []);

  useEffect(() => {
    fetchStockData();
  }, [selectedDepotId, selectedDate]);

  const fetchDepots = async () => {
    try {
      const res = await fetch("/api/admin/depots");
      if (res.ok) setDepots(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStockData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedDepotId) params.append("depot_id", selectedDepotId);
      if (selectedDate) params.append("date", selectedDate);

      const url = `/api/reports/stock?${params.toString()}`;
      const res = await fetch(url);
      if (res.ok) setStockData(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const displayedStock = showZeroStock ? stockData : stockData.filter(r => r.balance_kg > 0);

  const totals = displayedStock.reduce(
    (acc, row) => ({
      opening_kg: acc.opening_kg + row.opening_kg,
      received_kg: acc.received_kg + row.received_kg,
      total_kg: acc.total_kg + row.total_kg,
      sales_kg: acc.sales_kg + row.sales_kg,
      return_kg: acc.return_kg + row.return_kg,
      balance_kg: acc.balance_kg + row.balance_kg,
      balance_bags: acc.balance_bags + row.balance_bags,
    }),
    { opening_kg: 0, received_kg: 0, total_kg: 0, sales_kg: 0, return_kg: 0, balance_kg: 0, balance_bags: 0 }
  );

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
              <Package className="w-6 h-6 text-emerald-400" />
              Real-Time Stock Display Ledger
            </h1>
            <p className="text-sm text-slate-400">
              Live automated feed inventory tracking in Kilograms (Kg) and 50kg Bags as per spreadsheet formulas.
            </p>
          </div>

          {/* Controls (Hidden in Print) */}
          <div className="flex flex-wrap items-center gap-3 print:hidden">
            {/* Date Selection Filter */}
            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white font-semibold focus:outline-none"
              />
            </div>

            {/* Zero Stock Toggle Button */}
            <button
              onClick={() => setShowZeroStock(!showZeroStock)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                showZeroStock
                  ? "bg-amber-950/60 border-amber-800 text-amber-300"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {showZeroStock ? <Eye className="w-3.5 h-3.5 text-amber-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
              <span>{showZeroStock ? "Showing Out of Stock" : "Hide Out of Stock"}</span>
            </button>

            {/* Depot Selector (Global Visibility for SUPER_ADMIN & ORG_ADMIN) */}
            {hasGlobalAccess(currentUser) ? (
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
            ) : (
              <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-400">
                {depots.find(d => d.id === selectedDepotId)?.name || "Assigned Depot"}
              </div>
            )}

            <button
              onClick={fetchStockData}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2 rounded-xl border border-slate-700 transition-colors"
              title="Refresh Stock Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-4 h-4" /> Print Stock Sheet
            </button>
          </div>
        </div>

        {/* Printable Header for Paper Output */}
        <div className="hidden print:block text-slate-900 mb-6">
          <h1 className="text-2xl font-black uppercase">Matber Agro Industries Ltd</h1>
          <p className="text-xs font-bold">MONTHLY STOCK LEDGER REPORT • REAL-TIME DEPO STOCK</p>
          <p className="text-xs">Date Generated: {new Date().toLocaleString()}</p>
        </div>

        {/* Stock Ledger Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl print:p-0 print:border-none print:shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs print:text-slate-900 print:border print:border-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider print:bg-slate-100 print:text-slate-900">
                <tr>
                  <th className="p-3 border-r border-slate-800 print:border-slate-300">Category & Product Name</th>
                  <th className="p-3 border-r border-slate-800 print:border-slate-300">Code</th>
                  <th className="p-3 border-r border-slate-800 print:border-slate-300 text-right">Bag Size</th>
                  <th className="p-3 border-r border-slate-800 print:border-slate-300 text-right">Opening (Kg)</th>
                  <th className="p-3 border-r border-slate-800 print:border-slate-300 text-right">Received (Kg)</th>
                  <th className="p-3 border-r border-slate-800 print:border-slate-300 text-right font-extrabold text-blue-400 print:text-slate-900">
                    Total (Kg)
                  </th>
                  <th className="p-3 border-r border-slate-800 print:border-slate-300 text-right text-rose-400 print:text-slate-900">
                    Sales (Kg)
                  </th>
                  <th className="p-3 border-r border-slate-800 print:border-slate-300 text-right text-amber-400 print:text-slate-900">
                    Return (Kg)
                  </th>
                  <th className="p-3 border-r border-slate-800 print:border-slate-300 text-right font-extrabold text-emerald-400 print:text-slate-900">
                    Balance (Kg)
                  </th>
                  <th className="p-3 text-right font-extrabold text-emerald-400 print:text-slate-900">
                    Balance (Bags)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium print:divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="text-center py-12 text-slate-500 animate-pulse">
                      Calculating real-time stock balances...
                    </td>
                  </tr>
                ) : displayedStock.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-12 text-slate-500">
                      No feed product stock records found matching filters.
                    </td>
                  </tr>
                ) : (
                  displayedStock.map((row) => (
                    <tr key={row.product_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-semibold text-slate-100 print:text-slate-900">
                        <span className="text-[10px] text-emerald-400 block font-normal uppercase print:text-slate-600">
                          {row.category}
                        </span>
                        {row.name}
                      </td>
                      <td className="p-3 font-mono text-slate-400 print:text-slate-800">{row.code}</td>
                      <td className="p-3 text-right font-mono text-slate-400 print:text-slate-800">
                        {row.bag_size_kg} kg
                      </td>
                      <td className="p-3 text-right font-mono">{row.opening_kg.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-blue-400 print:text-slate-900">
                        +{row.received_kg.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-blue-300 print:text-slate-900">
                        {row.total_kg.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono text-rose-400 print:text-slate-900">
                        -{row.sales_kg.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono text-amber-400 print:text-slate-900">
                        -{row.return_kg.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono font-extrabold text-emerald-400 print:text-slate-900 text-sm">
                        {row.balance_kg.toLocaleString()} kg
                      </td>
                      <td className="p-3 text-right font-mono font-extrabold text-emerald-300 print:text-slate-900 text-sm">
                        {row.balance_bags} bags
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-slate-950 font-bold border-t-2 border-slate-800 text-slate-100 print:bg-slate-100 print:text-slate-900">
                <tr>
                  <td colSpan={3} className="p-3 uppercase tracking-wider text-right">
                    Total Consolidated Stock:
                  </td>
                  <td className="p-3 text-right font-mono">{totals.opening_kg.toLocaleString()} kg</td>
                  <td className="p-3 text-right font-mono text-blue-400 print:text-slate-900">
                    +{totals.received_kg.toLocaleString()} kg
                  </td>
                  <td className="p-3 text-right font-mono text-blue-300 print:text-slate-900">
                    {totals.total_kg.toLocaleString()} kg
                  </td>
                  <td className="p-3 text-right font-mono text-rose-400 print:text-slate-900">
                    -{totals.sales_kg.toLocaleString()} kg
                  </td>
                  <td className="p-3 text-right font-mono text-amber-400 print:text-slate-900">
                    -{totals.return_kg.toLocaleString()} kg
                  </td>
                  <td className="p-3 text-right font-mono text-emerald-400 print:text-slate-900 text-sm">
                    {totals.balance_kg.toLocaleString()} kg
                  </td>
                  <td className="p-3 text-right font-mono text-emerald-300 print:text-slate-900 text-sm">
                    {totals.balance_bags.toLocaleString()} bags
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
