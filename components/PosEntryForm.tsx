"use client";

import { useState, useEffect } from "react";
import { Send, Zap, Calendar, User, Package, Layers, Hash, FileText, CheckCircle, Plus, Trash2, Building2, AlertTriangle, DollarSign } from "lucide-react";
import { ChallanInvoice } from "@/components/ChallanModal";
import SearchableSelect from "@/components/SearchableSelect";
import DualQuantityInput from "@/components/DualQuantityInput";

interface Depot {
  id: string;
  name: string;
  code: string;
}

interface Dealer {
  id: string;
  name: string;
  phone: string;
}

interface Product {
  id: string;
  code: string;
  name: string;
  bag_size_kg: number;
}

interface Lot {
  id: string;
  lot_no: string;
  exp_date: string;
  available_qty: number; // in Kg
}

interface DeliveryOrder {
  id: string;
  order_no: string;
}

interface FormRowItem {
  id: string;
  product_id: string;
  lot_id: string;
  quantity: number | ""; // in Kg
  unit_price: number | "";
  availableLots: Lot[];
  fifoLot: Lot | null;
  selectedLotObj: Lot | null;
}

interface PosEntryFormProps {
  onSaleSuccess?: (invoice: ChallanInvoice) => void;
  onDealerChange?: (dealerId: string) => void;
}

