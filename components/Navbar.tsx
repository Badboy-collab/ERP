"use client";

import Link from "next/link";
import { Factory, PackageCheck, Layers, ClipboardList, Printer, ShieldAlert, BarChart3, AlertTriangle, ListOrdered } from "lucide-react";

export default function Navbar() {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-emerald-600 to-green-400 p-2 rounded-xl shadow-lg shadow-emerald-500/20">
              <Factory className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-emerald-400 bg-clip-text text-transparent">
                MATBER AGRO
              </span>
              <span className="text-xs block text-emerald-400 font-semibold tracking-wider uppercase">
                Industries Ltd • Enterprise ERP
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-1">
            <Link
              href="/"
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/pos"
              className="px-3 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/50 transition-all flex items-center space-x-1.5"
            >
              <PackageCheck className="w-4 h-4" />
              <span>POS Entry</span>
            </Link>
            <Link
              href="/orders/list"
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center space-x-1.5"
            >
              <ListOrdered className="w-4 h-4 text-emerald-400" />
              <span>D.O List</span>
            </Link>
            <Link
              href="/reports/stock"
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center space-x-1.5"
            >
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>Stock Report</span>
            </Link>
            <Link
              href="/reports/expiry"
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center space-x-1.5"
            >
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Expiry Report</span>
            </Link>
            <Link
              href="/invoices"
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center space-x-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Challans</span>
            </Link>
            <Link
              href="/orders"
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center space-x-1.5"
            >
              <ClipboardList className="w-4 h-4" />
              <span>DO & Receive</span>
            </Link>
            <Link
              href="/admin"
              className="px-3 py-2 rounded-lg text-sm font-medium text-amber-400 hover:bg-amber-950/40 border border-amber-800/60 transition-colors flex items-center space-x-1.5"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Admin Panel</span>
            </Link>
          </nav>

          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center gap-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950 text-emerald-400 border border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Multi-Depot Live
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
