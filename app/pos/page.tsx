"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import PosEntryForm from "@/components/PosEntryForm";
import PendingOrdersWidget from "@/components/PendingOrdersWidget";
import { RecentSalesTable } from "@/components/RecentSalesTable";
import ChallanModal, { ChallanInvoice } from "@/components/ChallanModal";

export default function PosPage() {
  const [selectedDealerId, setSelectedDealerId] = useState<string>("");
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [activeChallan, setActiveChallan] = useState<ChallanInvoice | null>(null);

  const handleSaleSuccess = (invoice: ChallanInvoice) => {
    setActiveChallan(invoice); // Open printable Challan modal!
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
              Sales Dispatch POS & Order Sync
            </h1>
            <p className="text-sm text-slate-400">
              Multi-Product Single-Invoice Entry, Delivery Order Auto-Population, FIFO Lotting, and Immediate Delivery Challan Printing.
            </p>
          </div>
        </div>

        {/* Split Screen Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Multi-Product POS Form */}
          <div className="lg:col-span-7">
            <PosEntryForm
              onSaleSuccess={handleSaleSuccess}
              onDealerChange={(dealerId) => setSelectedDealerId(dealerId)}
            />
          </div>

          {/* Right Column: Pending Orders Widget */}
          <div className="lg:col-span-5 h-full">
            <PendingOrdersWidget
              selectedDealerId={selectedDealerId}
              refreshTrigger={refreshKey}
            />
          </div>
        </div>

        {/* Recent Sales Logs Table */}
        <div className="pt-4">
          <RecentSalesTable key={refreshKey} />
        </div>
      </main>

      {/* Printable Challan Modal */}
      {activeChallan && (
        <ChallanModal
          invoice={activeChallan}
          onClose={() => setActiveChallan(null)}
        />
      )}
    </div>
  );
}
