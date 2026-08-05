"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { ShieldAlert, Package, Building2, Users, CheckCircle, Trash2, Edit, Save, Plus } from "lucide-react";
import SearchableSelect from "@/components/SearchableSelect";

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
  address: string | null;
  phone: string | null;
}

interface Dealer {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  depot_id: string;
  depot?: Depot | null;
  current_balance: number;
}

interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: string;
  depot_id: string | null;
  depot?: Depot | null;
  can_create_do: boolean;
  can_edit_sales: boolean;
  can_delete_sales: boolean;
  can_create_sales: boolean;
  can_receive_stock: boolean;
  can_view_reports: boolean;
  can_view_accounting: boolean;
  can_manage_accounting: boolean;
}

interface TransactionItem {
  id: string;
  invoice_no: string;
  date: string;
  quantity: number;
  product: { name: string };
  depot: { name: string };
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"depots" | "products" | "dealers" | "users" | "override">("depots");

  const [products, setProducts] = useState<Product[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [salesLogs, setSalesLogs] = useState<TransactionItem[]>([]);
  const [receiveLogs, setReceiveLogs] = useState<TransactionItem[]>([]);

  // Depot Form State
  const [depotCode, setDepotCode] = useState("");
  const [depotName, setDepotName] = useState("");
  const [depotAddress, setDepotAddress] = useState("");
  const [depotPhone, setDepotPhone] = useState("");

  // Product Form State
  const [prodCode, setProdCode] = useState("");
  const [prodName, setProdName] = useState("");
  const [prodCategory, setProdCategory] = useState("Poultry Feed");
  const [prodBagSize, setProdBagSize] = useState<number>(50.0);
  const [prodOpeningStock, setProdOpeningStock] = useState<number>(0);

  // Dealer Form State
  const [dealerName, setDealerName] = useState("");
  const [dealerPhone, setDealerPhone] = useState("");
  const [dealerAddress, setDealerAddress] = useState("");
  const [dealerDepotId, setDealerDepotId] = useState("");
  const [dealerBalance, setDealerBalance] = useState<number>(0.0);

  // User Form State
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userRole, setUserRole] = useState("OPERATOR");
  const [userDepotId, setUserDepotId] = useState("");
  const [userPermissions, setUserPermissions] = useState({
    can_create_do: false,
    can_edit_sales: false,
    can_delete_sales: false,
    can_create_sales: true,
    can_receive_stock: true,
    can_view_reports: true,
    can_view_accounting: false,
    can_manage_accounting: false,
  });

  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, [activeTab]);

  const fetchInitialData = async () => {
    try {
      if (activeTab === "depots") {
        const res = await fetch("/api/admin/depots");
        if (res.ok) setDepots(await res.json());
      } else if (activeTab === "products") {
        const res = await fetch("/api/products");
        if (res.ok) setProducts(await res.json());
      } else if (activeTab === "dealers") {
        const [dRes, depRes] = await Promise.all([fetch("/api/dealers"), fetch("/api/admin/depots")]);
        if (dRes.ok) setDealers(await dRes.json());
        if (depRes.ok) setDepots(await depRes.json());
      } else if (activeTab === "users") {
        const [uRes, depRes] = await Promise.all([fetch("/api/admin/users"), fetch("/api/admin/depots")]);
        if (uRes.ok) setUsers(await uRes.json());
        if (depRes.ok) setDepots(await depRes.json());
      } else if (activeTab === "override") {
        const [sRes, rRes] = await Promise.all([fetch("/api/sales"), fetch("/api/receives")]);
        if (sRes.ok) setSalesLogs(await sRes.json());
        if (rRes.ok) setReceiveLogs(await rRes.json());
      }
    } catch (err) {
      console.error(err);
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
          phone: depotPhone,
        }),
      });
      if (!res.ok) throw new Error("Failed to create depot");
      setMessage({ type: "success", text: "Depot created successfully!" });
      setDepotCode("");
      setDepotName("");
      setDepotAddress("");
      setDepotPhone("");
      fetchInitialData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
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
      setMessage({ type: "success", text: "Product created successfully!" });
      setProdCode("");
      setProdName("");
      setProdOpeningStock(0);
      fetchInitialData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const handleCreateDealer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/dealers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: dealerName,
          phone: dealerPhone,
          address: dealerAddress,
          depot_id: dealerDepotId,
          current_balance: dealerBalance,
        }),
      });
      if (!res.ok) throw new Error("Failed to create dealer");
      setMessage({ type: "success", text: "Dealer created successfully!" });
      setDealerName("");
      setDealerPhone("");
      setDealerAddress("");
      setDealerDepotId("");
      setDealerBalance(0);
      fetchInitialData();
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
          password: userPassword,
          role: userRole,
          depot_id: userRole === "SUPER_ADMIN" ? null : userDepotId || null,
          ...userPermissions,
        }),
      });
      if (!res.ok) throw new Error("Failed to create user");
      setMessage({ type: "success", text: "User created successfully!" });
      setUserName("");
      setUserEmail("");
      setUserPassword("");
      setUserRole("OPERATOR");
      setUserDepotId("");
      setUserPermissions({
        can_create_do: false,
        can_edit_sales: false,
        can_delete_sales: false,
        can_create_sales: true,
        can_receive_stock: true,
        can_view_reports: true,
        can_view_accounting: false,
        can_manage_accounting: false,
      });
      fetchInitialData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const handleEditUserPermissions = async (user: UserAccount) => {
    setEditingUserId(user.id);
    setUserRole(user.role);
    setUserDepotId(user.depot_id || "");
    setUserPermissions({
      can_create_do: user.can_create_do,
      can_edit_sales: user.can_edit_sales,
      can_delete_sales: user.can_delete_sales,
      can_create_sales: user.can_create_sales,
      can_receive_stock: user.can_receive_stock,
      can_view_reports: user.can_view_reports,
      can_view_accounting: user.can_view_accounting,
      can_manage_accounting: user.can_manage_accounting,
    });
  };

  const handleSaveUserPermissions = async (userId: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: userId,
          role: userRole,
          depot_id: userRole === "SUPER_ADMIN" ? null : userDepotId || null,
          ...userPermissions,
        }),
      });
      if (!res.ok) throw new Error("Failed to update user");
      setMessage({ type: "success", text: "User updated successfully!" });
      setEditingUserId(null);
      fetchInitialData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete user");
      setMessage({ type: "success", text: "User deleted successfully!" });
      fetchInitialData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const handleDeleteSalesRecord = async (logId: string) => {
    if (!confirm("Are you sure you want to delete this sales dispatch record? This is a permanent direct override.")) return;
    try {
      const res = await fetch(`/api/sales?id=${logId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete sales log");
      setMessage({ type: "success", text: "Sales dispatch record deleted!" });
      fetchInitialData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const handleDeleteReceiveRecord = async (logId: string) => {
    if (!confirm("Are you sure you want to delete this receiving record?")) return;
    try {
      const res = await fetch(`/api/receives?id=${logId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete receive log");
      setMessage({ type: "success", text: "Receive record deleted!" });
      fetchInitialData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const depotOptions = depots.map((d) => ({ value: d.id, label: `${d.name} (${d.code})` }));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-amber-400" />
            Master Admin Control Panel
          </h1>
          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs font-bold flex-wrap gap-1">
            {["depots", "products", "dealers", "users", "override"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 rounded-lg transition-all capitalize ${
                  activeTab === tab ? "bg-amber-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                {tab === "override" ? "Master Override" : tab}
              </button>
            ))}
          </div>
        </div>

        {message && (
          <div
            className={`p-4 rounded-xl text-sm font-semibold border ${
              message.type === "success"
                ? "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                : "bg-rose-950/80 text-rose-300 border-rose-800"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Tab 1: Depots */}
        {activeTab === "depots" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <form onSubmit={handleCreateDepot} className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-base font-extrabold text-white mb-2 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" /> Add Depot Location
              </h2>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Depot Code (Unique) *</label>
                <input type="text" value={depotCode} onChange={(e) => setDepotCode(e.target.value)} placeholder="e.g. DEP-PAB" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white uppercase" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Depot Name *</label>
                <input type="text" value={depotName} onChange={(e) => setDepotName(e.target.value)} placeholder="e.g. Pabna Depot" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Address</label>
                <input type="text" value={depotAddress} onChange={(e) => setDepotAddress(e.target.value)} placeholder="Depot location address" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
                <input type="text" value={depotPhone} onChange={(e) => setDepotPhone(e.target.value)} placeholder="Contact phone number" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white" />
              </div>
              <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold py-2.5 rounded-xl shadow-lg transition-all text-xs">
                Add Depot Location
              </button>
            </form>

            <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-base font-extrabold text-white">Registered Depots ({depots.length})</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-800">
                  <thead className="bg-slate-950 text-slate-400 font-bold uppercase">
                    <tr>
                      <th className="p-3">Code</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">Address</th>
                      <th className="p-3">Phone</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-medium">
                    {depots.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-amber-400 uppercase">{d.code}</td>
                        <td className="p-3 text-white font-bold">{d.name}</td>
                        <td className="p-3 text-slate-300">{d.address || "N/A"}</td>
                        <td className="p-3 text-slate-400 font-mono">{d.phone || "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Products */}
        {activeTab === "products" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <form onSubmit={handleCreateProduct} className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-base font-extrabold text-white mb-2 flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" /> Add Product Item
              </h2>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Product Code *</label>
                <input type="text" value={prodCode} onChange={(e) => setProdCode(e.target.value)} placeholder="e.g. 510" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Product Name *</label>
                <input type="text" value={prodName} onChange={(e) => setProdName(e.target.value)} placeholder="e.g. Broiler Starter (C) 510" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                <select value={prodCategory} onChange={(e) => setProdCategory(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white">
                  <option>Poultry Feed</option>
                  <option>Fish Feed</option>
                  <option>Cattle Feed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Bag Size (Kg) *</label>
                <input type="number" step="any" value={prodBagSize} onChange={(e) => setProdBagSize(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-bold" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Opening Stock (Kg) *</label>
                <input type="number" value={prodOpeningStock} onChange={(e) => setProdOpeningStock(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-bold" required />
              </div>
              <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold py-2.5 rounded-xl shadow-lg transition-all text-xs">
                Add Product Item
              </button>
            </form>

            <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-base font-extrabold text-white">Product Catalog ({products.length})</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-800">
                  <thead className="bg-slate-950 text-slate-400 font-bold uppercase">
                    <tr>
                      <th className="p-3">Code</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">Category</th>
                      <th className="p-3 text-right">Bag Size</th>
                      <th className="p-3 text-right">Opening Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-medium">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-amber-400">{p.code}</td>
                        <td className="p-3 text-white font-bold">{p.name}</td>
                        <td className="p-3 text-slate-400 font-bold uppercase text-[10px]">{p.category}</td>
                        <td className="p-3 text-right font-mono text-slate-300">{p.bag_size_kg} kg</td>
                        <td className="p-3 text-right font-mono text-slate-300">{p.opening_stock} kg</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Dealers */}
        {activeTab === "dealers" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <form onSubmit={handleCreateDealer} className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-base font-extrabold text-white mb-2 flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" /> Register Dealer
              </h2>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Dealer Name *</label>
                <input type="text" value={dealerName} onChange={(e) => setDealerName(e.target.value)} placeholder="e.g. Sarder Poultry" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number *</label>
                <input type="text" value={dealerPhone} onChange={(e) => setDealerPhone(e.target.value)} placeholder="Dealer contact phone" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Address</label>
                <input type="text" value={dealerAddress} onChange={(e) => setDealerAddress(e.target.value)} placeholder="Dealer location" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Assigned Depot *</label>
                <SearchableSelect options={depotOptions} value={dealerDepotId} onChange={setDealerDepotId} placeholder="Select Depot..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Opening Balance (Dues) *</label>
                <input type="number" step="any" value={dealerBalance} onChange={(e) => setDealerBalance(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-bold" required />
              </div>
              <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold py-2.5 rounded-xl shadow-lg transition-all text-xs">
                Register Dealer
              </button>
            </form>

            <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-base font-extrabold text-white">Registered Dealers ({dealers.length})</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-800">
                  <thead className="bg-slate-950 text-slate-400 font-bold uppercase">
                    <tr>
                      <th className="p-3">Name</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Address</th>
                      <th className="p-3">Depot</th>
                      <th className="p-3 text-right">Ledger Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-medium">
                    {dealers.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-800/40">
                        <td className="p-3 text-white font-bold">{d.name}</td>
                        <td className="p-3 text-slate-400 font-mono">{d.phone}</td>
                        <td className="p-3 text-slate-300">{d.address || "N/A"}</td>
                        <td className="p-3 text-emerald-400">{d.depot?.name || "Unassigned"}</td>
                        <td className="p-3 text-right font-mono font-bold text-rose-400">{d.current_balance.toLocaleString()} Tk</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Users & RBAC */}
        {activeTab === "users" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" /> {editingUserId ? "Edit User Account" : "Register User Account"}
              </h2>
              
              {!editingUserId ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">User Name *</label>
                    <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="User's Full Name" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
                    <input type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="user@company.com" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Password *</label>
                    <input type="password" value={userPassword} onChange={(e) => setUserPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white" required />
                  </div>
                </>
              ) : (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                  <p className="font-bold text-slate-300">Modifying Role & Permissions for User:</p>
                  <p className="text-emerald-400 font-black mt-1">{users.find(u => u.id === editingUserId)?.name}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">User Role *</label>
                <select value={userRole} onChange={(e) => setUserRole(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-bold">
                  <option value="OPERATOR">Operator</option>
                  <option value="DEPOT_ADMIN">Depot Admin</option>
                  <option value="SUPER_ADMIN">Super Admin (All Depots)</option>
                </select>
              </div>

              {userRole !== "SUPER_ADMIN" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Assign Depot *</label>
                  <SearchableSelect options={depotOptions} value={userDepotId} onChange={setUserDepotId} placeholder="Assign Depot..." />
                </div>
              )}

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="block text-xs font-bold text-amber-400">Granular Permissions</label>
                {Object.keys(userPermissions).map((perm) => (
                  <label key={perm} className="flex items-center space-x-2 text-xs text-slate-300 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(userPermissions as any)[perm]}
                      onChange={(e) => setUserPermissions({ ...userPermissions, [perm]: e.target.checked })}
                      className="rounded border-slate-800 text-emerald-600 focus:ring-emerald-500 bg-slate-950"
                    />
                    <span className="capitalize">{perm.replace(/_/g, " ")}</span>
                  </label>
                ))}
              </div>

              {editingUserId ? (
                <div className="flex gap-2">
                  <button onClick={() => handleSaveUserPermissions(editingUserId)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold py-2.5 rounded-xl transition-all text-xs flex items-center justify-center gap-1">
                    <Save className="w-4 h-4" /> Save User
                  </button>
                  <button onClick={() => setEditingUserId(null)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 px-4 rounded-xl transition-all text-xs">
                    Cancel
                  </button>
                </div>
              ) : (
                <button onClick={handleCreateUser} className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold py-2.5 rounded-xl shadow-lg transition-all text-xs">
                  Create User Account
                </button>
              )}
            </div>

            <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-base font-extrabold text-white font-black">User Directory ({users.length})</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-800">
                  <thead className="bg-slate-950 text-slate-400 font-bold uppercase">
                    <tr>
                      <th className="p-3">User</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Depot Access</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-medium">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/40">
                        <td className="p-3">
                          <p className="text-white font-bold">{u.name}</p>
                          <p className="text-slate-400 font-mono text-[10px]">{u.email}</p>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            u.role === "SUPER_ADMIN" ? "bg-rose-950/80 text-rose-300 border-rose-800" :
                            u.role === "DEPOT_ADMIN" ? "bg-emerald-950/80 text-emerald-300 border-emerald-800" :
                            "bg-slate-800 text-slate-400 border-slate-700"
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3 text-slate-300">{u.depot?.name || "Global Master"}</td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleEditUserPermissions(u)} className="p-1 text-slate-400 hover:text-emerald-400 rounded hover:bg-slate-950 transition-colors">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteUser(u.id)} className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-950 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Master Override */}
        {activeTab === "override" && (
          <div className="space-y-8">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-base font-extrabold text-red-400 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" /> Master Sales Dispatches List (Direct Override)
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-800">
                  <thead className="bg-slate-950 text-slate-400 font-bold uppercase">
                    <tr>
                      <th className="p-3">Invoice No</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Depot</th>
                      <th className="p-3">Product</th>
                      <th className="p-3 text-right">Qty (Kg)</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-medium">
                    {salesLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-white">{log.invoice_no}</td>
                        <td className="p-3 text-slate-400">{new Date(log.date).toLocaleDateString()}</td>
                        <td className="p-3 text-slate-300">{log.depot?.name}</td>
                        <td className="p-3 text-slate-100">{log.product?.name}</td>
                        <td className="p-3 text-right font-mono">{log.quantity.toLocaleString()} kg</td>
                        <td className="p-3 text-right">
                          <button onClick={() => handleDeleteSalesRecord(log.id)} className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-950 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-base font-extrabold text-blue-400 flex items-center gap-2">
                <Building2 className="w-5 h-5" /> Master Stock Receives List (Direct Override)
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-800">
                  <thead className="bg-slate-950 text-slate-400 font-bold uppercase">
                    <tr>
                      <th className="p-3">Receive ID / Invoice No</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Depot</th>
                      <th className="p-3">Product</th>
                      <th className="p-3 text-right">Qty (Kg)</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-medium">
                    {receiveLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-white">{log.invoice_no}</td>
                        <td className="p-3 text-slate-400">{new Date(log.date).toLocaleDateString()}</td>
                        <td className="p-3 text-slate-300">{log.depot?.name}</td>
                        <td className="p-3 text-slate-100">{log.product?.name}</td>
                        <td className="p-3 text-right font-mono">+{log.quantity.toLocaleString()} kg</td>
                        <td className="p-3 text-right">
                          <button onClick={() => handleDeleteReceiveRecord(log.id)} className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-950 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
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
