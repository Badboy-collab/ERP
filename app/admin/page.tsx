"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { ShieldAlert, Package, Building2, Users, CheckCircle, Trash2, Edit, Save, Plus, DollarSign, X } from "lucide-react";
import SearchableSelect from "@/components/SearchableSelect";
import DualQuantityInput from "@/components/DualQuantityInput";
import { getSessionUser, SessionUser } from "@/lib/userSession";

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
  code: string;
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
  unit_price?: number;
  supplier_challan_no?: string;
  product: { name: string };
  depot: { name: string };
}

interface DeliveryOrderItem {
  id: string;
  ordered_qty: number;
  delivered_qty: number;
  pending_qty: number;
  product: { id: string; code: string; name: string; bag_size_kg: number };
}

interface DeliveryOrder {
  id: string;
  order_no: string;
  order_date: string;
  status: string;
  dealer: { id: string; name: string; phone: string };
  depot: { id: string; name: string; code: string };
  created_by?: string | null;
  createdAt: string;
  remarks?: string | null;
  items: DeliveryOrderItem[];
}

interface LotItem {
  id: string;
  lot_no: string;
  initial_qty: number;
  available_qty: number;
  status: string;
  createdAt: string;
  depot?: { name: string };
  product?: { name: string; code: string };
}

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [activeTab, setActiveTab] = useState<"depots" | "products" | "dealers" | "users" | "override" | "setup">("depots");

  useEffect(() => {
    setCurrentUser(getSessionUser());
  }, []);

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
  const [prodCategory, setProdCategory] = useState("Broiler");
  const [prodBagSize, setProdBagSize] = useState<number>(50.0);
  const [prodOpeningStock, setProdOpeningStock] = useState<number>(0);
  const [prodSortOrder, setProdSortOrder] = useState<number>(0);

  // Dealer Form State
  const [dealerName, setDealerName] = useState("");
  const [dealerCode, setDealerCode] = useState("");
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

  // Setup Form State
  const [setupDepotId, setSetupDepotId] = useState("");
  const [setupProductId, setSetupProductId] = useState("");
  const [setupQuantity, setSetupQuantity] = useState<number | "">("");
  const [setupCashAmount, setSetupCashAmount] = useState<number | "">("");

  // Edit Sales State (Super Admin)
  const [editingSale, setEditingSale] = useState<TransactionItem | null>(null);
  const [editSaleQty, setEditSaleQty] = useState("");
  const [editSalePrice, setEditSalePrice] = useState("");

  // Edit Receive State (Super Admin)
  const [editingReceive, setEditingReceive] = useState<TransactionItem | null>(null);
  const [editReceiveQty, setEditReceiveQty] = useState("");
  const [editReceiveChallan, setEditReceiveChallan] = useState("");

  // Edit Lot / Opening Stock State (Super Admin)
  const [lots, setLots] = useState<LotItem[]>([]);
  const [editingLot, setEditingLot] = useState<LotItem | null>(null);
  const [editLotInitQty, setEditLotInitQty] = useState("");
  const [editLotAvailQty, setEditLotAvailQty] = useState("");

  // Edit Depot State (Super Admin)
  const [editingDepot, setEditingDepot] = useState<Depot | null>(null);
  const [editDepotCode, setEditDepotCode] = useState("");
  const [editDepotName, setEditDepotName] = useState("");
  const [editDepotAddress, setEditDepotAddress] = useState("");
  const [editDepotPhone, setEditDepotPhone] = useState("");

  // Edit Product State (Super Admin)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProdCode, setEditProdCode] = useState("");
  const [editProdName, setEditProdName] = useState("");
  const [editProdCategory, setEditProdCategory] = useState("");
  const [editProdBagSize, setEditProdBagSize] = useState("");
  const [editProdOpeningStock, setEditProdOpeningStock] = useState("");
  const [editProdSortOrder, setEditProdSortOrder] = useState("");

  // Master Delivery Orders Override State
  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);
  const [viewOrder, setViewOrder] = useState<DeliveryOrder | null>(null);
  const [editOrderDealerId, setEditOrderDealerId] = useState<string>("");
  const [editOrderDate, setEditOrderDate] = useState<string>("");
  const [editOrderRemarks, setEditOrderRemarks] = useState<string>("");
  const [editOrderItems, setEditOrderItems] = useState<{ id?: string, product_id: string, ordered_qty: number | "" }[]>([]);

  // Edit Dealer State (Super Admin)
  const [editingDealer, setEditingDealer] = useState<Dealer | null>(null);
  const [editDealerName, setEditDealerName] = useState("");
  const [editDealerCode, setEditDealerCode] = useState("");
  const [editDealerPhone, setEditDealerPhone] = useState("");
  const [editDealerAddress, setEditDealerAddress] = useState("");
  const [editDealerDepotId, setEditDealerDepotId] = useState("");
  const [editDealerBalance, setEditDealerBalance] = useState("");

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "override") {
      fetchDeliveryOrders();
    }
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
        const [sRes, rRes, lRes, depRes, dealerRes, userRes, prodRes] = await Promise.all([
          fetch("/api/sales"),
          fetch("/api/receives"),
          fetch("/api/lots?include_zero=true"),
          fetch("/api/admin/depots"),
          fetch("/api/dealers"),
          fetch("/api/admin/users"),
          fetch("/api/products"),
        ]);
        if (sRes.ok) setSalesLogs(await sRes.json());
        if (rRes.ok) setReceiveLogs(await rRes.json());
        if (lRes.ok) setLots(await lRes.json());
        if (depRes.ok) setDepots(await depRes.json());
        if (dealerRes.ok) setDealers(await dealerRes.json());
        if (userRes.ok) setUsers(await userRes.json());
        if (prodRes.ok) setProducts(await prodRes.json());
      } else if (activeTab === "setup") {
        const [depRes, prodRes] = await Promise.all([fetch("/api/admin/depots"), fetch("/api/products")]);
        if (depRes.ok) setDepots(await depRes.json());
        if (prodRes.ok) setProducts(await prodRes.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDeliveryOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setDeliveryOrders(data);
      } else {
        console.error("Failed to load delivery orders", await res.text());
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
          sort_order: prodSortOrder,
        }),
      });
      if (!res.ok) throw new Error("Failed to create product");
      setMessage({ type: "success", text: "Product created successfully!" });
      setProdCode("");
      setProdName("");
      setProdOpeningStock(0);
      setProdSortOrder(0);
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
          code: dealerCode,
          phone: dealerPhone,
          address: dealerAddress,
          depot_id: dealerDepotId,
          current_balance: dealerBalance,
        }),
      });
      if (!res.ok) throw new Error("Failed to create dealer");
      setMessage({ type: "success", text: "Dealer created successfully!" });
      setDealerName("");
      setDealerCode("");
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
          depot_id: (userRole === "SUPER_ADMIN" || userRole === "ORG_ADMIN") ? null : userDepotId || null,
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
    setUserPassword(""); // Clear password field by default when editing starts
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
          password: userPassword, // Include password if user types one to change it
          ...userPermissions,
        }),
      });
      if (!res.ok) throw new Error("Failed to update user");
      setMessage({ type: "success", text: "User updated successfully!" });
      setEditingUserId(null);
      setUserPassword(""); // Clear password field state
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
    if (currentUser?.role !== "SUPER_ADMIN") {
      alert("Permission Denied: Only Super Admin (Level 1) can reverse and delete sales records.");
      return;
    }
    if (!confirm("Are you sure you want to reverse & delete this sales dispatch record? This will automatically restore lot stock and reverse dealer balance.")) return;
    try {
      const res = await fetch(`/api/sales?id=${logId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to reverse sales log");
      setMessage({ type: "success", text: "Sales record reversed and stock restored successfully!" });
      fetchInitialData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const handleDeleteReceiveRecord = async (logId: string) => {
    if (currentUser?.role !== "SUPER_ADMIN") {
      alert("Permission Denied: Only Super Admin (Level 1) can reverse and delete stock receive records.");
      return;
    }
    if (!confirm("Are you sure you want to reverse & delete this receiving record? This will deduct the received quantity from the lot stock.")) return;
    try {
      const res = await fetch(`/api/receives?id=${logId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to reverse receive log");
      setMessage({ type: "success", text: "Receive record reversed and lot stock deducted successfully!" });
      fetchInitialData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const handleSaveEditSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSale) return;
    try {
      const res = await fetch("/api/sales", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingSale.id,
          quantity: Number(editSaleQty),
          unit_price: Number(editSalePrice),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update sales log");
      }
      setMessage({ type: "success", text: "Sales dispatch record overridden & stock/ledger recalculated successfully!" });
      setEditingSale(null);
      fetchInitialData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const handleSaveEditReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReceive) return;
    try {
      const res = await fetch("/api/receives", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingReceive.id,
          quantity: Number(editReceiveQty),
          supplier_challan_no: editReceiveChallan,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update receive log");
      }
      setMessage({ type: "success", text: "Stock receive record overridden & lot stock updated successfully!" });
      setEditingReceive(null);
      fetchInitialData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const handleDeleteLot = async (lotId: string) => {
    if (currentUser?.role !== "SUPER_ADMIN") {
      alert("Permission Denied: Only Super Admin (Level 1) can delete lot records.");
      return;
    }
    if (!confirm("Are you sure you want to delete this opening stock/lot entry?")) return;
    try {
      const res = await fetch(`/api/lots?id=${lotId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete lot");
      setMessage({ type: "success", text: "Opening stock / lot deleted successfully!" });
      fetchInitialData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const handleSaveEditLot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLot) return;
    try {
      const res = await fetch("/api/lots", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingLot.id,
          initial_qty: Number(editLotInitQty),
          available_qty: Number(editLotAvailQty),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update lot stock");
      }
      setMessage({ type: "success", text: "Opening stock / lot quantity overridden successfully!" });
      setEditingLot(null);
      fetchInitialData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const handleEditDeliveryOrder = (order: DeliveryOrder) => {
    if (currentUser?.role !== "SUPER_ADMIN") {
      alert("Permission Denied: Only Super Admin (Level 1) can edit delivery orders.");
      return;
    }
    setSelectedOrder(order);
    setEditOrderDealerId(order.dealer.id);
    setEditOrderDate(new Date(order.order_date).toISOString().split("T")[0]);
    setEditOrderRemarks(order.remarks || "");
    setEditOrderItems(order.items.map(item => ({ id: item.id, product_id: item.product.id, ordered_qty: item.ordered_qty })));
  };

  const handleSaveDeliveryOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || currentUser?.role !== "SUPER_ADMIN") return;

    try {
      const res = await fetch("/api/orders/override", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedOrder.id,
          dealer_id: editOrderDealerId,
          order_date: editOrderDate,
          remarks: editOrderRemarks || null,
          items: editOrderItems.map(it => ({ id: it.id, product_id: it.product_id, ordered_qty: Number(it.ordered_qty) })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update delivery order");

      setMessage({ type: "success", text: "Delivery order updated successfully!" });
      setSelectedOrder(null);
      fetchDeliveryOrders();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const handleDeleteDeliveryOrder = async (order: DeliveryOrder) => {
    if (currentUser?.role !== "SUPER_ADMIN") {
      alert("Permission Denied: Only Super Admin (Level 1) can delete delivery orders.");
      return;
    }
    if (!confirm(`Delete delivery order ${order.order_no}? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/orders/override?id=${order.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete delivery order");

      setMessage({ type: "success", text: data.message || "Delivery order deleted successfully!" });
      fetchDeliveryOrders();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  // ─── Depot Edit/Delete Handlers ─────────────────────────
  const handleEditDepot = (depot: Depot) => {
    setEditingDepot(depot);
    setEditDepotCode(depot.code);
    setEditDepotName(depot.name);
    setEditDepotAddress(depot.address || "");
    setEditDepotPhone(depot.phone || "");
  };

  const handleSaveEditDepot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDepot) return;
    try {
      const res = await fetch("/api/admin/depots", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingDepot.id,
          code: editDepotCode,
          name: editDepotName,
          address: editDepotAddress,
          phone: editDepotPhone,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to update depot"); }
      setMessage({ type: "success", text: "Depot updated successfully!" });
      setEditingDepot(null);
      fetchInitialData();
    } catch (err: any) { setMessage({ type: "error", text: err.message }); }
  };

  const handleDeleteDepot = async (depotId: string) => {
    if (currentUser?.role !== "SUPER_ADMIN") { alert("Only Super Admin can delete depots."); return; }
    if (!confirm("Are you sure you want to delete this depot? All associated data may be affected.")) return;
    try {
      const res = await fetch(`/api/admin/depots?id=${depotId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete depot");
      setMessage({ type: "success", text: "Depot deleted successfully!" });
      fetchInitialData();
    } catch (err: any) { setMessage({ type: "error", text: err.message }); }
  };

  // ─── Product Edit/Delete Handlers ──────────────────────
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setEditProdCode(product.code);
    setEditProdName(product.name);
    setEditProdCategory(product.category);
    setEditProdBagSize(String(product.bag_size_kg));
    setEditProdOpeningStock(String(product.opening_stock));
    setEditProdSortOrder(String(0));
  };

  const handleSaveEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      const res = await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingProduct.id,
          code: editProdCode,
          name: editProdName,
          category: editProdCategory,
          bag_size_kg: Number(editProdBagSize),
          opening_stock: Number(editProdOpeningStock),
          sort_order: Number(editProdSortOrder),
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to update product"); }
      setMessage({ type: "success", text: "Product updated successfully!" });
      setEditingProduct(null);
      fetchInitialData();
    } catch (err: any) { setMessage({ type: "error", text: err.message }); }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (currentUser?.role !== "SUPER_ADMIN") { alert("Only Super Admin can delete products."); return; }
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`/api/admin/products?id=${productId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete product");
      setMessage({ type: "success", text: "Product deleted successfully!" });
      fetchInitialData();
    } catch (err: any) { setMessage({ type: "error", text: err.message }); }
  };

  // ─── Dealer Edit/Delete Handlers ───────────────────────
  const handleEditDealer = (dealer: Dealer) => {
    setEditingDealer(dealer);
    setEditDealerName(dealer.name);
    setEditDealerCode(dealer.code);
    setEditDealerPhone(dealer.phone);
    setEditDealerAddress(dealer.address || "");
    setEditDealerDepotId(dealer.depot_id);
    setEditDealerBalance(String(dealer.current_balance));
  };

  const handleSaveEditDealer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDealer) return;
    try {
      const res = await fetch("/api/dealers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingDealer.id,
          name: editDealerName,
          code: editDealerCode,
          phone: editDealerPhone,
          address: editDealerAddress,
          depot_id: editDealerDepotId,
          current_balance: Number(editDealerBalance),
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to update dealer"); }
      setMessage({ type: "success", text: "Dealer updated successfully!" });
      setEditingDealer(null);
      fetchInitialData();
    } catch (err: any) { setMessage({ type: "error", text: err.message }); }
  };

  const handleDeleteDealer = async (dealerId: string) => {
    if (currentUser?.role !== "SUPER_ADMIN") { alert("Only Super Admin can delete dealers."); return; }
    if (!confirm("Are you sure you want to delete this dealer? All related ledger data may be affected.")) return;
    try {
      const res = await fetch(`/api/dealers?id=${dealerId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete dealer");
      setMessage({ type: "success", text: "Dealer deleted successfully!" });
      fetchInitialData();
    } catch (err: any) { setMessage({ type: "error", text: err.message }); }
  };

  const handleSetupStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupDepotId || !setupProductId || setupQuantity === "") return;
    try {
      const res = await fetch("/api/admin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "STOCK",
          depot_id: setupDepotId,
          product_id: setupProductId,
          quantity: Number(setupQuantity),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to initialize opening stock");
      }

      setMessage({ type: "success", text: "Depot opening stock initialized successfully!" });
      setSetupQuantity("");
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const handleSetupCash = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupDepotId || setupCashAmount === "") return;
    try {
      const res = await fetch("/api/admin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CASH",
          depot_id: setupDepotId,
          amount: Number(setupCashAmount),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to initialize opening cash balance");
      }

      setMessage({ type: "success", text: "Depot opening cash balance setup successfully!" });
      setSetupCashAmount("");
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const depotOptions = depots.map((d) => ({ value: d.id, label: `${d.name} (${d.code})` }));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-100 flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-amber-600" />
            Master Admin Control Panel
          </h1>
          <div className="flex bg-white border border-slate-200 rounded-xl p-1 text-xs font-bold flex-wrap gap-1">
            {["depots", "products", "dealers", "users", "override", "setup"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 rounded-lg transition-all capitalize ${
                  activeTab === tab ? "bg-amber-600 text-slate-900" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {tab === "override" ? "Master Override" : tab === "setup" ? "System Setup" : tab}
              </button>
            ))}
          </div>
        </div>

        {message && (
          <div
            className={`p-4 rounded-xl text-sm font-semibold border ${
              message.type === "success"
                ? "bg-emerald-50/80 text-emerald-300 border-emerald-200"
                : "bg-rose-50/80 text-rose-300 border-rose-800"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Tab 1: Depots */}
        {activeTab === "depots" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <form onSubmit={handleCreateDepot} className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-base font-extrabold text-slate-900 mb-2 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-600" /> Add Depot Location
              </h2>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Depot Code (Unique) *</label>
                <input type="text" value={depotCode} onChange={(e) => setDepotCode(e.target.value)} placeholder="e.g. DEP-PAB" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 uppercase" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Depot Name *</label>
                <input type="text" value={depotName} onChange={(e) => setDepotName(e.target.value)} placeholder="e.g. Pabna Depot" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Address</label>
                <input type="text" value={depotAddress} onChange={(e) => setDepotAddress(e.target.value)} placeholder="Depot location address" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number</label>
                <input type="text" value={depotPhone} onChange={(e) => setDepotPhone(e.target.value)} placeholder="Contact phone number" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900" />
              </div>
              <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold py-2.5 rounded-xl shadow-lg transition-all text-xs">
                Add Depot Location
              </button>
            </form>

            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-base font-extrabold text-slate-900">Registered Depots ({depots.length})</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="p-3">Code</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">Address</th>
                      <th className="p-3">Phone</th>
                      {currentUser?.role === "SUPER_ADMIN" && <th className="p-3 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-medium">
                    {depots.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-100/40">
                        <td className="p-3 font-mono font-bold text-amber-600 uppercase">{d.code}</td>
                        <td className="p-3 text-slate-900 font-bold">{d.name}</td>
                        <td className="p-3 text-slate-600">{d.address || "N/A"}</td>
                        <td className="p-3 text-slate-500 font-mono">{d.phone || "N/A"}</td>
                        {currentUser?.role === "SUPER_ADMIN" && (
                          <td className="p-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => handleEditDepot(d)} className="p-1 text-slate-500 hover:text-emerald-600 rounded hover:bg-slate-50 transition-colors" title="Edit Depot">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteDepot(d.id)} className="p-1 text-slate-500 hover:text-rose-600 rounded hover:bg-slate-50 transition-colors" title="Delete Depot">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
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
            <form onSubmit={handleCreateProduct} className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-base font-extrabold text-slate-900 mb-2 flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-600" /> Add Product Item
              </h2>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Product Code *</label>
                <input type="text" value={prodCode} onChange={(e) => setProdCode(e.target.value)} placeholder="e.g. 510" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Product Name *</label>
                <input type="text" value={prodName} onChange={(e) => setProdName(e.target.value)} placeholder="e.g. Broiler Starter (C) 510" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Category *</label>
                <select value={prodCategory} onChange={(e) => setProdCategory(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-bold">
                  <option value="Broiler">Broiler</option>
                  <option value="Layer">Layer</option>
                  <option value="Sonali">Sonali</option>
                  <option value="Cattle">Cattle</option>
                  <option value="Nursery">Nursery</option>
                  <option value="Floating Oil Coated">Floating Oil Coated</option>
                  <option value="Floating Non Oil Coated">Floating Non Oil Coated</option>
                  <option value="Sinking">Sinking</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Sort Order (Spreadsheet Sequence #)</label>
                <input type="number" value={prodSortOrder} onChange={(e) => setProdSortOrder(Number(e.target.value))} placeholder="e.g. 1, 2, 3..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-bold" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Bag Size (Kg) *</label>
                <input type="number" step="any" value={prodBagSize} onChange={(e) => setProdBagSize(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-bold" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Opening Stock (Kg) *</label>
                <input type="number" value={prodOpeningStock} onChange={(e) => setProdOpeningStock(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-bold" required />
              </div>
              <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold py-2.5 rounded-xl shadow-lg transition-all text-xs">
                Add Product Item
              </button>
            </form>

            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-base font-extrabold text-slate-900">Product Catalog ({products.length})</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="p-3">Code</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">Category</th>
                      <th className="p-3 text-right">Bag Size</th>
                      <th className="p-3 text-right">Opening Stock</th>
                      {currentUser?.role === "SUPER_ADMIN" && <th className="p-3 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-medium">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-100/40">
                        <td className="p-3 font-mono font-bold text-amber-600">{p.code}</td>
                        <td className="p-3 text-slate-900 font-bold">{p.name}</td>
                        <td className="p-3 text-slate-500 font-bold uppercase text-[10px]">{p.category}</td>
                        <td className="p-3 text-right font-mono text-slate-600">{p.bag_size_kg} kg</td>
                        <td className="p-3 text-right font-mono text-slate-600">{p.opening_stock} kg</td>
                        {currentUser?.role === "SUPER_ADMIN" && (
                          <td className="p-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => handleEditProduct(p)} className="p-1 text-slate-500 hover:text-emerald-600 rounded hover:bg-slate-50 transition-colors" title="Edit Product">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteProduct(p.id)} className="p-1 text-slate-500 hover:text-rose-600 rounded hover:bg-slate-50 transition-colors" title="Delete Product">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
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
            <form onSubmit={handleCreateDealer} className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-base font-extrabold text-slate-900 mb-2 flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-600" /> Register Dealer
              </h2>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Dealer Name *</label>
                <input type="text" value={dealerName} onChange={(e) => setDealerName(e.target.value)} placeholder="e.g. Sarder Poultry" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Dealer Code</label>
                <input type="text" value={dealerCode} onChange={(e) => setDealerCode(e.target.value)} placeholder="Auto-generated if empty" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 uppercase" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number *</label>
                <input type="text" value={dealerPhone} onChange={(e) => setDealerPhone(e.target.value)} placeholder="Dealer contact phone" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Address</label>
                <input type="text" value={dealerAddress} onChange={(e) => setDealerAddress(e.target.value)} placeholder="Dealer location" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Assigned Depot *</label>
                <SearchableSelect options={depotOptions} value={dealerDepotId} onChange={setDealerDepotId} placeholder="Select Depot..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Opening Balance (Dues) *</label>
                <input type="number" step="any" value={dealerBalance} onChange={(e) => setDealerBalance(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-bold" required />
              </div>
              <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold py-2.5 rounded-xl shadow-lg transition-all text-xs">
                Register Dealer
              </button>
            </form>

            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-base font-extrabold text-slate-900">Registered Dealers ({dealers.length})</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="p-3">Name</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Address</th>
                      <th className="p-3">Depot</th>
                      <th className="p-3 text-right">Ledger Balance</th>
                      {currentUser?.role === "SUPER_ADMIN" && <th className="p-3 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-medium">
                    {dealers.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-100/40">
                        <td className="p-3 text-slate-900 font-bold">{d.name}</td>
                        <td className="p-3 text-slate-500 font-mono">{d.phone}</td>
                        <td className="p-3 text-slate-600">{d.address || "N/A"}</td>
                        <td className="p-3 text-emerald-600">{d.depot?.name || "Unassigned"}</td>
                        <td className="p-3 text-right font-mono font-bold text-rose-600">{d.current_balance.toLocaleString()} Tk</td>
                        {currentUser?.role === "SUPER_ADMIN" && (
                          <td className="p-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => handleEditDealer(d)} className="p-1 text-slate-500 hover:text-emerald-600 rounded hover:bg-slate-50 transition-colors" title="Edit Dealer">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteDealer(d.id)} className="p-1 text-slate-500 hover:text-rose-600 rounded hover:bg-slate-50 transition-colors" title="Delete Dealer">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
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
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-600" /> {editingUserId ? "Edit User Account" : "Register User Account"}
              </h2>
              
              {!editingUserId ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">User Name *</label>
                    <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="User's Full Name" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address *</label>
                    <input type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="user@company.com" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Password *</label>
                    <input type="password" value={userPassword} onChange={(e) => setUserPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900" required />
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <p className="font-bold text-slate-600">Modifying Role & Permissions for User:</p>
                    <p className="text-emerald-600 font-black mt-1">{users.find(u => u.id === editingUserId)?.name}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Change Password (Leave blank to keep current)
                    </label>
                    <input
                      type="password"
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      placeholder="New Password (optional)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">User Role *</label>
                <select value={userRole} onChange={(e) => setUserRole(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-bold">
                  <option value="OPERATOR">Operator (Level 4 - Local Depot Entry)</option>
                  <option value="DEPOT_ADMIN">Depot Admin (Level 3 - Local Depot Admin)</option>
                  <option value="ORG_ADMIN">Organization Admin (Level 2 - Global Visibility)</option>
                  <option value="SUPER_ADMIN">Super Admin (Level 1 - Master Override / God Mode)</option>
                </select>
              </div>

              {userRole !== "SUPER_ADMIN" && userRole !== "ORG_ADMIN" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Assign Depot *</label>
                  <SearchableSelect options={depotOptions} value={userDepotId} onChange={setUserDepotId} placeholder="Assign Depot..." />
                </div>
              )}

              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="block text-xs font-bold text-amber-600">Granular Permissions</label>
                {Object.keys(userPermissions).map((perm) => (
                  <label key={perm} className="flex items-center space-x-2 text-xs text-slate-600 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(userPermissions as any)[perm]}
                      onChange={(e) => setUserPermissions({ ...userPermissions, [perm]: e.target.checked })}
                      className="rounded border-slate-200 text-emerald-600 focus:ring-emerald-500 bg-slate-50"
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
                  <button onClick={() => setEditingUserId(null)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 px-4 rounded-xl transition-all text-xs">
                    Cancel
                  </button>
                </div>
              ) : (
                <button onClick={handleCreateUser} className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold py-2.5 rounded-xl shadow-lg transition-all text-xs">
                  Create User Account
                </button>
              )}
            </div>

            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-base font-extrabold text-slate-900 font-black">User Directory ({users.length})</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="p-3">User</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Depot Access</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-medium">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-100/40">
                        <td className="p-3">
                          <p className="text-slate-900 font-bold">{u.name}</p>
                          <p className="text-slate-500 font-mono text-[10px]">{u.email}</p>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            u.role === "SUPER_ADMIN" ? "bg-rose-50/80 text-rose-300 border-rose-800" :
                            u.role === "DEPOT_ADMIN" ? "bg-emerald-50/80 text-emerald-300 border-emerald-200" :
                            "bg-slate-100 text-slate-500 border-slate-300"
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600">{u.depot?.name || "Global Master"}</td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleEditUserPermissions(u)} className="p-1 text-slate-500 hover:text-emerald-600 rounded hover:bg-slate-50 transition-colors">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteUser(u.id)} className="p-1 text-slate-500 hover:text-rose-600 rounded hover:bg-slate-50 transition-colors">
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
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-base font-extrabold text-emerald-600 flex items-center gap-2">
                <Package className="w-5 h-5" /> Master Delivery Orders (Direct Override)
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="p-3">Order No</th>
                      <th className="p-3">Delivery Date</th>
                      <th className="p-3">Dealer</th>
                      <th className="p-3">Depot</th>
                      <th className="p-3 text-right">Total Items</th>
                      <th className="p-3">Delivery Status</th>
                      <th className="p-3">Created By</th>
                      <th className="p-3">Created At</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-medium">
                    {deliveryOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-100/40">
                        <td className="p-3 font-mono font-bold text-emerald-600">{order.order_no}</td>
                        <td className="p-3 text-slate-500">{new Date(order.order_date).toLocaleDateString()}</td>
                        <td className="p-3 text-slate-900">{order.dealer?.name}</td>
                        <td className="p-3 text-slate-600">{order.depot?.name}</td>
                        <td className="p-3 text-right font-mono text-slate-600">{order.items.length}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            order.status === "Complete"
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                              : order.status === "Partial"
                                ? "bg-amber-50 text-amber-600 border border-amber-800"
                                : "bg-slate-100 text-slate-600 border border-slate-300"
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600">{order.created_by || "System"}</td>
                        <td className="p-3 text-slate-500">{new Date(order.createdAt).toLocaleString()}</td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setViewOrder(order)}
                              className="text-slate-500 hover:text-slate-900 transition-colors"
                              title="View Delivery Order"
                            >
                              View
                            </button>
                            {currentUser?.role === "SUPER_ADMIN" && (
                              <>
                                <button
                                  onClick={() => handleEditDeliveryOrder(order)}
                                  className="text-slate-500 hover:text-emerald-600 transition-colors"
                                  title="Edit Delivery Order"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteDeliveryOrder(order)}
                                  className="text-slate-500 hover:text-rose-600 transition-colors"
                                  title="Delete Delivery Order"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {deliveryOrders.length === 0 && (
                      <tr>
                        <td colSpan={9} className="p-6 text-center text-slate-500">No delivery orders found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-base font-extrabold text-red-400 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" /> Master Sales Dispatches List (Direct Override)
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
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
                      <tr key={log.id} className="hover:bg-slate-100/40">
                        <td className="p-3 font-mono font-bold text-slate-900">{log.invoice_no}</td>
                        <td className="p-3 text-slate-500">{new Date(log.date).toLocaleDateString()}</td>
                        <td className="p-3 text-slate-600">{log.depot?.name}</td>
                        <td className="p-3 text-slate-100">{log.product?.name}</td>
                        <td className="p-3 text-right font-mono">{log.quantity.toLocaleString()} kg</td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingSale(log);
                                setEditSaleQty(String(log.quantity));
                                setEditSalePrice(String(log.unit_price || 0));
                              }}
                              className="p-1 text-slate-500 hover:text-emerald-600 rounded hover:bg-slate-50 transition-colors"
                              title="Edit & Override Sales Dispatch"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSalesRecord(log.id)}
                              className="p-1 text-slate-500 hover:text-rose-600 rounded hover:bg-slate-50 transition-colors"
                              title="Reverse & Delete Sales Dispatch"
                            >
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

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-base font-extrabold text-blue-400 flex items-center gap-2">
                <Building2 className="w-5 h-5" /> Master Stock Receives List (Direct Override)
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
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
                      <tr key={log.id} className="hover:bg-slate-100/40">
                        <td className="p-3 font-mono font-bold text-slate-900">{log.invoice_no}</td>
                        <td className="p-3 text-slate-500">{new Date(log.date).toLocaleDateString()}</td>
                        <td className="p-3 text-slate-600">{log.depot?.name}</td>
                        <td className="p-3 text-slate-100">{log.product?.name}</td>
                        <td className="p-3 text-right font-mono">+{log.quantity.toLocaleString()} kg</td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingReceive(log);
                                setEditReceiveQty(String(log.quantity));
                                setEditReceiveChallan(log.supplier_challan_no || "");
                              }}
                              className="p-1 text-slate-500 hover:text-emerald-600 rounded hover:bg-slate-50 transition-colors"
                              title="Edit & Override Stock Receive"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteReceiveRecord(log.id)}
                              className="p-1 text-slate-500 hover:text-rose-600 rounded hover:bg-slate-50 transition-colors"
                              title="Reverse & Delete Stock Receive"
                            >
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

            {/* Table 3: Master Opening Stock & Inventory Lots */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-base font-extrabold text-amber-600 flex items-center gap-2">
                <Package className="w-5 h-5" /> Master Opening Stock & Inventory Lots (Direct Override)
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="p-3">Lot No</th>
                      <th className="p-3">Depot</th>
                      <th className="p-3">Product</th>
                      <th className="p-3 text-right">Initial Qty (Kg)</th>
                      <th className="p-3 text-right">Available Qty (Kg)</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-medium">
                    {lots.map((lot) => (
                      <tr key={lot.id} className="hover:bg-slate-100/40">
                        <td className="p-3 font-mono font-bold text-amber-600">{lot.lot_no}</td>
                        <td className="p-3 text-slate-600">{lot.depot?.name || "Depot"}</td>
                        <td className="p-3 text-slate-100">[{lot.product?.code}] {lot.product?.name}</td>
                        <td className="p-3 text-right font-mono text-slate-600">{lot.initial_qty.toLocaleString()} kg</td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-600">{lot.available_qty.toLocaleString()} kg</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${lot.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-800'}`}>
                            {lot.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingLot(lot);
                                setEditLotInitQty(String(lot.initial_qty));
                                setEditLotAvailQty(String(lot.available_qty));
                              }}
                              className="p-1 text-slate-500 hover:text-emerald-600 rounded hover:bg-slate-50 transition-colors"
                              title="Edit & Override Opening Stock / Lot Qty"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteLot(lot.id)}
                              className="p-1 text-slate-500 hover:text-rose-600 rounded hover:bg-slate-50 transition-colors"
                              title="Delete Opening Stock / Lot Entry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {lots.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-500">
                          No opening stock or lot entries found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Modal: View Delivery Order */}
        {viewOrder && (
          <div className="fixed inset-0 bg-slate-50/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-600" /> Delivery Order: {viewOrder.order_no}
                </h3>
                <button onClick={() => setViewOrder(null)} className="text-slate-500 hover:text-slate-900" aria-label="Close delivery order details">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div><span className="text-slate-500">Delivery Date</span><p className="text-slate-900 font-semibold mt-1">{new Date(viewOrder.order_date).toLocaleDateString()}</p></div>
                <div><span className="text-slate-500">Delivery Status</span><p className="text-slate-900 font-semibold mt-1">{viewOrder.status}</p></div>
                <div><span className="text-slate-500">Dealer</span><p className="text-slate-900 font-semibold mt-1">{viewOrder.dealer?.name} <span className="text-slate-500 font-normal">{viewOrder.dealer?.phone}</span></p></div>
                <div><span className="text-slate-500">Depot</span><p className="text-slate-900 font-semibold mt-1">{viewOrder.depot?.name} <span className="text-slate-500 font-normal">({viewOrder.depot?.code})</span></p></div>
                <div><span className="text-slate-500">Created By</span><p className="text-slate-900 font-semibold mt-1">{viewOrder.created_by || "System"}</p></div>
                <div><span className="text-slate-500">Created At</span><p className="text-slate-900 font-semibold mt-1">{new Date(viewOrder.createdAt).toLocaleString()}</p></div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-600 mb-2">Order Items</h4>
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-800">
                  {viewOrder.items.map((item) => (
                    <div key={item.id} className="px-3 py-2 flex items-center justify-between gap-3 text-xs">
                      <span className="text-slate-900">[{item.product.code}] {item.product.name}</span>
                      <span className="font-mono text-slate-500 whitespace-nowrap">Ordered: {item.ordered_qty} kg · Delivered: {item.delivered_qty} kg · Pending: {item.pending_qty} kg</span>
                    </div>
                  ))}
                </div>
              </div>
              {viewOrder.remarks && <div><span className="text-xs text-slate-500">Remarks</span><p className="text-xs text-slate-600 mt-1">{viewOrder.remarks}</p></div>}
              <div className="flex justify-end pt-2">
                <button type="button" onClick={() => setViewOrder(null)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 px-4 rounded-xl transition-all text-xs">Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Edit Delivery Order */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-slate-50/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Edit className="w-4 h-4 text-emerald-600" /> Override Delivery Order: {selectedOrder.order_no}
                </h3>
                <button onClick={() => setSelectedOrder(null)} className="text-slate-500 hover:text-slate-900" aria-label="Close delivery order editor">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSaveDeliveryOrder} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Order No</label>
                  <input type="text" value={selectedOrder.order_no} disabled className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-500 font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Dealer *</label>
                  <SearchableSelect
                    options={dealers.filter((dealer) => dealer.depot_id === selectedOrder.depot.id).map((dealer) => ({ value: dealer.id, label: `${dealer.name} (${dealer.phone})` }))}
                    value={editOrderDealerId}
                    onChange={setEditOrderDealerId}
                    placeholder="Select Dealer..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Delivery Date *</label>
                  <input type="date" value={editOrderDate} onChange={(e) => setEditOrderDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Remarks</label>
                  <textarea value={editOrderRemarks} onChange={(e) => setEditOrderRemarks(e.target.value)} rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 resize-none" />
                </div>
                
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <label className="block text-xs font-semibold text-slate-600">Order Items (Override)</label>
                  {editOrderItems.map((item, idx) => {
                    const bagSize = products.find(p => p.id === item.product_id)?.bag_size_kg || 50;
                    return (
                      <div key={idx} className="flex gap-2 items-end">
                        <div className="flex-1">
                          <label className="block text-[10px] text-slate-500 mb-1">Product</label>
                          <SearchableSelect
                            options={products.map((p) => ({ value: p.id, label: `[${p.code}] ${p.name}` }))}
                            value={item.product_id}
                            onChange={(val) => {
                              const updated = [...editOrderItems];
                              updated[idx].product_id = val;
                              setEditOrderItems(updated);
                            }}
                            placeholder="Select product..."
                          />
                        </div>
                        <div className="w-48">
                          <label className="block text-[10px] text-slate-500 mb-1">Ordered Qty</label>
                          <DualQuantityInput
                            kgValue={item.ordered_qty}
                            onKgChange={(val) => {
                              const updated = [...editOrderItems];
                              updated[idx].ordered_qty = val;
                              setEditOrderItems(updated);
                            }}
                            bagSizeKg={bagSize}
                          />
                        </div>
                        {editOrderItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...editOrderItems];
                              updated.splice(idx, 1);
                              setEditOrderItems(updated);
                            }}
                            className="mb-1 p-2 bg-rose-50/50 text-rose-600 hover:text-slate-900 rounded border border-rose-200/50"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setEditOrderItems([...editOrderItems, { product_id: "", ordered_qty: "" }])}
                    className="text-xs text-emerald-600 hover:underline font-semibold"
                  >
                    + Add Item
                  </button>
                </div>

                <p className="text-[10px] text-amber-600">Warning: Changing quantities manually bypasses some standard validations. Pending quantity will automatically adjust based on existing deliveries.</p>
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl transition-all text-xs">Save Override</button>
                  <button type="button" onClick={() => setSelectedOrder(null)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 px-4 rounded-xl transition-all text-xs">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Sales Dispatch */}
        {editingSale && (
          <div className="fixed inset-0 bg-slate-50/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Edit className="w-4 h-4 text-emerald-600" /> Override Sale: {editingSale.invoice_no}
                </h3>
                <button onClick={() => setEditingSale(null)} className="text-slate-500 hover:text-slate-900">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEditSale} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Product</label>
                  <input type="text" value={editingSale.product?.name || ""} disabled className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-500" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Quantity (Kg) *</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={editSaleQty}
                    onChange={(e) => setEditSaleQty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-bold"
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Changing quantity will automatically adjust lot stock and order pending qty.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Unit Price (৳/Kg)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editSalePrice}
                    onChange={(e) => setEditSalePrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-bold"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl transition-all text-xs">
                    Save Override
                  </button>
                  <button type="button" onClick={() => setEditingSale(null)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 px-4 rounded-xl transition-all text-xs">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Stock Receive */}
        {editingReceive && (
          <div className="fixed inset-0 bg-slate-50/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Edit className="w-4 h-4 text-blue-400" /> Override Stock Receive: {editingReceive.invoice_no}
                </h3>
                <button onClick={() => setEditingReceive(null)} className="text-slate-500 hover:text-slate-900">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEditReceive} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Product</label>
                  <input type="text" value={editingReceive.product?.name || ""} disabled className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-500" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Received Quantity (Kg) *</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={editReceiveQty}
                    onChange={(e) => setEditReceiveQty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-bold"
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Changing received quantity will automatically adjust lot initial and available stock.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Supplier Challan No</label>
                  <input
                    type="text"
                    value={editReceiveChallan}
                    onChange={(e) => setEditReceiveChallan(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-slate-900 font-bold py-2.5 rounded-xl transition-all text-xs">
                    Save Override
                  </button>
                  <button type="button" onClick={() => setEditingReceive(null)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 px-4 rounded-xl transition-all text-xs">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Opening Stock / Lot */}
        {editingLot && (
          <div className="fixed inset-0 bg-slate-50/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Edit className="w-4 h-4 text-amber-600" /> Override Lot / Opening Stock: {editingLot.lot_no}
                </h3>
                <button onClick={() => setEditingLot(null)} className="text-slate-500 hover:text-slate-900">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEditLot} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Product</label>
                  <input type="text" value={`[${editingLot.product?.code || ""}] ${editingLot.product?.name || ""}`} disabled className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-500" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Initial Quantity (Kg) *</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editLotInitQty}
                    onChange={(e) => setEditLotInitQty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Available Quantity (Kg) *</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editLotAvailQty}
                    onChange={(e) => setEditLotAvailQty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-bold"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold py-2.5 rounded-xl transition-all text-xs">
                    Save Override
                  </button>
                  <button type="button" onClick={() => setEditingLot(null)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 px-4 rounded-xl transition-all text-xs">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Depot */}
        {editingDepot && (
          <div className="fixed inset-0 bg-slate-50/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Edit className="w-4 h-4 text-amber-600" /> Edit Depot: {editingDepot.name}
                </h3>
                <button onClick={() => setEditingDepot(null)} className="text-slate-500 hover:text-slate-900">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSaveEditDepot} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Depot Code *</label>
                  <input type="text" value={editDepotCode} onChange={(e) => setEditDepotCode(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 uppercase font-bold" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Depot Name *</label>
                  <input type="text" value={editDepotName} onChange={(e) => setEditDepotName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-bold" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Address</label>
                  <input type="text" value={editDepotAddress} onChange={(e) => setEditDepotAddress(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
                  <input type="text" value={editDepotPhone} onChange={(e) => setEditDepotPhone(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900" />
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl transition-all text-xs">Save Depot</button>
                  <button type="button" onClick={() => setEditingDepot(null)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 px-4 rounded-xl transition-all text-xs">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Product */}
        {editingProduct && (
          <div className="fixed inset-0 bg-slate-50/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Edit className="w-4 h-4 text-amber-600" /> Edit Product: [{editingProduct.code}] {editingProduct.name}
                </h3>
                <button onClick={() => setEditingProduct(null)} className="text-slate-500 hover:text-slate-900">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSaveEditProduct} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Product Code *</label>
                  <input type="text" value={editProdCode} onChange={(e) => setEditProdCode(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-bold" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Product Name *</label>
                  <input type="text" value={editProdName} onChange={(e) => setEditProdName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-bold" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
                  <select value={editProdCategory} onChange={(e) => setEditProdCategory(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-bold">
                    <option value="Broiler">Broiler</option>
                    <option value="Layer">Layer</option>
                    <option value="Sonali">Sonali</option>
                    <option value="Cattle">Cattle</option>
                    <option value="Nursery">Nursery</option>
                    <option value="Floating Oil Coated">Floating Oil Coated</option>
                    <option value="Floating Non Oil Coated">Floating Non Oil Coated</option>
                    <option value="Sinking">Sinking</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Bag Size (Kg)</label>
                  <input type="number" step="any" value={editProdBagSize} onChange={(e) => setEditProdBagSize(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-bold" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Opening Stock (Kg)</label>
                  <input type="number" step="any" value={editProdOpeningStock} onChange={(e) => setEditProdOpeningStock(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Sort Order</label>
                  <input type="number" value={editProdSortOrder} onChange={(e) => setEditProdSortOrder(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-bold" />
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl transition-all text-xs">Save Product</button>
                  <button type="button" onClick={() => setEditingProduct(null)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 px-4 rounded-xl transition-all text-xs">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Dealer */}
        {editingDealer && (
          <div className="fixed inset-0 bg-slate-50/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Edit className="w-4 h-4 text-amber-600" /> Edit Dealer: {editingDealer.name}
                </h3>
                <button onClick={() => setEditingDealer(null)} className="text-slate-500 hover:text-slate-900">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSaveEditDealer} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Dealer Name *</label>
                  <input type="text" value={editDealerName} onChange={(e) => setEditDealerName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-bold" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Dealer Code *</label>
                  <input type="text" value={editDealerCode} onChange={(e) => setEditDealerCode(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-bold uppercase" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Phone *</label>
                  <input type="text" value={editDealerPhone} onChange={(e) => setEditDealerPhone(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-bold" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Address</label>
                  <input type="text" value={editDealerAddress} onChange={(e) => setEditDealerAddress(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Assigned Depot</label>
                  <SearchableSelect options={depotOptions} value={editDealerDepotId} onChange={setEditDealerDepotId} placeholder="Select Depot..." />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Current Balance (৳)</label>
                  <input type="number" step="any" value={editDealerBalance} onChange={(e) => setEditDealerBalance(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-bold" />
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl transition-all text-xs">Save Dealer</button>
                  <button type="button" onClick={() => setEditingDealer(null)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 px-4 rounded-xl transition-all text-xs">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tab 6: System Setup */}
        {activeTab === "setup" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form 1: Opening Stock Setup */}
            <form onSubmit={handleSetupStock} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-base font-extrabold text-slate-900 mb-2 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-600" /> Initialize Depot Opening Stock
              </h2>
              <p className="text-xs text-slate-500">
                Setup the starting stock level for a product in a specific depot. This will create an opening stock entry that acts as the baseline inventory.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Select Depot *</label>
                <SearchableSelect
                  options={depotOptions}
                  value={setupDepotId}
                  onChange={setSetupDepotId}
                  placeholder="Choose Depot..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Select Product *</label>
                <SearchableSelect
                  options={products.map((p) => ({ value: p.id, label: `[${p.code}] ${p.name}` }))}
                  value={setupProductId}
                  onChange={setSetupProductId}
                  placeholder="Choose Product..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Opening Quantity (in Kg) *</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={setupQuantity}
                  onChange={(e) => setSetupQuantity(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="e.g. 5000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-bold"
                  required
                />
                {setupQuantity !== "" && setupProductId && (
                  <p className="text-[10px] text-emerald-600 mt-1 font-semibold">
                    Equivalent to approximately {(Number(setupQuantity) / (products.find(p => p.id === setupProductId)?.bag_size_kg || 50.0)).toFixed(2)} Bags (based on {(products.find(p => p.id === setupProductId)?.bag_size_kg || 50.0)}kg bag size)
                  </p>
                )}
              </div>
              <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold py-3 rounded-xl shadow-lg transition-all text-xs font-black">
                Initialize Opening Stock
              </button>
            </form>

            {/* Form 2: Opening Cash Balance Setup */}
            <form onSubmit={handleSetupCash} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-base font-extrabold text-slate-900 mb-2 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-600" /> Initialize Opening Cash Balance
              </h2>
              <p className="text-xs text-slate-500">
                Setup the starting cash balance for the depot's Petty Cash Book. This creates a transaction with category 'Opening Balance' and type 'INCOME'.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Select Depot *</label>
                <SearchableSelect
                  options={depotOptions}
                  value={setupDepotId}
                  onChange={setSetupDepotId}
                  placeholder="Choose Depot..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Opening Cash Balance (৳) *</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={setupCashAmount}
                  onChange={(e) => setSetupCashAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-bold"
                  required
                />
              </div>
              <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold py-3 rounded-xl shadow-lg transition-all text-xs font-black">
                Initialize Opening Cash Balance
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
