"use client";

import { useState } from "react";
import { Lock, User, AlertCircle, Loader2, Eye, EyeOff, Factory } from "lucide-react";

export default function LoginPage() {
  const [organization, setOrganization] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !username || !password) {
      setError("Please enter organization name, username, and password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organization, email: username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed. Please check your credentials.");
      }

      // Sync with existing userSession localStorage for Navbar and client-side permissions
      localStorage.setItem("erp_active_user", JSON.stringify(data.user));

      // Redirect to protected dashboard
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row font-sans">
      {/* LEFT PANEL: Branding & Welcome (Hidden on small mobile screens) */}
      <div className="md:w-1/2 bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 border-r border-slate-800/80 p-12 flex flex-col justify-between relative overflow-hidden">
        {/* Subtle background overlay grids */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#022c22_1px,transparent_1px),linear-gradient(to_bottom,#022c22_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

        <div className="relative z-10">
          <span className="text-emerald-400 font-black tracking-widest text-xs uppercase border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 rounded-full">
            Matber Agro Industries Ltd
          </span>
        </div>

        <div className="space-y-4 my-auto relative z-10 max-w-lg">
          <img src="/logo.png" alt="NEXORA ERP ENTERPRISE" className="w-auto h-20 mb-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
          <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Welcome to <span className="text-emerald-400">NEXORA ERP</span>
          </h1>
          <p className="text-slate-300 text-sm lg:text-base leading-relaxed font-medium">
            Streamlining feed distribution, inventory, sales, and depot management for Matber Agro Industries Ltd. Experience real-time stock control, granular RBAC, and automated sales processing.
          </p>
        </div>

        <div className="relative z-10 text-xs text-slate-500 font-semibold font-mono">
          © {new Date().getFullYear()} Matber Agro Industries Ltd. All rights reserved.
        </div>
      </div>

      {/* RIGHT PANEL: Form */}
      <div className="md:w-1/2 flex items-center justify-center p-8 sm:p-12 bg-slate-950">
        <div className="w-full max-w-md space-y-8 bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl">
          <div className="text-center md:text-left space-y-2">
            <h2 className="text-2xl font-black text-white">Sign In to Account</h2>
            <p className="text-xs text-slate-400 font-medium">
              Enter your credential keys to access depot logs & dashboard.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-2xl flex items-center space-x-2 text-rose-300 text-xs font-semibold animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">Organization Name</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-500">
                  <Factory className="w-4.5 h-4.5" />
                </span>
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="e.g. Matber Agro Industries Ltd"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white font-bold transition-all outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">Username / Email</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-500">
                  <User className="w-4.5 h-4.5" />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white font-bold transition-all outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">Password</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-500">
                  <Lock className="w-4.5 h-4.5" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl py-2.5 pl-11 pr-10 text-sm text-white font-bold transition-all outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-emerald-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 disabled:opacity-50 text-slate-950 font-black py-3 rounded-xl shadow-lg shadow-emerald-950/20 transition-all flex items-center justify-center space-x-2 text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <span>Access System</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
