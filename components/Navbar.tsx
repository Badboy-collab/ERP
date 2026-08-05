"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Factory, PackageCheck, Layers, ClipboardList, Printer,
  ShieldAlert, BarChart3, AlertTriangle, ListOrdered,
  UserCircle, ChevronDown, X, ShieldCheck, Users, DollarSign
} from "lucide-react";
import { getSessionUser, setSessionUser, clearSessionUser, SessionUser, hasPermission } from "@/lib/userSession";

export default function Navbar() {
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [users, setUsers] = useState<SessionUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    setCurrentUser(getSessionUser());
  }, []);

  const openSwitcher = async () => {
    setShowSwitcher(true);
    if (users.length === 0) {
      setLoadingUsers(true);
      try {
        const res = await fetch("/api/auth/users");
        if (res.ok) setUsers(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingUsers(false);
      }
    }
  };

  const handleSelectUser = async (user: SessionUser) => {
    try {
      const res = await fetch("/api/auth/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      if (res.ok) {
        setSessionUser(user);
        setCurrentUser(user);
        setShowSwitcher(false);
        window.location.href = "/dashboard";
      }
    } catch (err) {
      console.error("Failed to switch user", err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Failed to logout session", err);
    }
    clearSessionUser();
    setCurrentUser(null);
    setShowSwitcher(false);
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
            <div className="flex items-center space-x-3">
              <button
                onClick={openSwitcher}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl px-3 py-1.5 transition-colors group"
              >
                <UserCircle className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                <div className="text-left hidden sm:block">
                  {currentUser ? (
                    <>
                      <div className="text-xs font-bold text-white leading-none">{currentUser.name}</div>
                      <div className={`text-[10px] font-semibold mt-0.5 px-1.5 py-0.5 rounded-full inline-block border ${roleColor(currentUser.role)}`}>
                        {currentUser.role.replace("_", " ")}
                        {currentUser.depot && ` • ${currentUser.depot.code}`}
                      </div>
                    </>
                  ) : (
                    <div className="text-xs font-semibold text-slate-400">Switch User</div>
                  )}
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* User Switcher Modal */}
      {showSwitcher && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-bold text-white">Switch Active User</h2>
              </div>
              <button onClick={() => setShowSwitcher(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
              {loadingUsers ? (
                <p className="text-slate-400 text-sm text-center py-6 animate-pulse">Loading users...</p>
              ) : users.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-6">No users found. Add users in Admin Panel.</p>
              ) : (
                users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleSelectUser(u)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left hover:scale-[1.01] ${
                      currentUser?.id === u.id
                        ? "bg-emerald-950/60 border-emerald-700"
                        : "bg-slate-800/60 border-slate-700 hover:border-slate-600"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${u.role === "SUPER_ADMIN" ? "bg-amber-950 text-amber-400" : "bg-sky-950 text-sky-400"}`}>
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white text-sm">{u.name}</div>
                      <div className="text-xs text-slate-400 font-mono">{u.email}</div>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleColor(u.role)}`}>
                        {u.role.replace("_", " ")}
                      </span>
                      {u.depot && (
                        <div className="text-[10px] text-slate-400 mt-0.5">{u.depot.name}</div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>

            {currentUser && (
              <div className="px-4 pb-4">
                <button
                  onClick={handleLogout}
                  className="w-full py-2 text-sm text-rose-400 hover:text-rose-300 border border-rose-900 hover:bg-rose-950/40 rounded-xl transition-colors font-semibold"
                >
                  Sign Out (Clear Session)
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
