"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { ShieldAlert, Package, Building2, Users, UserCheck, Plus, CheckCircle } from "lucide-react";

interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  bag_size_kg: number;
  opening_stock: number;
}

interface Depot {
  id: string;
  code: string;
  name: string;
  address: string;
}

interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: string;
  depot?: { name: string; code: string } | null;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"products" | "depots" | "users" | "dealers">("products");

  const [products, setProducts] = useState<Product[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);

  // Product Form
  const [prodCode, setProdCode] = useState<string>("");
  const [prodName, setProdName] = useState<string>("");
  const [prodCategory, setProdCategory] = useState<string>("Poultry Feed");
  const [prodBagSize, setProdBagSize] = useState<number>(50.0);
  const [prodOpeningStock, setProdOpeningStock] = useState<number>(100);

  // Depot Form
  const [depotCode, setDepotCode] = useState<string>("");
  const [depotName, setDepotName] = useState<string>("");
  const [depotAddress, setDepotAddress] = useState<string>("");

  // User Form
  const [userName, setUserName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("OPERATOR");
  const [userDepotId, setUserDepotId] = useState<string>("");

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [pRes, dRes, uRes] = await Promise.all([
        fetch("/api/admin/products"),
        fetch("/api/admin/depots"),
        fetch("/api/admin/users"),
      ]);
      if (pRes.ok) setProducts(await pRes.json());
      if (dRes.ok) setDepots(await dRes.json());
      if (uRes.ok) setUsers(await uRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: prodCode,
          name: prodName,
          category: prodCategory,
          bag_size_kg: prodBagSize,
          opening_stock: prodOpeningStock,
        }),
      });
      if (!res.ok) throw new Error("Failed to create product");
      setMessage({ type: "success", text: `Product ${prodName} created successfully!` });
      setProdCode("");
      setProdName("");
      fetchAdminData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const handleCreateDepot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/depots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: depotCode,
          name: depotName,
          address: depotAddress,
        }),
      });
      if (!res.ok) throw new Error("Failed to create depot");
      setMessage({ type: "success", text: `Depot ${depotName} registered!` });
      setDepotCode("");
      setDepotName("");
      setDepotAddress("");
      fetchAdminData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: userName,
          email: userEmail,
          role: userRole,
          depot_id: userDepotId || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to create user account");
      setMessage({ type: "success", text: `User account ${userName} created!` });
      setUserName("");
      setUserEmail("");
      fetchAdminData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-amber-400" />
              Master Admin Control & Settings Panel
            </h1>
            <p className="text-sm text-slate-400">
              Exclusive Super Admin configuration: Feed Product Catalog, Depot Locations, RBAC User Accounts.
            </p>
          </div>

          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs font-bold">
            <button
              onClick={() => setActiveTab("products")}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === "products" ? "bg-amber-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              Product Catalog
            </button>
            <button
              onClick={() => setActiveTab("depots")}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === "depots" ? "bg-amber-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              Depots
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === "users" ? "bg-amber-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              User Accounts & RBAC
            </button>
          </div>
        </div>

        {message && (
          <div
            className={`p-4 rounded-xl text-sm flex items-center space-x-2 font-medium ${
              message.type === "success"
                ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800"
                : "bg-rose-950/80 text-rose-300 border border-rose-800"
            }`}
          >
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{message.text}</span>
          </div>
        )}

        {/* Tab 1: Product Catalog Management */}
        {activeTab === "products" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-base font-extrabold text-white mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" /> Create Feed Product
              </h2>
              <form onSubmit={handleCreateProduct} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Product Code</label>
                  <input
                    type="text"
                    placeholder="e.g. P-BR05"
                    value={prodCode}
                    onChange={(e) => setProdCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Product Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Broiler Finisher Feed 50kg"
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white"
                  >
                    <option value="Poultry Feed">Poultry Feed</option>
                    <option value="Fish Feed">Fish Feed</option>
                    <option value="Cattle Feed">Cattle Feed</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Bag Size (Kg)</label>
                    <input
                      type="number"
                      value={prodBagSize}
                      onChange={(e) => setProdBagSize(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Opening Stock (Bags)</label>
                    <input
                      type="number"
                      value={prodOpeningStock}
                      onChange={(e) => setProdOpeningStock(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl shadow-lg transition-all"
                >
                  Save Product to Catalog
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-base font-extrabold text-white">Active Product Catalog ({products.length})</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-semibold uppercase">
                    <tr>
                      <th className="p-3">Code</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">Category</th>
                      <th className="p-3 text-right">Bag Size</th>
                      <th className="p-3 text-right">Opening Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {products.map((p) => (
                      <tr key={p.id}>
                        <td className="p-3 font-mono font-bold text-amber-400">{p.code}</td>
                        <td className="p-3 text-white font-semibold">{p.name}</td>
                        <td className="p-3 text-slate-400">{p.category}</td>
                        <td className="p-3 text-right">{p.bag_size_kg} kg</td>
                        <td className="p-3 text-right font-bold">{p.opening_stock} bags</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Depots Management */}
        {activeTab === "depots" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-base font-extrabold text-white mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" /> Create Depot Location
              </h2>
              <form onSubmit={handleCreateDepot} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Depot Code</label>
                  <input
                    type="text"
                    placeholder="e.g. DEP-DHA"
                    value={depotCode}
                    onChange={(e) => setDepotCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Depot Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Dhaka Division Central Depot"
                    value={depotName}
                    onChange={(e) => setDepotName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Address</label>
                  <input
                    type="text"
                    placeholder="Location address"
                    value={depotAddress}
                    onChange={(e) => setDepotAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl shadow-lg transition-all"
                >
                  Register Depot
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-base font-extrabold text-white">Depot Network ({depots.length})</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {depots.map((d) => (
                  <div key={d.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1">
                    <span className="font-mono text-xs font-bold text-amber-400">{d.code}</span>
                    <h3 className="text-sm font-bold text-white">{d.name}</h3>
                    <p className="text-xs text-slate-400">{d.address || "Main Depot Zone"}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Users & RBAC */}
        {activeTab === "users" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-base font-extrabold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" /> Create User & Assign RBAC Role
              </h2>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Pervez Hossain"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="pervez@matberagro.com"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Assign Role</label>
                    <select
                      value={userRole}
                      onChange={(e) => setUserRole(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white font-bold"
                    >
                      <option value="SUPER_ADMIN">Super Admin</option>
                      <option value="DEPOT_ADMIN">Depot Admin</option>
                      <option value="OPERATOR">Operator / Staff</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Assigned Depot</label>
                    <select
                      value={userDepotId}
                      onChange={(e) => setUserDepotId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white"
                    >
                      <option value="">Global (All Depots)</option>
                      {depots.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl shadow-lg transition-all"
                >
                  Create User Account
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-base font-extrabold text-white">System User Accounts ({users.length})</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-semibold uppercase">
                    <tr>
                      <th className="p-3">User Name</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Depot Access</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td className="p-3 text-white font-bold">{u.name}</td>
                        <td className="p-3 text-slate-300 font-mono">{u.email}</td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase ${
                              u.role === "SUPER_ADMIN"
                                ? "bg-amber-950 text-amber-400 border-amber-800"
                                : u.role === "DEPOT_ADMIN"
                                ? "bg-blue-950 text-blue-400 border-blue-800"
                                : "bg-slate-800 text-slate-300 border-slate-700"
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-slate-400">
                          {u.depot?.name || "Global Master Access"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
