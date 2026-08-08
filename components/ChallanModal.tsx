"use client";

import { Printer, X, CheckCircle2 } from "lucide-react";

export interface ChallanInvoiceItem {
  id: string;
  quantity: number; // In bags
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
  manual_challan_no?: string | null;
  vehicle_no?: string | null;
  driver_name?: string | null;
  driver_phone?: string | null;
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

  // Date formatting DD-MM-YYYY
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const totalBags = invoice.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalWeightKg = invoice.items.reduce(
    (sum, item) => sum + item.quantity * (item.product.bag_size_kg || 50),
    0
  );

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 15mm 10mm;
          }
          body * {
            visibility: hidden;
          }
          #printable-challan, #printable-challan * {
            visibility: visible;
          }
          #printable-challan {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
      <div id="printable-challan" className="fixed inset-0 z-50 bg-slate-50/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      {/* Modal Box */}
      <div className="bg-white text-black w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden print:shadow-none print:w-full print:max-w-none print:rounded-none print:m-0">
        {/* Action Header (Hidden during Print) */}
        <div className="bg-white text-slate-900 p-4 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="font-bold text-sm">Gate Pass & Challan Document Preview</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-500 text-slate-900 text-xs font-bold px-4 py-2 rounded-lg shadow flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-4 h-4" /> Print Challan
            </button>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-900 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE GATE PASS DOCUMENT */}
        <div className="p-8 sm:p-12 print:p-6 space-y-6 font-sans text-black bg-white">
          
          {/* HEADER SECTION: Logo & Company Information */}
          <div className="flex justify-between items-center border-b border-gray-300 pb-4">
            {/* Left: Brand Logo Badge */}
            <div className="flex items-center space-x-3 w-32">
              <img src="/matber-logo.png" alt="Matber Agro" className="w-full h-auto object-contain" />
            </div>

            {/* Middle: Company Details */}
            <div className="text-center flex-1 px-4">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-black uppercase">
                MATBER AGRO INDUSTRIES LTD
              </h1>
              <p className="text-xs font-medium text-gray-800 mt-1">
                House No: 02, Road No: 14, Sector 04, Uttara, Dhaka
              </p>
              <p className="text-xs font-medium text-gray-800">
                Phon No. : 01894844082, 01894844072, Email :
              </p>
            </div>

            {/* Right Side: (Yellow Barcode removed per exclusion rule) */}
            <div className="w-20"></div>
          </div>

          {/* DOCUMENT TITLE */}
          <div className="text-center my-2">
            <h2 className="text-base font-black tracking-wider uppercase underline underline-offset-4">
              GATE PASS
            </h2>
          </div>

          {/* CUSTOMER & DELIVERY INFO GRID */}
          <div className="flex justify-between text-xs text-black font-semibold leading-relaxed mb-4">
            {/* Column 1: Customer Details */}
            <div className="space-y-1.5 w-1/2 pr-4">
              <div className="flex">
                <span className="w-28 font-bold text-black flex justify-between">Customer Name <span>:</span></span>
                <span className="flex-1 font-extrabold text-black pl-2">
                  {invoice.dealer?.name || invoice.destination || "Direct Cash Dispatch"}
                </span>
              </div>
              <div className="flex">
                <span className="w-28 font-bold text-black flex justify-between">Address <span>:</span></span>
                <span className="flex-1 font-medium text-gray-900 pl-2">
                  {invoice.dealer?.address || invoice.destination || "N/A"}
                </span>
              </div>
              <div className="flex">
                <span className="w-28 font-bold text-black flex justify-between">Driver Name <span>:</span></span>
                <span className="flex-1 font-bold text-black pl-2">{invoice.driver_name || "Ismail"}</span>
              </div>
              <div className="flex">
                <span className="w-28 font-bold text-black flex justify-between">Driver Contact <span>:</span></span>
                <span className="flex-1 font-medium text-gray-900 pl-2">{invoice.driver_phone || ""}</span>
              </div>
              <div className="flex">
                <span className="w-28 font-bold text-black flex justify-between">Vehicle No <span>:</span></span>
                <span className="flex-1 font-medium text-gray-900 pl-2">{invoice.vehicle_no || invoice.notes || "Auto van"}</span>
              </div>
            </div>

            {/* Column 2: Challan Details */}
            <div className="space-y-1.5 w-1/2 pl-4">
              <div className="flex">
                <span className="w-24 font-bold text-black flex justify-between">Challan No <span>:</span></span>
                <span className="flex-1 font-mono font-bold text-black pl-2">{invoice.invoice_no}</span>
              </div>
              {invoice.manual_challan_no && (
                <div className="flex">
                  <span className="w-24 font-bold text-black flex justify-between">Manual Chln <span>:</span></span>
                  <span className="flex-1 font-mono font-bold text-black pl-2">{invoice.manual_challan_no}</span>
                </div>
              )}
              <div className="flex">
                <span className="w-24 font-bold text-black flex justify-between">Challan Date <span>:</span></span>
                <span className="flex-1 font-medium text-gray-900 pl-2">{formatDate(invoice.date)}</span>
              </div>
              <div className="flex">
                <span className="w-24 font-bold text-black flex justify-between">Gate Pass <span>:</span></span>
                <span className="flex-1 font-mono font-bold text-black pl-2">{invoice.invoice_no}</span>
              </div>
            </div>
          </div>

          {/* ITEMS TABLE */}
          <div className="pt-2">
            <table className="w-full text-left text-xs border border-black border-collapse">
              <thead>
                <tr className="border-b border-black font-bold text-black bg-gray-50 print:bg-transparent">
                  <th className="p-2 border-r border-black text-center w-12">SL</th>
                  <th className="p-2 border-r border-black w-28">Item Code</th>
                  <th className="p-2 border-r border-black">Item Description</th>
                  <th className="p-2 border-r border-black text-center w-16">Unit</th>
                  <th className="p-2 border-r border-black text-right w-24">Bag Qty</th>
                  <th className="p-2 text-right w-28">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, idx) => (
                  <tr key={item.id || idx} className="border-b border-black font-medium">
                    <td className="p-2 border-r border-black text-center font-bold">{idx + 1}</td>
                    <td className="p-2 border-r border-black font-mono font-bold">{item.product.code}</td>
                    <td className="p-2 border-r border-black font-bold">
                      {item.product.name} {item.product.bag_size_kg || 50} kg
                    </td>
                    <td className="p-2 border-r border-black text-center uppercase font-bold">KG</td>
                    <td className="p-2 border-r border-black text-right font-bold">{item.quantity}</td>
                    <td className="p-2 text-right font-bold">{item.quantity * (item.product.bag_size_kg || 50)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-black font-black text-black">
                  <td colSpan={4} className="p-2 text-right uppercase tracking-wider font-extrabold">Total:</td>
                  <td className="p-2 border-r border-black text-right font-extrabold">{totalBags}</td>
                  <td className="p-2 text-right font-extrabold">{totalWeightKg}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* FOOTER SIGNATURES & NOTICE */}
          <div className="pt-20 space-y-8">
            <div className="grid grid-cols-4 gap-4 text-center text-xs font-bold text-black">
              <div>
                <p className="border-t border-black pt-1">Delivery-By</p>
              </div>
              <div>
                <p className="border-t border-black pt-1">Prepared-By</p>
              </div>
              <div>
                <p className="border-t border-black pt-1">Store-Officer</p>
              </div>
              <div>
                <p className="border-t border-black pt-1">Authorized-BY</p>
              </div>
            </div>

            <div className="flex justify-between items-center text-[10px] font-semibold text-gray-800 pt-4 border-t border-gray-200">
              <p>Note: No claims for shortage will be entertained after five days from the delivered date.</p>
              <p>This is an ERP generated report</p>
            </div>
          </div>

        </div>
      </div>
    </div>
    </>
  );
}
