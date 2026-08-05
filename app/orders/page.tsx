"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { PlusCircle, ClipboardList, ArrowDownCircle, CheckCircle, Building2 } from "lucide-react";

interface Depot {
  id: string;
  name: string;
  code: string;
}

interface Dealer {
  id: string;
  name: string;
}

interface Product {
  id: string;
  code: string;
  name: string;
  bag_size_kg: number;
}

interface DeliveryOrder {
  id: string;
  order_no: string;
  order_date: string;
  status: string;
  depot: { name: string };
  dealer: { name: string };
  items: {
    id: string;
    product: { name: string; code: string };
    ordered_qty: number;
    delivered_qty: number;
    pending_qty: number;
  }[];
}

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<"orders" | "receives">("orders");

  const [depots, setDepots] = useState<Depot[]>([]);
  const [selectedDepotId, setSelectedDepotId] = useState<string>("");

  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [ordersList, setOrdersList] = useState<DeliveryOrder[]>([]);

  // Delivery Order Form State
  const [orderNo, setOrderNo] = useState<string>(`DO-${Date.now().toString().slice(-6)}`);
  const [dealerId, setDealerId] = useState<string>("");
  const [orderItems, setOrderItems] = useState<{ product_id: string; ordered_qty: number }[]>([
    { product_id: "", ordered_qty: 10 },
  ]);

  // Stock Receive Form State
  const [receiveInvoiceNo, setReceiveInvoiceNo] = useState<string>(`RCV-${Date.now().toString().slice(-6)}`);
  const [rcvProductId, setRcvProductId] = useState<string>("");
  const [rcvLotNo, setRcvLotNo] = useState<string>(`LOT-${new Date().getFullYear()}-001`);
  const [rcvMfgDate, setRcvMfgDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [rcvExpDate, setRcvExpDate] = useState<string>(
    new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [rcvQuantity, setRcvQuantity] = useState<number | "">(100);

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [depRes, dRes, pRes, oRes] = await Promise.all([
        fetch("/api/admin/depots"),
        fetch("/api/dealers"),
        fetch("/api/products"),
        fetch("/api/orders"),
      ]);
      if (depRes.ok) {
        const depotList: Depot[] = await depRes.json();
        setDepots(depotList);
        if (depotList.length > 0) setSelectedDepotId(depotList[0].id);
      }
      if (dRes.ok) setDealers(await dRes.json());
      if (pRes.ok) setProducts(await pRes.json());
      if (oRes.ok) setOrdersList(await oRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDepotId || !dealerId || orderItems.some((i) => !i.product_id || i.ordered_qty <= 0)) {
      setMessage({ type: "error", text: "Please complete all delivery order items and select a depot." });
      return;
    }

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          depot_id: selectedDepotId,
          dealer_id: dealerId,
          order_no: orderNo,
          items: orderItems,
        }),
      });

      if (!res.ok) throw new Error("Failed to create delivery order");

      setMessage({ type: "success", text: `Delivery Order ${orderNo} created successfully!` });
      setOrderNo(`DO-${Date.now().toString().slice(-6)}`);
      setOrderItems([{ product_id: "", ordered_qty: 10 }]);
      fetchInitialData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const handleCreateReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDepotId || !rcvProductId || !rcvLotNo || !rcvMfgDate || !rcvExpDate || !rcvQuantity) {
      setMessage({ type: "error", text: "Please fill in all stock receiving fields." });
      return;
    }

    try {
      const res = await fetch("/api/receives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          depot_id: selectedDepotId,
          invoice_no: receiveInvoiceNo,
          product_id: rcvProductId,
          lot_no: rcvLotNo,
          mfg_date: rcvMfgDate,
          exp_date: rcvExpDate,
          quantity: Number(rcvQuantity),
        }),
      });

      if (!res.ok) throw new Error("Failed to record stock receive");

      setMessage({
        type: "success",
        text: `Stock Received & New Lot ${rcvLotNo} generated in LotTracker!`,
      });
      setReceiveInvoiceNo(`RCV-${Date.now().toString().slice(-6)}`);
      setRcvQuantity(100);
      fetchInitialData();
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
              <ClipboardList className="w-6 h-6 text-emerald-400" />
              Delivery Orders & Stock Receiving (Multi-Depot)
            </h1>
            <p className="text-sm text-slate-400">
              Manage Dealer Delivery Orders & Record incoming factory stock shipments to auto-create Lot Tracker batches.
            </p>
          </div>

          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "orders"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Delivery Orders
            </button>
            <button
              onClick={() => setActiveTab("receives")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "receives"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Stock Receive
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

        {/* Tab 1: Delivery Orders */}
        {activeTab === "orders" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-base font-extrabold text-white mb-4 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-400" /> Create New Delivery Order
              </h2>

              <form onSubmit={handleCreateOrder} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Depot *</label>
                    <select
                      value={selectedDepotId}
                      onChange={(e) => setSelectedDepotId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-bold"
                      required
                    >
                      {depots.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Order No</label>
                    <input
                      type="text"
                      value={orderNo}
                      onChange={(e) => setOrderNo(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Dealer *</label>
                  <select
                    value={dealerId}
                    onChange={(e) => setDealerId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                    required
                  >
                    <option value="">-- Choose Dealer --</option>
                    {dealers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-semibold text-slate-300">Order Items</label>
                  {orderItems.map((item, idx) => (
                    <div key={idx} className="flex gap-2">
                      <select
                        value={item.product_id}
                        onChange={(e) => {
                          const updated = [...orderItems];
                          updated[idx].product_id = e.target.value;
                          setOrderItems(updated);
                        }}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                        required
                      >
                        <option value="">-- Product --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="1"
                        value={item.ordered_qty}
                        onChange={(e) => {
                          const updated = [...orderItems];
                          updated[idx].ordered_qty = Number(e.target.value);
                          setOrderItems(updated);
                        }}
                        placeholder="Qty"
                        className="w-24 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold"
                        required
                      />
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() =>
                      setOrderItems([...orderItems, { product_id: "", ordered_qty: 10 }])
                    }
                    className="text-xs text-emerald-400 hover:underline font-semibold"
                  >
                    + Add Another Item
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg transition-all"
                >
                  Create Delivery Order
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-base font-extrabold text-white">Delivery Orders List ({ordersList.length})</h2>
              <div className="space-y-4">
                {ordersList.map((ord) => (
                  <div
                    key={ord.id}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-mono text-sm font-bold text-emerald-400">
                          {ord.order_no}
                        </span>
                        <span className="text-[11px] text-slate-400 block font-semibold">
                          Depot: {ord.depot?.name}
                        </span>
                      </div>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                          ord.status === "Complete"
                            ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                            : "bg-amber-950 text-amber-400 border-amber-800"
                        }`}
                      >
                        {ord.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">Dealer: {ord.dealer.name}</p>

                    <div className="divide-y divide-slate-900 text-xs">
                      {ord.items.map((it) => (
                        <div key={it.id} className="py-1.5 flex justify-between">
                          <span>{it.product.name}</span>
                          <span className="font-mono">
                            Delivered: {it.delivered_qty}/{it.ordered_qty} (Pending:{" "}
                            <strong className="text-amber-400">{it.pending_qty}</strong>)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Tab 2: Stock Receive Form */
          <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-base font-extrabold text-white mb-4 flex items-center gap-2">
              <ArrowDownCircle className="w-5 h-5 text-emerald-400" /> Stock Receive Entry
            </h2>

            <form onSubmit={handleCreateReceive} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Depot *</label>
                <select
                  value={selectedDepotId}
                  onChange={(e) => setSelectedDepotId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white font-bold"
                  required
                >
                  {depots.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Receive Invoice No
                  </label>
                  <input
                    type="text"
                    value={receiveInvoiceNo}
                    onChange={(e) => setReceiveInvoiceNo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Product</label>
                  <select
                    value={rcvProductId}
                    onChange={(e) => setRcvProductId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white"
                    required
                  >
                    <option value="">-- Choose Product --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.code}] {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Lot No</label>
                  <input
                    type="text"
                    value={rcvLotNo}
                    onChange={(e) => setRcvLotNo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Mfg Date</label>
                  <input
                    type="date"
                    value={rcvMfgDate}
                    onChange={(e) => setRcvMfgDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Exp Date</label>
                  <input
                    type="date"
                    value={rcvExpDate}
                    onChange={(e) => setRcvExpDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Received Quantity (Bags)
                </label>
                <input
                  type="number"
                  min="1"
                  value={rcvQuantity}
                  onChange={(e) => setRcvQuantity(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white font-bold"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg transition-all"
              >
                Record Stock Receive & Create Lot
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
