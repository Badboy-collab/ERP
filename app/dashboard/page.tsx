"use client";

import Navbar from "@/components/Navbar";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Package,
  Wallet,
  TrendingUp,
  PackageCheck,
  ListOrdered,
  ClipboardList,
  BarChart3,
  AlertTriangle,
  Printer,
  DollarSign,
  ChevronRight,
  LayoutDashboard
} from "lucide-react";
import { getSessionUser, SessionUser, hasPermission } from "@/lib/userSession";

export default function ModuleHubPage() {
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [activeModule, setActiveModule] = useState<"accounts" | "warehouse" | null>(null);

  useEffect(() => {
    setCurrentUser(getSessionUser());
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Pass isMinimal=true so that regular navigation links are hidden, matching the user's design */}
      <Navbar isMinimal={true} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Module Selection Grid */}
        <div className="flex flex-col sm:flex-row gap-6 max-w-4xl mb-12">
          
          {/* Accounts Module Card */}
          <button
            onClick={() => setActiveModule(activeModule === "accounts" ? null : "accounts")}
            className={`flex-1 flex items-center justify-between p-6 rounded-2xl border transition-all duration-300 shadow-sm ${
              activeModule === "accounts"
                ? "bg-white border-amber-500 shadow-md ring-2 ring-amber-500/20"
                : "bg-white border-slate-200 hover:border-amber-300 hover:shadow-md hover:-translate-y-1"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                <Wallet className="w-8 h-8" />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-bold text-slate-900">Accounts</h2>
                <p className="text-xs text-slate-500 mt-0.5">Finance, ledgers, & expenses</p>
              </div>
            </div>
            <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${activeModule === "accounts" ? "rotate-90 text-amber-500" : ""}`} />
          </button>

          {/* Warehouse Module Card */}
          <button
            onClick={() => setActiveModule(activeModule === "warehouse" ? null : "warehouse")}
            className={`flex-1 flex items-center justify-between p-6 rounded-2xl border transition-all duration-300 shadow-sm ${
              activeModule === "warehouse"
                ? "bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
                : "bg-white border-slate-200 hover:border-emerald-300 hover:shadow-md hover:-translate-y-1"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                <Package className="w-8 h-8" />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-bold text-slate-900">Warehouse</h2>
                <p className="text-xs text-slate-500 mt-0.5">Inventory, DO, & POS operations</p>
              </div>
            </div>
            <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${activeModule === "warehouse" ? "rotate-90 text-emerald-500" : ""}`} />
          </button>
        </div>

        {/* Dynamic Sub-Menus */}
        <div className={`transition-all duration-500 ease-in-out ${activeModule ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
          {activeModule === "warehouse" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-2 mb-6">
                <h3 className="text-lg font-extrabold text-slate-800">Warehouse Operations</h3>
                <div className="flex-1 h-px bg-slate-200 ml-4"></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                
                <MenuCard 
                  href="/warehouse" 
                  icon={<LayoutDashboard className="w-6 h-6" />} 
                  title="Warehouse Dashboard" 
                  desc="Overview & Analytics"
                  colorClass="bg-blue-50 text-blue-600 border-blue-200 hover:border-blue-400" 
                />

                {hasPermission(currentUser, 'can_create_sales') && (
                  <MenuCard 
                    href="/pos" 
                    icon={<PackageCheck className="w-6 h-6" />} 
                    title="POS Entry" 
                    desc="Record Sales & Dispatch"
                    colorClass="bg-emerald-50 text-emerald-600 border-emerald-200 hover:border-emerald-400" 
                  />
                )}
                
                {hasPermission(currentUser, 'can_create_do') && (
                  <>
                    <MenuCard 
                      href="/orders/list" 
                      icon={<ListOrdered className="w-6 h-6" />} 
                      title="D.O List" 
                      desc="Active Delivery Orders"
                      colorClass="bg-violet-50 text-violet-600 border-violet-200 hover:border-violet-400" 
                    />
                    <MenuCard 
                      href="/orders" 
                      icon={<ClipboardList className="w-6 h-6" />} 
                      title="DO & Receive" 
                      desc="Manage Stock Entries"
                      colorClass="bg-sky-50 text-sky-600 border-sky-200 hover:border-sky-400" 
                    />
                  </>
                )}

                {hasPermission(currentUser, 'can_view_reports') && (
                  <>
                    <MenuCard 
                      href="/reports/stock" 
                      icon={<BarChart3 className="w-6 h-6" />} 
                      title="Stock Report" 
                      desc="Real-time Inventory Ledger"
                      colorClass="bg-indigo-50 text-indigo-600 border-indigo-200 hover:border-indigo-400" 
                    />
                    <MenuCard 
                      href="/reports/expiry" 
                      icon={<AlertTriangle className="w-6 h-6" />} 
                      title="Expiry Report" 
                      desc="Expiring Batch Tracker"
                      colorClass="bg-rose-50 text-rose-600 border-rose-200 hover:border-rose-400" 
                    />
                  </>
                )}

                <MenuCard 
                  href="/invoices" 
                  icon={<Printer className="w-6 h-6" />} 
                  title="Challans" 
                  desc="Print Invoices & Receipts"
                  colorClass="bg-slate-100 text-slate-600 border-slate-300 hover:border-slate-400" 
                />
              </div>
            </div>
          )}

          {activeModule === "accounts" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-2 mb-6">
                <h3 className="text-lg font-extrabold text-slate-800">Finance & Accounts</h3>
                <div className="flex-1 h-px bg-slate-200 ml-4"></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                
                {hasPermission(currentUser, 'can_view_accounting') ? (
                  <MenuCard 
                    href="/accounting" 
                    icon={<DollarSign className="w-6 h-6" />} 
                    title="Accounting System" 
                    desc="Ledgers & Cashbook"
                    colorClass="bg-amber-50 text-amber-600 border-amber-200 hover:border-amber-400" 
                  />
                ) : (
                  (currentUser?.role === "DEPOT_ADMIN" || currentUser?.role === "OPERATOR") && (
                    <MenuCard 
                      href="/accounting" 
                      icon={<DollarSign className="w-6 h-6" />} 
                      title="Daily Expenses" 
                      desc="Record Depot Expenditure"
                      colorClass="bg-amber-50 text-amber-600 border-amber-200 hover:border-amber-400" 
                    />
                  )
                )}

                {currentUser?.role === "SUPER_ADMIN" && (
                  <MenuCard 
                    href="/admin" 
                    icon={<TrendingUp className="w-6 h-6" />} 
                    title="Master Admin Panel" 
                    desc="Global Setup & Overrides"
                    colorClass="bg-purple-50 text-purple-600 border-purple-200 hover:border-purple-400" 
                  />
                )}
                
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}

function MenuCard({ href, icon, title, desc, colorClass }: { href: string; icon: React.ReactNode; title: string; desc: string; colorClass: string }) {
  return (
    <Link href={href} className={`flex flex-col p-5 rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-lg bg-white ${colorClass}`}>
      <div className="mb-4 bg-white/50 w-fit p-3 rounded-xl shadow-sm backdrop-blur-sm">
        {icon}
      </div>
      <h4 className="font-bold text-slate-900 text-sm mb-1">{title}</h4>
      <p className="text-[11px] text-slate-500 font-medium">{desc}</p>
    </Link>
  );
}
