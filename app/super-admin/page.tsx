"use client";

import { useEffect, useState } from "react";
import { 
  Building2, Users, Power, PowerOff, ShieldCheck, 
  Settings, ExternalLink, Activity, Search,
  Loader2
} from "lucide-react";
import { getSessionUser, SessionUser } from "@/lib/userSession";

interface OrgStat {
  total: number;
  active: number;
  suspended: number;
  totalUsers: number;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  status: string;
  total_users: number;
  main_admin: string;
}

export default function SuperAdminDashboard() {
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [stats, setStats] = useState<OrgStat | null>(null);
  const [loading, setLoading] = useState(true);
  const [enteringOrgId, setEnteringOrgId] = useState<string | null>(null);

  useEffect(() => {
    const user = getSessionUser();
    if (!user || user.role !== "SUPER_ADMIN") {
      window.location.href = "/super-admin/login";
      return;
    }
    setCurrentUser(user);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/super-admin/organizations");
      if (res.ok) {
        const data = await res.json();
        setOrganizations(data.organizations);
        setStats(data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnterOrg = async (org_id: string) => {
    setEnteringOrgId(org_id);
    try {
      const res = await fetch("/api/auth/super-admin/enter-org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_id }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("erp_active_user", JSON.stringify(data.user));
        window.location.href = "/dashboard";
      } else {
        alert("Failed to enter organization");
      }
    } catch (err) {
      console.error(err);
      alert("Error occurred while entering organization");
    } finally {
      setEnteringOrgId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error(err);
    }
    localStorage.removeItem("erp_active_user");
    window.location.href = "/super-admin/login";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      {/* Topbar */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                <ShieldCheck className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h1 className="font-black text-white text-lg tracking-tight">MASTER ADMIN</h1>
                <p className="text-[10px] text-amber-500 uppercase tracking-widest font-bold">Nexora Control Center</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <div className="text-sm font-bold text-white">{currentUser?.name}</div>
                <div className="text-xs text-slate-400">{currentUser?.email}</div>
              </div>
              <button 
                onClick={handleLogout}
                className="bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-900/50 transition-all p-2 rounded-xl"
                title="Secure Logout"
              >
                <PowerOff className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
              <div className="flex items-center justify-between mb-4">
                <div className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Total Orgs</div>
                <Building2 className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-3xl font-black text-white">{stats.total}</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
              <div className="flex items-center justify-between mb-4">
                <div className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Active Orgs</div>
                <Activity className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-3xl font-black text-white">{stats.active}</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
              <div className="flex items-center justify-between mb-4">
                <div className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Suspended</div>
                <Power className="w-5 h-5 text-rose-400" />
              </div>
              <div className="text-3xl font-black text-white">{stats.suspended}</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
              <div className="flex items-center justify-between mb-4">
                <div className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Total Users</div>
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <div className="text-3xl font-black text-white">{stats.totalUsers}</div>
            </div>
          </div>
        )}

        {/* Organizations List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-white">Registered Organizations</h2>
            <div className="relative w-full sm:w-72">
              <span className="absolute left-3 top-2.5 text-slate-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search organizations..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-lg py-2 pl-9 pr-4 text-sm text-slate-200 outline-none transition-colors"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/50 border-b border-slate-700/50 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  <th className="px-6 py-4">Organization</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Main Admin</th>
                  <th className="px-6 py-4">Users</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {organizations.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 text-slate-400 font-bold overflow-hidden">
                          {org.logo_url ? (
                            <img src={org.logo_url} alt={org.name} className="w-full h-full object-cover" />
                          ) : (
                            org.name.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-white">{org.name}</div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">{org.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        org.status === 'Active' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {org.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-300">{org.main_admin}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-800/50 text-slate-300 text-xs font-semibold">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        {org.total_users}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors" title="Settings">
                          <Settings className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleEnterOrg(org.id)}
                          disabled={enteringOrgId === org.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-500 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                        >
                          {enteringOrgId === org.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <ExternalLink className="w-4 h-4" />
                          )}
                          Enter
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {organizations.length === 0 && (
            <div className="p-12 text-center text-slate-500">
              No organizations found.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
