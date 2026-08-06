"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import {
  DollarSign,
  CheckCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  BookOpen,
  PlusCircle,
  MinusCircle,
  Wallet,
  Edit,
  Trash2,
  X
} from "lucide-react";
import SearchableSelect from "@/components/SearchableSelect";
import { getSessionUser, SessionUser } from "@/lib/userSession";

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

interface DepotTransaction {
  id: string;
  depot_id: string;
  depot?: { name: string; code: string };
  transaction_type: "INCOME" | "EXPENSE";
  category: string;
  amount: number;
  date: string;
  remarks: string | null;
  created_by: string | null;
  running_balance?: number;
}

export default function AccountingPage() {
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [activeTab, setActiveTab] = useState<"dealer" | "cashbook">("dealer");

  // Masters
  const [depots, setDepots] = useState<Depot[]>([]);
  const [dealers, setDealers] = useState<Dealer[]>([]);

  // Selected state
  const [selectedDepotId, setSelectedDepotId] = useState<string>("");
  const [selectedDealerId, setSelectedDealerId] = useState<string>("");

  // Dealer Ledger Data
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState({
    total_sales: 0,
    total_received: 0,
    total_due: 0,
  });

  // Petty Cash Book Data
  const [cashTransactions, setCashTransactions] = useState<DepotTransaction[]>([]);
  const [cashSummary, setCashSummary] = useState({
    total_income: 0,
    total_expense: 0,
    balance: 0,
  });

  // Forms - Dealer Collection Payment
  const [paymentAmount, setPaymentAmount] = useState<number | "">("");
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [paymentRemarks, setPaymentRemarks] = useState<string>("");

  // Forms - Petty Cash Transaction
  const [cashType, setCashType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [cashCategory, setCashCategory] = useState<string>("");
  const [cashAmount, setCashAmount] = useState<number | "">("");
  const [cashDate, setCashDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [cashRemarks, setCashRemarks] = useState<string>("");

  // Edit Petty Cash State (Super Admin)
  const [editingTx, setEditingTx] = useState<DepotTransaction | null>(null);
  const [editAmount, setEditAmount] = useState<string>("");
  const [editCategory, setEditCategory] = useState<string>("");
  const [editRemarks, setEditRemarks] = useState<string>("");

  const handleDeleteCashTx = async (txId: string) => {
    if (!isSuperAdmin) {
      alert("Permission Denied: Only Super Admin can delete financial records.");
      return;
    }
    if (!confirm("Are you sure you want to delete & reverse this petty cash entry?")) return;
    try {
      const res = await fetch(`/api/accounting/cashbook?id=${txId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete petty cash entry");
      setMessage({ type: "success", text: "Petty cash entry deleted & balance recalculated!" });
      fetchCashBook();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const handleSaveEditCashTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;
    try {
      const res = await fetch("/api/accounting/cashbook", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingTx.id,
          amount: Number(editAmount),
          category: editCategory,
          remarks: editRemarks,
        }),
      });
      if (!res.ok) throw new Error("Failed to update petty cash entry");
      setMessage({ type: "success", text: "Petty cash entry updated & balance recalculated!" });
      setEditingTx(null);
      fetchCashBook();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Category constants (fetched from API, fallback to hardcoded)
  const inflowCategories = [
    "Opening Balance",
    "Received From H / O (Head Office)",
    "LOAN"
  ];

  const expenseCategories = [
    "Load unload Bill",
    "Entertainment",
    "Conveyance",
    "Unloading Labor bill",
    "Loading Labor bill",
    "Electric Materials",
    "Stationery",
    "Internet Bill",
    "Office Maintenance",
    "Computer Servicing",
    "Paper Bill",
    "Transport Bill",
    "Courier & Postage Bill",
    "Electric Bill",
    "Printing & Photocopy",
    "Godown Rent",
    "Misc. Expenses",
    "Ifter Bill",
    "Carriage Outward Cost"
  ];

  // Load Session User and Depot List
  useEffect(() => {
    const user = getSessionUser();
    setCurrentUser(user);
    if (user) {
      if (user.role !== "SUPER_ADMIN" && user.depot_id) {
        setSelectedDepotId(user.depot_id);
      }
      if (user.role !== "SUPER_ADMIN" && !user.can_view_accounting) {
        setActiveTab("cashbook");
      }
    }
    fetchDepots();
  }, []);

  // Fetch dealers and summary when depot changes
  useEffect(() => {
    fetchDealers();
    fetchSummary();
    fetchCashBook();
  }, [selectedDepotId]);

  // Fetch ledger when dealer changes
  useEffect(() => {
    if (selectedDealerId) {
      fetchDealerLedger();
    } else {
      setTransactions([]);
    }
  }, [selectedDealerId]);

  // Auto-set default category when transaction type changes
  useEffect(() => {
    if (cashType === "INCOME") {
      setCashCategory(inflowCategories[0]);
    } else {
      setCashCategory(expenseCategories[0]);
    }
  }, [cashType]);

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

  const fetchCashBook = async () => {
    try {
      const url = selectedDepotId ? `/api/accounting/cashbook?depot_id=${selectedDepotId}` : "/api/accounting/cashbook";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        // Compute running balance
        const sorted = [...data.transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        let bal = 0;
        const withBal = sorted.map((t) => {
          if (t.transaction_type === "INCOME") {
            bal += t.amount;
          } else {
            bal -= t.amount;
          }
          return { ...t, running_balance: bal };
        });
        setCashTransactions(withBal.reverse());
        setCashSummary(data.summary);
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

  const handleRecordCashTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDepotId) {
      setMessage({ type: "error", text: "Please select a depot to log petty cash." });
      return;
    }
    if (cashAmount === "") return;

    try {
      const res = await fetch("/api/accounting/cashbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          depot_id: selectedDepotId,
          transaction_type: cashType,
          category: cashCategory,
          amount: Number(cashAmount),
          date: cashDate,
          remarks: cashRemarks,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to record transaction");
      }

      setMessage({
        type: "success",
        text: `${cashType === "INCOME" ? "Fund Inflow" : "Expense"} of ৳${cashAmount} logged successfully!`
      });
      setCashAmount("");
      setCashRemarks("");
      fetchCashBook();
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

  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-100 flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Title Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-emerald-600" />
              Financial Accounting & Ledgers
            </h1>
            <p className="text-sm text-slate-500">
              Manage dealer ledgers, collection credits, and depot expense accounts (Petty Cash Book).
            </p>
          </div>

          {/* Depot Filter: Restricted if non-SuperAdmin */}
          <div className="w-64">
            <label className="block text-[10px] text-slate-500 mb-1 font-semibold uppercase tracking-wider">
              Selected Depot / Unit
            </label>
            <SearchableSelect
              options={depotOptions}
              value={selectedDepotId}
              onChange={setSelectedDepotId}
              isDisabled={!isSuperAdmin}
              placeholder="Select Depot..."
            />
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-200">
          {(isSuperAdmin || currentUser?.can_view_accounting) && (
            <button
              onClick={() => {
                setActiveTab("dealer");
                setMessage(null);
              }}
              className={`px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
                activeTab === "dealer"
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <DollarSign className="w-4 h-4" />
              Dealer Ledgers & Collections
            </button>
          )}
          <button
            onClick={() => {
              setActiveTab("cashbook");
              setMessage(null);
            }}
            className={`px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "cashbook"
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Petty Cash Book (Expenses & Funds)
          </button>
        </div>

        {message && (
          <div className={`p-4 rounded-xl text-sm flex items-center space-x-2 font-medium ${message.type === "success" ? "bg-emerald-50/80 text-emerald-300 border border-emerald-200" : "bg-rose-50/80 text-rose-300 border border-rose-800"}`}>
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{message.text}</span>
          </div>
        )}

        {/* TAB 1: DEALER LEDGERS */}
        {activeTab === "dealer" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Side: Select Dealer & Collect Payment */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl">
                <h2 className="text-base font-extrabold text-slate-900 mb-4">Select Dealer Ledger</h2>
                <SearchableSelect
                  options={dealerOptions}
                  value={selectedDealerId}
                  onChange={setSelectedDealerId}
                  placeholder="-- Choose Dealer --"
                />
              </div>

              {selectedDealerId && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4">
                  <h2 className="text-base font-extrabold text-slate-900">Record Payment Collection</h2>
                  <form onSubmit={handleRecordPayment} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Collection Amount (৳) *</label>
                      <input
                        type="number"
                        min="1"
                        step="any"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 font-bold"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Date *</label>
                      <input
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Remarks / Reference</label>
                      <input
                        type="text"
                        value={paymentRemarks}
                        onChange={(e) => setPaymentRemarks(e.target.value)}
                        placeholder="e.g. Bank deposit, Cash"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900"
                      />
                    </div>
                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold py-3 rounded-xl shadow-lg transition-all text-xs">
                      Record Credit Entry
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Right Side: Ledger Statement & Metrics */}
            <div className="lg:col-span-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Total Sales (Debit)</p>
                    <p className="text-lg font-bold text-blue-400">৳ {summary.total_sales.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                  </div>
                  <ArrowUpCircle className="text-blue-400/50 w-8 h-8" />
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Payments Collected</p>
                    <p className="text-lg font-bold text-emerald-600">৳ {summary.total_received.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                  </div>
                  <ArrowDownCircle className="text-emerald-600/50 w-8 h-8" />
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Net Outstanding Dues</p>
                    <p className={`text-lg font-bold ${summary.total_due > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                      ৳ {summary.total_due.toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </p>
                  </div>
                  <DollarSign className={`w-8 h-8 ${summary.total_due > 0 ? "text-amber-600/50" : "text-emerald-600/50"}`} />
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl">
                <h2 className="text-base font-extrabold text-slate-900 mb-4">Dealer Ledger Statement</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-200">
                    <thead className="bg-slate-50 text-slate-500 font-semibold uppercase">
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
                        <tr key={t.id} className="hover:bg-slate-100/40">
                          <td className="p-3 text-slate-600 font-mono">{new Date(t.date).toLocaleDateString()}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${t.type === 'DEBIT' ? 'bg-blue-950 text-blue-400 border border-blue-800' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                              {t.type}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500">{t.reference_invoice || t.remarks || '-'}</td>
                          <td className="p-3 text-right font-mono text-blue-400">
                            {t.type === 'DEBIT' ? `৳ ${t.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}` : '-'}
                          </td>
                          <td className="p-3 text-right font-mono text-emerald-600">
                            {t.type === 'CREDIT' ? `৳ ${t.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}` : '-'}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900">
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
        )}

        {/* TAB 2: PETTY CASH BOOK */}
        {activeTab === "cashbook" && (
          <div className="space-y-6">
            {/* Cash Balance Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-xl">
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Fund Inflows</p>
                  <p className="text-xl font-black text-emerald-600 mt-1">৳ {cashSummary.total_income.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                </div>
                <ArrowDownCircle className="text-emerald-600/30 w-9 h-9" />
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-xl">
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Expenses</p>
                  <p className="text-xl font-black text-rose-600 mt-1">৳ {cashSummary.total_expense.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                </div>
                <ArrowUpCircle className="text-rose-600/30 w-9 h-9" />
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-bl-xl text-[9px] font-bold uppercase">Petty Cash</div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Current Cash Balance</p>
                  <p className={`text-xl font-black mt-1 ${cashSummary.balance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    ৳ {cashSummary.balance.toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </p>
                </div>
                <Wallet className={`w-9 h-9 ${cashSummary.balance >= 0 ? "text-emerald-600/30" : "text-rose-600/30"}`} />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Transaction Log Entry Forms */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                      {cashType === "EXPENSE" ? <MinusCircle className="w-5 h-5 text-rose-600" /> : <PlusCircle className="w-5 h-5 text-emerald-600" />}
                      Log Cash Book Record
                    </h2>
                    {/* Toggle Type */}
                    <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setCashType("EXPENSE")}
                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                          cashType === "EXPENSE" ? "bg-rose-50/80 text-rose-300 border border-rose-800" : "text-slate-500"
                        }`}
                      >
                        Expense
                      </button>
                      <button
                        type="button"
                        onClick={() => setCashType("INCOME")}
                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                          cashType === "INCOME" ? "bg-emerald-50/80 text-emerald-300 border border-emerald-200" : "text-slate-500"
                        }`}
                      >
                        Fund In
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleRecordCashTransaction} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Category *
                      </label>
                      <select
                        value={cashCategory}
                        onChange={(e) => setCashCategory(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-bold font-sans outline-none focus:border-emerald-500"
                        required
                      >
                        {cashType === "INCOME"
                          ? inflowCategories.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))
                          : expenseCategories.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Amount (৳) *</label>
                      <input
                        type="number"
                        min="1"
                        step="any"
                        value={cashAmount}
                        onChange={(e) => setCashAmount(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-bold"
                        placeholder="0.00"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Transaction Date *</label>
                      <input
                        type="date"
                        value={cashDate}
                        onChange={(e) => setCashDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Remarks / Reference</label>
                      <textarea
                        rows={2}
                        value={cashRemarks}
                        onChange={(e) => setCashRemarks(e.target.value)}
                        placeholder="Additional details..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-sans outline-none focus:border-emerald-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={!selectedDepotId}
                      className={`w-full py-3 rounded-xl shadow-lg transition-all font-black text-xs ${
                        selectedDepotId
                          ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                          : "bg-slate-100 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      {!selectedDepotId ? "Select Depot/Unit first" : cashType === "INCOME" ? "Record Cash Inflow" : "Record Expense Voucher"}
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Column: Ledger Table View */}
              <div className="lg:col-span-8 space-y-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl">
                  <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center justify-between">
                    <span>Petty Cash Book Ledger</span>
                    {selectedDepotId && (
                      <span className="text-xs bg-slate-100 px-3 py-1 rounded-full text-slate-500 font-mono uppercase font-bold border border-slate-300">
                        {depots.find(d => d.id === selectedDepotId)?.name || "Isolated Depot"}
                      </span>
                    )}
                  </h2>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-slate-200">
                      <thead className="bg-slate-50 text-slate-500 font-semibold uppercase">
                        <tr>
                          <th className="p-3">Date</th>
                          <th className="p-3">Category</th>
                          <th className="p-3">Remarks</th>
                          <th className="p-3 text-right">Cash In (Fund)</th>
                          <th className="p-3 text-right">Cash Out (Expense)</th>
                          <th className="p-3 text-right">Running Cash Balance</th>
                          <th className="p-3">Logged By</th>
                          {isSuperAdmin && <th className="p-3 text-right">Actions</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 font-medium">
                        {cashTransactions.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-100/40">
                            <td className="p-3 text-slate-600 font-mono">{new Date(t.date).toLocaleDateString()}</td>
                            <td className="p-3 text-slate-900 font-bold">{t.category}</td>
                            <td className="p-3 text-slate-500 max-w-xs truncate">{t.remarks || "-"}</td>
                            <td className="p-3 text-right font-mono text-emerald-600">
                              {t.transaction_type === "INCOME" ? `৳ ${t.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}` : "-"}
                            </td>
                            <td className="p-3 text-right font-mono text-rose-600">
                              {t.transaction_type === "EXPENSE" ? `৳ ${t.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}` : "-"}
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-slate-900">
                              ৳ {t.running_balance?.toLocaleString(undefined, {minimumFractionDigits: 2}) || "-"}
                            </td>
                            <td className="p-3 text-slate-500 font-mono text-[10px]">{t.created_by || "System"}</td>
                            {isSuperAdmin && (
                              <td className="p-3 text-right">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingTx(t);
                                      setEditAmount(String(t.amount));
                                      setEditCategory(t.category);
                                      setEditRemarks(t.remarks || "");
                                    }}
                                    className="p-1 text-slate-500 hover:text-emerald-600 rounded hover:bg-slate-50 transition-colors"
                                    title="Edit Petty Cash Entry"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCashTx(t.id)}
                                    className="p-1 text-slate-500 hover:text-rose-600 rounded hover:bg-slate-50 transition-colors"
                                    title="Delete Petty Cash Entry"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                        {cashTransactions.length === 0 && (
                          <tr>
                            <td colSpan={isSuperAdmin ? 8 : 7} className="p-8 text-center text-slate-500">
                              No petty cash book entries found. Log inflow or expense entries to begin.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Edit Petty Cash Transaction */}
        {editingTx && (
          <div className="fixed inset-0 bg-slate-50/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Edit className="w-4 h-4 text-emerald-600" /> Edit & Override Petty Cash Entry
                </h3>
                <button onClick={() => setEditingTx(null)} className="text-slate-500 hover:text-slate-900">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEditCashTx} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-bold"
                  >
                    {editingTx.transaction_type === "INCOME"
                      ? inflowCategories.map((c) => <option key={c} value={c}>{c}</option>)
                      : expenseCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Amount (৳)</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Remarks</label>
                  <textarea
                    rows={2}
                    value={editRemarks}
                    onChange={(e) => setEditRemarks(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl transition-all text-xs">
                    Save Override
                  </button>
                  <button type="button" onClick={() => setEditingTx(null)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 px-4 rounded-xl transition-all text-xs">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
