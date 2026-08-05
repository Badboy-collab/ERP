"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { DollarSign, CheckCircle, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import SearchableSelect from "@/components/SearchableSelect";

interface Depot {
  id: string;
  name: string;
  code: string;
}

interface Dealer {
  id: string;
  name: string;
  phone: string;
  depot_id: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  date: string;
  remarks: string | null;
  reference_invoice: string | null;
  running_balance?: number;
}

export default function AccountingPage() {
  const [depots, setDepots] = useState<Depot[]>([]);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [selectedDepotId, setSelectedDepotId] = useState<string>("");
  const [selectedDealerId, setSelectedDealerId] = useState<string>("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Depot-wise summary stats
  const [summary, setSummary] = useState({
    total_sales: 0,
    total_received: 0,
    total_due: 0,
  });

  const [paymentAmount, setPaymentAmount] = useState<number | "">("");
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [paymentRemarks, setPaymentRemarks] = useState<string>("");
  
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchDepots();
  }, []);

  useEffect(() => {
    fetchDealers();
    fetchSummary();
  }, [selectedDepotId]);

  useEffect(() => {
    if (selectedDealerId) {
      fetchDealerLedger();
    } else {
      setTransactions([]);
    }
  }, [selectedDealerId]);

  const fetchDepots = async () => {
    try {
      const res = await fetch("/api/admin/depots");
      if (res.ok) setDepots(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDealers = async () => {
    try {
      const url = selectedDepotId ? `/api/dealers?depot_id=${selectedDepotId}` : "/api/dealers";
      const res = await fetch(url);
      if (res.ok) {
        setDealers(await res.json());
        setSelectedDealerId(""); // Reset selected dealer on depot change
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSummary = async () => {
    try {
      const url = selectedDepotId ? `/api/accounting/summary?depot_id=${selectedDepotId}` : "/api/accounting/summary";
      const res = await fetch(url);
      if (res.ok) {
        setSummary(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDealerLedger = async () => {
    try {
      const res = await fetch(`/api/accounting/ledger?dealer_id=${selectedDealerId}`);
      if (res.ok) {
        setTransactions(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDealerId || paymentAmount === "") return;

    try {
      const dealer = dealers.find(d => d.id === selectedDealerId);
      const res = await fetch("/api/accounting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          depot_id: dealer?.depot_id,
          dealer_id: selectedDealerId,
          amount: Number(paymentAmount),
          date: paymentDate,
          remarks: paymentRemarks,
        }),
      });

      if (!res.ok) throw new Error("Failed to record payment");

      setMessage({ type: "success", text: `Payment of ৳${paymentAmount} recorded successfully for ${dealer?.name}!` });
      setPaymentAmount("");
      setPaymentRemarks("");
      fetchDealerLedger();
      fetchSummary();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const depotOptions = [
    { value: "", label: "All Depots Consolidated" },
    ...depots.map((d) => ({ value: d.id, label: `${d.name} (${d.code})` })),
  ];

  const dealerOptions = dealers.map((d) => ({
    value: d.id,
    label: d.name,
  }));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-emerald-400" />
              Financial Accounting & Ledgers
            </h1>
            <p className="text-sm text-slate-400">
              Manage dealer balances, outstanding dues, and payment collections.
            </p>
          </div>
          <div className="w-64">
            <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Filter Depot</label>
            <SearchableSelect
              options={depotOptions}
              value={selectedDepotId}
              onChange={setSelectedDepotId}
              placeholder="Select Depot..."
            />
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-xl text-sm flex items-center space-x-2 font-medium ${message.type === "success" ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800" : "bg-rose-950/80 text-rose-300 border border-rose-800"}`}>
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-base font-extrabold text-white mb-4">Select Dealer Ledger</h2>
              <SearchableSelect
                options={dealerOptions}
                value={selectedDealerId}
                onChange={setSelectedDealerId}
                placeholder="-- Choose Dealer --"
              />
            </div>

            {selectedDealerId && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <h2 className="text-base font-extrabold text-white">Record Payment Collection</h2>
                <form onSubmit={handleRecordPayment} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Collection Amount (৳) *</label>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white font-bold"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Date *</label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Remarks / Reference</label>
                    <input
                      type="text"
                      value={paymentRemarks}
                      onChange={(e) => setPaymentRemarks(e.target.value)}
                      placeholder="e.g. Bank deposit, Cash"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white"
                    />
                  </div>
                  <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold py-3 rounded-xl shadow-lg transition-all text-xs">
                    Record Credit Entry
                  </button>
                </form>
              </div>
            )}
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total Sales (Debit)</p>
                  <p className="text-lg font-bold text-blue-400">৳ {summary.total_sales.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                </div>
                <ArrowUpCircle className="text-blue-400/50 w-8 h-8" />
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Payments Collected</p>
                  <p className="text-lg font-bold text-emerald-400">৳ {summary.total_received.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                </div>
                <ArrowDownCircle className="text-emerald-400/50 w-8 h-8" />
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Net Outstanding Dues</p>
                  <p className={`text-lg font-bold ${summary.total_due > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                    ৳ {summary.total_due.toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </p>
                </div>
                <DollarSign className={`w-8 h-8 ${summary.total_due > 0 ? "text-amber-400/50" : "text-emerald-400/50"}`} />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-base font-extrabold text-white mb-4">Dealer Ledger Statement</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-800">
                  <thead className="bg-slate-950 text-slate-400 font-semibold uppercase">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Transaction Type</th>
                      <th className="p-3">Ref/Remarks</th>
                      <th className="p-3 text-right">Debit (Due)</th>
                      <th className="p-3 text-right">Credit (Paid)</th>
                      <th className="p-3 text-right">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-medium">
                    {transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-800/40">
                        <td className="p-3 text-slate-300 font-mono">{new Date(t.date).toLocaleDateString()}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${t.type === 'DEBIT' ? 'bg-blue-950 text-blue-400 border border-blue-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'}`}>
                            {t.type}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">{t.reference_invoice || t.remarks || '-'}</td>
                        <td className="p-3 text-right font-mono text-blue-400">
                          {t.type === 'DEBIT' ? `৳ ${t.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}` : '-'}
                        </td>
                        <td className="p-3 text-right font-mono text-emerald-400">
                          {t.type === 'CREDIT' ? `৳ ${t.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}` : '-'}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-white">
                          ৳ {t.running_balance?.toLocaleString(undefined, {minimumFractionDigits: 2}) || '-'}
                        </td>
                      </tr>
                    ))}
                    {transactions.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500">
                          No transactions found. Select a dealer to view ledger.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
