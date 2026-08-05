"use client";

import { useState, useEffect } from "react";
import { Truck, CheckCircle2, AlertCircle, ArrowRight, Package } from "lucide-react";

interface StockTransferItem {
  id: string;
  quantity: number;
  status: string;
  transfer_date: string;
  notes?: string | null;
  fromDepot?: {
    name: string;
    code: string;
  } | null;
  product: {
    code: string;
    name: string;
    bag_size_kg: number;
  };
}

interface PendingTransfersWidgetProps {
  depotId?: string;
  onReceiveSuccess?: () => void;
}

export default function PendingTransfersWidget({ depotId, onReceiveSuccess }: PendingTransfersWidgetProps) {
  const [transfers, setTransfers] = useState<StockTransferItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [receivingId, setReceivingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchPendingTransfers();
  }, [depotId]);

  const fetchPendingTransfers = async () => {
    if (!depotId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/transfers?to_depot_id=${depotId}&status=IN_TRANSIT`);
      if (res.ok) {
        setTransfers(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReceiveTransfer = async (transferId: string) => {
    setReceivingId(transferId);
    setMessage(null);
    try {
      const res = await fetch("/api/transfers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transfer_id: transferId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to receive transfer shipment");

      setMessage({ type: "success", text: "Stock received & added to local inventory successfully!" });
      fetchPendingTransfers();
      if (onReceiveSuccess) onReceiveSuccess();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setReceivingId(null);
    }
  };

  if (!depotId || transfers.length === 0) return null;

  return (
    <div className="bg-amber-950/20 border border-amber-800/60 rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-amber-900/40 pb-3">
        <h3 className="text-sm font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-2">
          <Truck className="w-5 h-5 text-amber-400 animate-pulse" />
          Pending Incoming Transfers ({transfers.length})
        </h3>
        <span className="text-[10px] bg-amber-900/60 text-amber-200 border border-amber-700 px-2 py-0.5 rounded-full font-bold">
          IN TRANSIT
        </span>
      </div>

      {message && (
        <div className={`p-3 rounded-xl text-xs font-semibold ${message.type === "success" ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800" : "bg-rose-950/80 text-rose-300 border border-rose-800"}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {transfers.map((t) => {
          const bags = Math.round((t.quantity / (t.product.bag_size_kg || 50)) * 100) / 100;
          return (
            <div key={t.id} className="bg-slate-900/90 border border-amber-900/30 rounded-xl p-4 space-y-3 shadow-lg hover:border-amber-700 transition-all">
              <div className="flex justify-between items-start text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Dispatched From</span>
                  <span className="font-black text-amber-300">{t.fromDepot?.name || "Central Depot / Factory"}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-mono block">Date</span>
                  <span className="text-slate-300 font-medium">{new Date(t.transfer_date).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-xs flex justify-between items-center">
                <div className="space-y-0.5">
                  <p className="font-bold text-white">[{t.product.code}] {t.product.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">Bag Size: {t.product.bag_size_kg} kg</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-emerald-400 text-sm font-mono">{t.quantity.toLocaleString()} Kg</p>
                  <p className="text-[10px] text-amber-300 font-bold">{bags} Bags</p>
                </div>
              </div>

              <button
                onClick={() => handleReceiveTransfer(t.id)}
                disabled={receivingId === t.id}
                className="w-full bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 disabled:opacity-50 text-slate-950 font-black py-2 rounded-lg text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                {receivingId === t.id ? (
                  <span>Receiving Stock...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Receive Stock Shipment</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
