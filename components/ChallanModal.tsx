"use client";

import { Printer, X, Factory, CheckCircle2 } from "lucide-react";

export interface ChallanInvoiceItem {
  id: string;
  quantity: number;
  product: {
    code: string;
    name: string;
    bag_size_kg: number;
  };
  lot: {
    lot_no: string;
  };
}

export interface ChallanInvoice {
  id: string;
  invoice_no: string;
  transaction_type: string;
  date: string;
  destination?: string | null;
  notes?: string | null;
  dealer?: {
    name: string;
    phone: string;
    address?: string | null;
  } | null;
  order?: {
    order_no: string;
  } | null;
  items: ChallanInvoiceItem[];
}

interface ChallanModalProps {
  invoice: ChallanInvoice | null;
  onClose: () => void;
}

export default function ChallanModal({ invoice, onClose }: ChallanModalProps) {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalBags = invoice.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalWeightKg = invoice.items.reduce(
    (sum, item) => sum + item.quantity * (item.product.bag_size_kg || 50),
    0
  );
  const totalTons = (totalWeightKg / 1000).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      {/* Modal Box */}
      <div className="bg-white text-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden print:shadow-none print:w-full print:max-w-none print:rounded-none">
        {/* Action Header (Hidden in Print) */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">Delivery Challan & Invoice Preview</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg shadow flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-4 h-4" /> Print Challan
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Content Area */}
        <div className="p-8 print:p-0 space-y-6">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                Matber Agro Industries Ltd
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                High Quality Feed Processing Depot • Head Office & Central Depot
              </p>
              <p className="text-xs text-slate-500">
                Phone: +880 1712-345678, +880 1898-765432 | Mymensingh Road, Depot Zone
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-slate-900 text-white font-extrabold text-xs uppercase tracking-widest rounded mb-1">
                DELIVERY CHALLAN
              </span>
              <p className="font-mono text-sm font-bold text-slate-800">
                NO: {invoice.invoice_no}
              </p>
              <p className="text-xs text-slate-600">
                Date: {new Date(invoice.date).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Details Bar */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200 print:bg-transparent print:border-slate-300">
            <div>
              <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                Customer / Dealer Info
              </p>
              <p className="font-bold text-sm text-slate-900">
                {invoice.dealer?.name || invoice.destination || "Direct Depot Cash Dispatch"}
              </p>
              {invoice.dealer?.phone && (
                <p className="text-slate-700">Phone: {invoice.dealer.phone}</p>
              )}
              {invoice.dealer?.address && (
                <p className="text-slate-700">Address: {invoice.dealer.address}</p>
              )}
            </div>

            <div className="text-right space-y-1">
              <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                Transaction Specs
              </p>
              <p className="font-bold text-xs text-slate-800">
                Type:{" "}
                <span className="uppercase text-emerald-700 font-extrabold">
                  {invoice.transaction_type}
                </span>
              </p>
              {invoice.order?.order_no && (
                <p className="text-slate-700 font-mono">DO Ref: {invoice.order.order_no}</p>
              )}
              {invoice.destination && (
                <p className="text-slate-700 font-medium">Destination: {invoice.destination}</p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div>
            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-100 text-slate-800 font-bold uppercase border-b border-slate-300">
                <tr>
                  <th className="p-2 border-r border-slate-300 w-10 text-center">Sl</th>
                  <th className="p-2 border-r border-slate-300">Code</th>
                  <th className="p-2 border-r border-slate-300">Product Name</th>
                  <th className="p-2 border-r border-slate-300">Lot / Batch No</th>
                  <th className="p-2 border-r border-slate-300 text-right">Bag Size</th>
                  <th className="p-2 text-right">Quantity (Bags)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {invoice.items.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="p-2 border-r border-slate-200 text-center font-bold">
                      {idx + 1}
                    </td>
                    <td className="p-2 border-r border-slate-200 font-mono font-bold">
                      {item.product.code}
                    </td>
                    <td className="p-2 border-r border-slate-200 font-medium">
                      {item.product.name}
                    </td>
                    <td className="p-2 border-r border-slate-200 font-mono text-slate-700">
                      {item.lot.lot_no}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-right">
                      {item.product.bag_size_kg} kg
                    </td>
                    <td className="p-2 text-right font-bold text-slate-900 text-sm">
                      {item.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-900 text-slate-900">
                <tr>
                  <td colSpan={5} className="p-2 text-right uppercase tracking-wider">
                    Total Quantity & Weight:
                  </td>
                  <td className="p-2 text-right text-sm">
                    {totalBags} bags ({totalTons} MT)
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded border border-slate-200">
              Note: {invoice.notes}
            </div>
          )}

          {/* Footer Signatures */}
          <div className="pt-12 grid grid-cols-3 gap-8 text-center text-xs font-semibold text-slate-700">
            <div className="border-t border-slate-400 pt-2">
              <p>Prepared By</p>
              <p className="text-[10px] text-slate-500 font-normal">Depot Operator</p>
            </div>
            <div className="border-t border-slate-400 pt-2">
              <p>Depot In-Charge</p>
              <p className="text-[10px] text-slate-500 font-normal">Authorized Signature</p>
            </div>
            <div className="border-t border-slate-400 pt-2">
              <p>Received By</p>
              <p className="text-[10px] text-slate-500 font-normal">Driver / Dealer Signature</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