export default function PosEntryForm({ onSaleSuccess, onDealerChange }: PosEntryFormProps) {
  const [transactionType, setTransactionType] = useState<"SALES" | "DELIVERY" | "TRANSFER_OUT" | "FACTORY_RETURN">("SALES");

  const [depots, setDepots] = useState<Depot[]>([]);
  const [depotId, setDepotId] = useState<string>("");
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);

  // Form Header State
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [dealerId, setDealerId] = useState<string>("");
  const [orderId, setOrderId] = useState<string>("");
  const [destination, setDestination] = useState<string>("");
  const [invoiceNo, setInvoiceNo] = useState<string>("");

  // Dynamic Product Rows State
  const [items, setItems] = useState<FormRowItem[]>([
    { id: "1", product_id: "", lot_id: "", quantity: "", unit_price: "", availableLots: [], fifoLot: null, selectedLotObj: null },
  ]);

  const [loadingDO, setLoadingDO] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setInvoiceNo(`INV-${Date.now().toString().slice(-6)}`);
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [depRes, pRes] = await Promise.all([
        fetch("/api/admin/depots"),
        fetch("/api/products"),
      ]);
      if (depRes.ok) {
        const depotList: Depot[] = await depRes.json();
        setDepots(depotList);
        if (depotList.length > 0) setDepotId(depotList[0].id);
      }
      if (pRes.ok) setProducts(await pRes.json());
    } catch (err) {
      console.error("Failed to load initial data", err);
    }
  };

  // Cascading Depot -> Dealer
  useEffect(() => {
    if (depotId) {
      setDealerId("");
      fetch(`/api/dealers?depot_id=${depotId}`)
        .then((res) => res.json())
        .then((data) => setDealers(data))
        .catch((err) => console.error(err));
    } else {
      setDealers([]);
      setDealerId("");
    }
  }, [depotId]);

  // Load pending D.Os for selected dealer
  useEffect(() => {
    if (onDealerChange) onDealerChange(dealerId);
    if (dealerId) {
      fetch(`/api/orders?dealer_id=${dealerId}&status=Pending`)
        .then((res) => res.json())
        .then((data) => setOrders(data))
        .catch((err) => console.error(err));
    } else {
      setOrders([]);
    }
  }, [dealerId]);

  const handleSelectDeliveryOrder = async (selectedOrderId: string) => {
    setOrderId(selectedOrderId);
    if (!selectedOrderId) return;

    setLoadingDO(true);
    try {
      const res = await fetch(`/api/orders/${selectedOrderId}`);
      if (!res.ok) throw new Error("Could not fetch delivery order details");

      const doData = await res.json();

      if (doData.dealer_id && !dealerId) setDealerId(doData.dealer_id);
      if (doData.depot_id) setDepotId(doData.depot_id);

      const newRows: FormRowItem[] = await Promise.all(
        doData.items.map(async (item: any, idx: number) => {
          const lotsRes = await fetch(`/api/lots?product_id=${item.product_id}&depot_id=${doData.depot_id}`);
          const availableLots: Lot[] = lotsRes.ok ? await lotsRes.json() : [];
          const fifoLot = item.suggestedLot || availableLots[0] || null;

          return {
            id: String(idx + 1),
            product_id: item.product_id,
            lot_id: fifoLot ? fifoLot.id : "",
            quantity: item.pending_qty, // In Kg now
            unit_price: "",
            availableLots,
            fifoLot,
            selectedLotObj: fifoLot,
          };
        })
      );

      if (newRows.length > 0) {
        setItems(newRows);
        setTransactionType("DELIVERY");
        setMessage({
          type: "success",
          text: `Auto-populated ${newRows.length} item(s) from Delivery Order ${doData.order_no}!`,
        });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoadingDO(false);
    }
  };

  const handleProductChange = async (index: number, selectedProductId: string) => {
    const updated = [...items];
    updated[index].product_id = selectedProductId;
    updated[index].lot_id = "";
    updated[index].fifoLot = null;
    updated[index].selectedLotObj = null;
    updated[index].availableLots = [];

    if (selectedProductId) {
      const [lotsRes, fifoRes] = await Promise.all([
        fetch(`/api/lots?product_id=${selectedProductId}&depot_id=${depotId}`),
        fetch(`/api/lots?product_id=${selectedProductId}&depot_id=${depotId}&fifo=true`),
      ]);
      if (lotsRes.ok) updated[index].availableLots = await lotsRes.json();
      if (fifoRes.ok) {
        const fifoLot = await fifoRes.json();
        if (fifoLot) {
          updated[index].fifoLot = fifoLot;
          updated[index].lot_id = fifoLot.id;
          updated[index].selectedLotObj = fifoLot;
        }
      }
    }
    setItems(updated);
  };

  const handleLotChange = (index: number, selectedLotId: string) => {
    const updated = [...items];
    updated[index].lot_id = selectedLotId;
    const lotObj = updated[index].availableLots.find((l) => l.id === selectedLotId) || null;
    updated[index].selectedLotObj = lotObj;
    setItems(updated);
  };

  const handleAddRow = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), product_id: "", lot_id: "", quantity: "", unit_price: "", availableLots: [], fifoLot: null, selectedLotObj: null },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depotId) {
      setMessage({ type: "error", text: "Please select a depot location." });
      return;
    }

    // STRICT INVENTORY VALIDATION CHECK BEFORE SUBMISSION
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.product_id || !item.lot_id || !item.quantity) {
        setMessage({ type: "error", text: "Please complete all product rows with valid Lot & Quantity." });
        return;
      }
      if (item.selectedLotObj && Number(item.quantity) > item.selectedLotObj.available_qty) {
        const prod = products.find((p) => p.id === item.product_id);
        const bagSize = prod?.bag_size_kg || 50.0;
        const requestedBags = Number(item.quantity) / bagSize;
        const availBags = item.selectedLotObj.available_qty / bagSize;
        setMessage({
          type: "error",
          text: `Error: Insufficient stock. Only ${item.selectedLotObj.available_qty} kg (${Math.round(availBags * 100) / 100} bags) available for Lot ${item.selectedLotObj.lot_no}. You requested ${item.quantity} kg (${Math.round(requestedBags * 100) / 100} bags).`,
        });
        return;
      }
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const payload = {
        depot_id: depotId,
        invoice_no: invoiceNo,
        transaction_type: transactionType,
        dealer_id: dealerId || undefined,
        order_id: orderId || undefined,
        destination: destination || undefined,
        date,
        items: items.map((i) => ({
          product_id: i.product_id,
          lot_id: i.lot_id,
          quantity: Number(i.quantity),
          unit_price: i.unit_price === "" ? 0 : Number(i.unit_price),
        })),
      };

      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process transaction");

      setMessage({ type: "success", text: `Transaction Invoice ${invoiceNo} recorded successfully!` });

      setItems([{ id: Date.now().toString(), product_id: "", lot_id: "", quantity: "", unit_price: "", availableLots: [], fifoLot: null, selectedLotObj: null }]);
      setInvoiceNo(`INV-${Date.now().toString().slice(-6)}`);

      if (onSaleSuccess) {
        onSaleSuccess(data);
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const depotOptions = depots.map((d) => ({
    value: d.id,
    label: `${d.name} (${d.code})`,
  }));

  const dealerOptions = dealers.map((d) => ({
    value: d.id,
    label: `${d.name} (${d.phone})`,
  }));

  const orderOptions = orders.map((o) => ({
    value: o.id,
    label: o.order_no,
  }));

  const productOptions = products.map((p) => ({
    value: p.id,
    label: `[${p.code}] ${p.name}`,
  }));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white">Multi-Product POS Entry</h2>
            <p className="text-xs text-slate-400">Strict Inventory Validation & Real-time Stock Control</p>
          </div>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTransactionType("SALES")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              transactionType === "SALES" ? "bg-emerald-600 text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Direct Sale
          </button>
          <button
            type="button"
            onClick={() => setTransactionType("DELIVERY")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              transactionType === "DELIVERY" ? "bg-emerald-600 text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            DO Delivery
          </button>
          <button
            type="button"
            onClick={() => setTransactionType("TRANSFER_OUT")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              transactionType === "TRANSFER_OUT" ? "bg-amber-600 text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Transfer Out
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl mb-6 text-sm flex items-center space-x-2 font-medium ${
            message.type === "success"
              ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800"
              : "bg-rose-950/80 text-rose-300 border border-rose-800"
          }`}
        >
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Top Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" /> Depot *
            </label>
            <SearchableSelect
              options={depotOptions}
              value={depotId}
              onChange={setDepotId}
              placeholder="Select Depot..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-emerald-400" /> Dealer
            </label>
            <SearchableSelect
              options={dealerOptions}
              value={dealerId}
              onChange={setDealerId}
              placeholder="Select Dealer..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-emerald-400" /> Delivery Order
            </label>
            <SearchableSelect
              options={orderOptions}
              value={orderId}
              onChange={handleSelectDeliveryOrder}
              placeholder="Auto-Fill DO..."
              isDisabled={loadingDO}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Hash className="w-3.5 h-3.5 text-emerald-400" /> Invoice No
            </label>
            <input
              type="text"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white font-mono"
              required
            />
          </div>
        </div>

        {transactionType === "TRANSFER_OUT" && (
          <div>
            <label className="block text-xs font-semibold text-amber-300 mb-1">
              Destination / Branch Depot Name
            </label>
            <input
              type="text"
              placeholder="e.g. Bogura Regional Feed Store"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full bg-slate-950 border border-amber-900/50 rounded-xl px-3.5 py-2 text-sm text-white"
              required
            />
          </div>
        )}

        {/* Dynamic Multi-Product Rows */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
              Product Dispatch Items ({items.length})
            </h3>
            <button
              type="button"
              onClick={handleAddRow}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700"
            >
              <Plus className="w-3.5 h-3.5" /> Add Product Row
            </button>
          </div>

          {items.map((row, idx) => {
            const isOverStock =
              row.selectedLotObj &&
              row.quantity !== "" &&
              Number(row.quantity) > row.selectedLotObj.available_qty;

            const selectedProduct = products.find((p) => p.id === row.product_id);
            const bagSize = selectedProduct?.bag_size_kg || 50.0;

            const lotOptions = row.availableLots.map((l) => {
              const bags = Math.round((l.available_qty / bagSize) * 100) / 100;
              return {
                value: l.id,
                label: `${l.lot_no} (Avail: ${l.available_qty} kg / ${bags} bags | Exp: ${new Date(l.exp_date).toLocaleDateString()})`,
              };
            });

            return (
              <div
                key={row.id}
                className={`grid grid-cols-1 sm:grid-cols-12 gap-3 items-end p-4 rounded-xl border relative transition-all ${
                  isOverStock
                    ? "bg-rose-950/40 border-rose-800"
                    : "bg-slate-950/80 border-slate-800"
                }`}
              >
                <div className="sm:col-span-3">
                  <label className="block text-[11px] text-slate-400 mb-1 font-semibold">Product *</label>
                  <SearchableSelect
                    options={productOptions}
                    value={row.product_id}
                    onChange={(val) => handleProductChange(idx, val)}
                    placeholder="Select product..."
                  />
                </div>

                <div className="sm:col-span-4">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] text-slate-400 font-semibold">Lot (Batch) *</label>
                    {row.fifoLot && (
                      <span className="text-[10px] text-emerald-400 font-bold">⚡ FIFO Suggested</span>
                    )}
                  </div>
                  <SearchableSelect
                    options={lotOptions}
                    value={row.lot_id}
                    onChange={(val) => handleLotChange(idx, val)}
                    placeholder="Select lot..."
                    isDisabled={!row.product_id}
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11px] text-slate-400 mb-1 font-semibold">Quantity *</label>
                  <DualQuantityInput
                    kgValue={row.quantity}
                    onKgChange={(val) => {
                      const updated = [...items];
                      updated[idx].quantity = val;
                      setItems(updated);
                    }}
                    bagSizeKg={bagSize}
                  />
                </div>

                <div className="sm:col-span-1.5 relative">
                  <label className="block text-[11px] text-slate-400 mb-1 font-semibold">Price/Kg *</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0"
                      value={row.unit_price}
                      onChange={(e) => {
                        const updated = [...items];
                        updated[idx].unit_price = e.target.value === "" ? "" : Number(e.target.value);
                        setItems(updated);
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="sm:col-span-0.5 text-right">
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(idx)}
                    disabled={items.length <= 1}
                    className="p-2 text-slate-500 hover:text-rose-400 disabled:opacity-30 rounded-lg hover:bg-slate-900 transition-colors"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>

                {/* Stock Warning Badge */}
                {isOverStock && row.selectedLotObj && (
                  <div className="col-span-12 text-xs text-rose-400 font-bold flex items-center gap-1.5 pt-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Exceeds available Lot stock! Only {row.selectedLotObj.available_qty} kg ({Math.round((row.selectedLotObj.available_qty / bagSize) * 100) / 100} bags) available.
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-slate-950 font-bold py-3.5 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          <span>{submitting ? "Processing Transaction..." : "Execute & Print Delivery Challan"}</span>
        </button>
      </form>
    </div>
  );
}
