"use client";

import { useState } from "react";
import { ShieldCheck, Lock, User, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";

export default function SuperAdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/super-admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed. Please check your credentials.");
      }

      localStorage.setItem("erp_active_user", JSON.stringify(data.user));
      window.location.href = "/super-admin";
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-amber-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-slate-800/40 blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-md space-y-8 bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 sm:p-10 rounded-[2rem] shadow-2xl relative z-10">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 mb-2 shadow-inner">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">Master Control</h2>
          <p className="text-sm text-slate-400 font-medium">
            Restricted access. Super Admin credentials required.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-rose-950/60 border border-rose-800/80 rounded-2xl flex items-center space-x-3 text-rose-300 text-sm font-semibold animate-shake shadow-lg">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">Master ID</label>
            <div className="relative group">
              <span className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-amber-500 transition-colors">
                <User className="w-5 h-5" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full bg-slate-950/50 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-2xl py-3 pl-12 pr-4 text-sm text-white font-bold transition-all outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">Access Key</label>
            <div className="relative group">
              <span className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-amber-500 transition-colors">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/50 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-2xl py-3 pl-12 pr-12 text-sm text-white font-bold transition-all outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5 text-slate-500 hover:text-amber-500 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 text-slate-950 font-black py-3.5 rounded-2xl shadow-lg shadow-amber-900/20 transition-all flex items-center justify-center space-x-2 text-sm mt-8"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Authenticate</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
