"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Lock, User, AlertCircle, Loader2, Eye, EyeOff, Factory, CheckSquare, Square } from "lucide-react";

export default function LoginPage() {
  const [organization, setOrganization] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedOrg = localStorage.getItem("erp_remembered_org");
    const savedUser = localStorage.getItem("erp_remembered_user");
    if (savedOrg || savedUser) {
      if (savedOrg) setOrganization(savedOrg);
      if (savedUser) setUsername(savedUser);
      setRememberMe(true);
    }
  }, []);

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

      // Handle Remember Me
      if (rememberMe) {
        localStorage.setItem("erp_remembered_org", organization);
        localStorage.setItem("erp_remembered_user", username);
      } else {
        localStorage.removeItem("erp_remembered_org");
        localStorage.removeItem("erp_remembered_user");
      }

      if (!res.ok) {
        throw new Error(data.error || "Login failed. Please check your credentials.");
      }

      // Sync with existing userSession localStorage for Navbar and client-side permissions
      localStorage.setItem("erp_active_user", JSON.stringify(data.user));

      // Redirect to protected dashboard
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message);
      setPassword(""); // Clear only password on fail
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      {/* LEFT PANEL: Branding & Welcome (Hidden on small mobile screens) */}
      <div className="md:w-1/2 bg-slate-50 border-r border-slate-200 p-12 flex flex-col justify-between relative overflow-hidden">
        {/* Subtle background overlay grids */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

        <div className="relative z-10">
          <span className="text-emerald-700 font-black tracking-widest text-xs uppercase border border-emerald-500/30 bg-emerald-100/50 px-3 py-1 rounded-full">
            MULTI-TENANT ERP
          </span>
        </div>

        <div className="space-y-4 my-auto relative z-10 max-w-lg">
          <div className="inline-block mb-4 w-auto">
            <Image src="/logo.png" alt="NEXORA ERP ENTERPRISE" width={250} height={80} priority className="object-contain drop-shadow-sm" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Welcome to <span className="text-emerald-600">NEXORA ERP</span>
          </h1>
          <p className="text-slate-600 text-sm lg:text-base leading-relaxed font-medium">
            Streamlining business operations, inventory, sales, and management. Experience real-time stock control, granular RBAC, and automated processing.
          </p>
        </div>

        <div className="relative z-10">
          <p className="text-slate-500 text-xs font-semibold">
            &copy; {new Date().getFullYear()} Nexora ERP Enterprise. All rights reserved.
          </p>
        </div>
      </div>

      {/* RIGHT PANEL: Form */}
      <div className="md:w-1/2 flex items-center justify-center p-8 sm:p-12 bg-white">
        <div className="w-full max-w-md space-y-8 bg-slate-50 border border-slate-200 p-8 rounded-3xl shadow-2xl">
          <div className="text-center md:text-left space-y-2">
            <h2 className="text-2xl font-black text-slate-900">Sign In to Account</h2>
            <p className="text-xs text-slate-600 font-medium">
              Enter your credential keys to access depot logs & dashboard.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center space-x-2 text-rose-600 text-xs font-semibold animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Organization Name</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-500">
                  <Factory className="w-4.5 h-4.5" />
                </span>
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="e.g. matber-agro"
                  className="w-full bg-white border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl py-2.5 pl-11 pr-4 text-sm text-slate-900 font-bold transition-all outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Username / Email</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-500">
                  <User className="w-4.5 h-4.5" />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full bg-white border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl py-2.5 pl-11 pr-4 text-sm text-slate-900 font-bold transition-all outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Password</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-500">
                  <Lock className="w-4.5 h-4.5" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl py-2.5 pl-11 pr-10 text-sm text-slate-900 font-bold transition-all outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-emerald-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setRememberMe(!rememberMe)}
                className="flex items-center space-x-2 text-slate-600 hover:text-emerald-600 transition-colors"
              >
                {rememberMe ? (
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500" />
                )}
                <span className="text-xs font-semibold">Remember Me</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-900 font-black py-3 rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2 text-sm"
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
