"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import ChallanModal, { ChallanInvoice } from "@/components/ChallanModal";
import { Search, Printer, FileText, Calendar, Tag, User } from "lucide-react";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<ChallanInvoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedInvoice, setSelectedInvoice] = useState<ChallanInvoice | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async (query?: string) => {
    setLoading(true);
    try {
      const url = query ? `/api/invoices?query=${encodeURIComponent(query)}` : `/api/invoices`;
      const res = await fetch(url);
      if (res.ok) setInvoices(await res.json());
    } catch (err) {
      console.error("Failed to fetch invoices", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInvoices(searchQuery);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Printer className="w-6 h-6 text-emerald-600" />
              Invoice & Delivery Challan History
            </h1>
            <p className="text-sm text-slate-500">
              Search past dispatches, view multi-product invoice items, and reprint official Delivery Challans anytime.
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xl">
          <form onSubmit={handleSearchSubmit} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search by Invoice No, Dealer Name, or Depot Destination..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow"
            >
              Search
            </button>
          </form>
        </div>

        {/* Invoices List Table */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Invoice No</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Transaction Type</th>
                  <th className="p-4">Dealer / Destination</th>
                  <th className="p-4 text-right">Items Count</th>
                  <th className="p-4 text-right">Total Bags</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500 animate-pulse">
                      Loading invoices...
                    </td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500">
                      No invoices found matching your query.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => {
                    const totalBags = inv.items.reduce((sum, item) => sum + item.quantity, 0);
                    return (
                      <tr key={inv.id} className="hover:bg-slate-100/40 transition-colors">
                        <td className="p-4 font-mono font-bold text-emerald-600">
                          {inv.invoice_no}
                        </td>
                        <td className="p-4 text-xs text-slate-500">
                          {new Date(inv.date).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase ${
                              inv.transaction_type === "TRANSFER_OUT"
                                ? "bg-amber-50 text-amber-600 border-amber-800"
                                : inv.transaction_type === "FACTORY_RETURN"
                                ? "bg-rose-50 text-rose-600 border-rose-800"
                                : "bg-emerald-50 text-emerald-600 border-emerald-200"
                            }`}
                          >
                            {inv.transaction_type}
                          </span>
                        </td>
                        <td className="p-4 font-semibold text-slate-200">
                          {inv.dealer?.name || inv.destination || "Direct Cash Sale"}
                        </td>
                        <td className="p-4 text-right font-mono">{inv.items.length} product(s)</td>
                        <td className="p-4 text-right font-bold text-slate-900">{totalBags} bags</td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="bg-slate-100 hover:bg-emerald-600 hover:text-slate-900 text-emerald-600 font-bold px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs transition-all flex items-center gap-1.5 mx-auto"
                          >
                            <Printer className="w-3.5 h-3.5" /> View / Print Challan
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Printable Challan Modal */}
      {selectedInvoice && (
        <ChallanModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
      )}
    </div>
  );
}
