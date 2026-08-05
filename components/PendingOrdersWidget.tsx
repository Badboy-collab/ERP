"use client";

import { useEffect, useState } from "react";
import { Clock, CheckCircle2, ChevronRight, AlertCircle, ShoppingBag } from "lucide-react";

interface Product {
  id: string;
  name: string;
  code: string;
}

interface OrderItem {
  id: string;
  product_id: string;
  ordered_qty: number;
  delivered_qty: number;
  pending_qty: number;
  product: Product;
}

interface Dealer {
  id: string;
  name: string;
}

interface DeliveryOrder {
  id: string;
  order_no: string;
  order_date: string;
  status: string;
  dealer: Dealer;
  items: OrderItem[];
}

interface PendingOrdersWidgetProps {
  selectedDealerId: string;
  onSelectOrderItem?: (orderId: string, orderNo: string, productId: string, pendingQty: number) => void;
  refreshTrigger?: number;
}

export default function PendingOrdersWidget({
  selectedDealerId,
  onSelectOrderItem,
  refreshTrigger = 0,
}: PendingOrdersWidgetProps) {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchPendingOrders();
  }, [selectedDealerId, refreshTrigger]);

  const fetchPendingOrders = async () => {
    setLoading(true);
    try {
      const url = selectedDealerId
        ? `/api/orders?dealer_id=${selectedDealerId}&status=Pending`
        : `/api/orders?status=Pending`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error("Failed to fetch pending orders", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-full">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Pending Orders Widget</h3>
            <p className="text-xs text-slate-400">
              {selectedDealerId ? "Orders for selected dealer" : "All active pending depot orders"}
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-950 text-amber-400 border border-amber-800">
          {orders.length} Pending DO
        </span>
      </div>

      <div className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1">
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm animate-pulse">
            Loading pending delivery orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm flex flex-col items-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500/40 mb-2" />
            No pending orders found for this selection.
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 hover:border-emerald-500/50 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-mono text-sm font-bold text-emerald-400">
                    {order.order_no}
                  </span>
                  <span className="text-xs text-slate-400 block">
                    Dealer: {order.dealer?.name}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {new Date(order.order_date).toLocaleDateString()}
                </span>
              </div>

              <div className="space-y-2 mt-3">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() =>
                      onSelectOrderItem &&
                      onSelectOrderItem(order.id, order.order_no, item.product_id, item.pending_qty)
                    }
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/80 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-700/50 cursor-pointer transition-all"
                  >
                    <div className="flex items-center space-x-2">
                      <ShoppingBag className="w-4 h-4 text-emerald-400" />
                      <div>
                        <p className="text-xs font-semibold text-slate-200">{item.product.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{item.product.code}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-amber-400">
                        {item.pending_qty} bags pending
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {item.delivered_qty} / {item.ordered_qty} delivered
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
