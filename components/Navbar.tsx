"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import {
  Factory, PackageCheck, Layers, ClipboardList, Printer,
  ShieldAlert, BarChart3, AlertTriangle, ListOrdered,
  UserCircle, ChevronDown, X, ShieldCheck, Users, DollarSign
} from "lucide-react";
import { getSessionUser, setSessionUser, clearSessionUser, SessionUser, hasPermission } from "@/lib/userSession";

export default function Navbar() {
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    setCurrentUser(getSessionUser());
  }, []);

  const toggleProfile = () => {
    setShowProfile(!showProfile);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Failed to logout session", err);
    }
    clearSessionUser();
    setCurrentUser(null);
    setShowProfile(false);
    window.location.href = "/";
  };

  const roleColor = (role: string) => {
    if (role === "SUPER_ADMIN") return "text-amber-400 bg-amber-950 border-amber-800";
    if (role === "ORG_ADMIN") return "text-purple-400 bg-purple-950 border-purple-800";
    if (role === "DEPOT_ADMIN") return "text-sky-400 bg-sky-950 border-sky-800";
    return "text-slate-300 bg-slate-800 border-slate-700";
  };

  return (
    <>
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-white px-3 py-1.5 rounded-xl shadow-sm">
                <Image src="/logo.png" alt="NEXORA ERP" width={160} height={45} className="object-contain h-8 w-auto" />
              </div>
              <div className="hidden sm:block">
                <span className="text-[10px] block text-emerald-400 font-semibold tracking-wider uppercase border-l-2 border-emerald-800 pl-2 ml-1">
                  {currentUser?.org_name || "Matber Agro Industries Ltd."}
                </span>
              </div>
            </div>

            <nav className="hidden md:flex items-center space-x-1">
              <Link href="/dashboard" className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
                Dashboard
              </Link>
              {hasPermission(currentUser, 'can_create_sales') && (
                <Link href="/pos" className="px-3 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/50 transition-all flex items-center space-x-1.5">
                  <PackageCheck className="w-4 h-4" />
                  <span>POS Entry</span>
                </Link>
              )}
              {hasPermission(currentUser, 'can_create_do') && (
                <>
                  <Link href="/orders/list" className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center space-x-1.5">
                    <ListOrdered className="w-4 h-4 text-emerald-400" />
                    <span>D.O List</span>
                  </Link>
                  <Link href="/orders" className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center space-x-1.5">
                    <ClipboardList className="w-4 h-4" />
                    <span>DO & Receive</span>
                  </Link>
                </>
              )}
              {hasPermission(currentUser, 'can_view_reports') && (
                <>
                  <Link href="/reports/stock" className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center space-x-1.5">
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                    <span>Stock Report</span>
                  </Link>
                  <Link href="/reports/expiry" className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center space-x-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Expiry Report</span>
                  </Link>
                </>
              )}
              <Link href="/invoices" className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center space-x-1.5">
                <Printer className="w-4 h-4" />
                <span>Challans</span>
              </Link>
              {hasPermission(currentUser, 'can_view_accounting') && (
                <Link href="/accounting" className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center space-x-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Accounting</span>
                </Link>
              )}
              {currentUser?.role !== "SUPER_ADMIN" && !currentUser?.can_view_accounting && (currentUser?.role === "DEPOT_ADMIN" || currentUser?.role === "OPERATOR") && (
                <Link href="/accounting" className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center space-x-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Daily Expenses</span>
                </Link>
              )}
              {currentUser?.role === "SUPER_ADMIN" && (
                <Link href="/admin" className="px-3 py-2 rounded-lg text-sm font-medium text-amber-400 hover:bg-amber-950/40 border border-amber-800/60 transition-colors flex items-center space-x-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Admin Panel</span>
                </Link>
              )}
            </nav>

            {/* Active User Badge */}
            <div className="flex items-center space-x-3 relative">
              <button
                onClick={toggleProfile}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl px-3 py-1.5 transition-colors group"
              >
                <UserCircle className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                <div className="text-left hidden sm:block">
                  {currentUser ? (
                    <>
                      <div className="text-xs font-bold text-white leading-none">{currentUser.name}</div>
                      <div className={`text-[10px] font-semibold mt-0.5 px-1.5 py-0.5 rounded-full inline-block border ${roleColor(currentUser.role)}`}>
                        {currentUser.role.replace("_", " ")}
                      </div>
                    </>
                  ) : (
                    <div className="text-xs font-semibold text-slate-400">Profile</div>
                  )}
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* User Profile Dropdown */}
      {showProfile && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)}></div>
          <div className="absolute top-16 right-4 sm:right-8 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in slide-in-from-top-2 fade-in duration-200">
            {currentUser ? (
              <div className="p-4 border-b border-slate-800 flex items-start gap-3 bg-slate-800/30">
                <div className={`p-2 rounded-xl mt-0.5 ${currentUser.role === "SUPER_ADMIN" ? "bg-amber-950/50 text-amber-400 border border-amber-900/50" : "bg-sky-950/50 text-sky-400 border border-sky-900/50"}`}>
                  <UserCircle className="w-8 h-8" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white text-base truncate">{currentUser.name}</div>
                  <div className="text-xs text-slate-400 font-mono truncate mb-2">{currentUser.email}</div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleColor(currentUser.role)}`}>
                    {currentUser.role.replace("_", " ")}
                  </span>
                  {currentUser.depot && (
                    <div className="text-[11px] font-medium text-slate-300 mt-2 bg-slate-950/50 px-2 py-1 rounded border border-slate-800">
                      Depot: {currentUser.depot.name}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 text-sm border-b border-slate-800">
                Not logged in
              </div>
            )}

            <div className="p-3 space-y-2 bg-slate-900">
              {currentUser?.role === "SUPER_ADMIN" && (
                <button
                  onClick={() => { window.location.href = "/super-admin"; }}
                  className="w-full py-2.5 px-4 text-sm text-amber-500 hover:text-amber-400 bg-amber-950/10 hover:bg-amber-950/40 border border-amber-900/20 hover:border-amber-900/50 rounded-xl transition-all font-semibold flex items-center gap-3"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Exit to Master Dashboard
                </button>
              )}
              <button
                onClick={handleLogout}
                className="w-full py-2.5 px-4 text-sm text-rose-400 hover:text-rose-300 bg-rose-950/10 hover:bg-rose-950/40 border border-rose-900/20 hover:border-rose-900/50 rounded-xl transition-all font-semibold flex items-center gap-3"
              >
                <X className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
