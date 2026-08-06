"use client";

import { useMemo } from "react";
import { Filter, Search, CalendarDays } from "lucide-react";
import SearchableSelect, { OptionType } from "@/components/SearchableSelect";

export interface FilterValues {
  depotId?: string;
  userId?: string;
  dealerId?: string;
  productId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

interface FilterBarProps {
  filters: FilterValues;
  onChange: (filters: FilterValues) => void;
  depots?: OptionType[];
  users?: OptionType[];
  dealers?: OptionType[];
  products?: OptionType[];
  statuses?: OptionType[];
  showUser?: boolean;
  showProduct?: boolean;
  showStatus?: boolean;
  showDateRange?: boolean;
  showGlobalSearch?: boolean;
}

export default function FilterBar({
  filters,
  onChange,
  depots = [],
  users = [],
  dealers = [],
  products = [],
  statuses = [],
  showUser = false,
  showProduct = false,
  showStatus = false,
  showDateRange = true,
  showGlobalSearch = true,
}: FilterBarProps) {
  const statusOptions = useMemo(
    () => statuses.length > 0 ? statuses : [
      { value: "", label: "All Statuses" },
      { value: "Pending", label: "Pending" },
      { value: "Partial", label: "Partial" },
      { value: "Complete", label: "Complete" },
    ],
    [statuses]
  );

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-inner">
      <div className="grid gap-3 xl:grid-cols-6 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2">
        {depots.length > 0 && (
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Depot</label>
            <SearchableSelect
              options={[{ value: "", label: "All Depots" }, ...depots]}
              value={filters.depotId || ""}
              onChange={(value) => onChange({ ...filters, depotId: value || undefined })}
              placeholder="Depot"
            />
          </div>
        )}

        {showUser && users.length > 0 && (
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">User</label>
            <SearchableSelect
              options={[{ value: "", label: "All Users" }, ...users]}
              value={filters.userId || ""}
              onChange={(value) => onChange({ ...filters, userId: value || undefined })}
              placeholder="User"
            />
          </div>
        )}

        {dealers.length > 0 && (
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Dealer</label>
            <SearchableSelect
              options={[{ value: "", label: "All Dealers" }, ...dealers]}
              value={filters.dealerId || ""}
              onChange={(value) => onChange({ ...filters, dealerId: value || undefined })}
              placeholder="Dealer"
            />
          </div>
        )}

        {showProduct && products.length > 0 && (
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Product</label>
            <SearchableSelect
              options={[{ value: "", label: "All Products" }, ...products]}
              value={filters.productId || ""}
              onChange={(value) => onChange({ ...filters, productId: value || undefined })}
              placeholder="Product"
            />
          </div>
        )}

        {showStatus && (
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Status</label>
            <select
              value={filters.status || ""}
              onChange={(e) => onChange({ ...filters, status: e.target.value || undefined })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:border-emerald-500"
            >
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value} className="bg-slate-50 text-slate-900">
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {showDateRange && (
          <div className="grid gap-2">
            <label className="block text-[10px] font-semibold text-slate-500">Date Range</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  type="date"
                  value={filters.dateFrom || ""}
                  onChange={(e) => onChange({ ...filters, dateFrom: e.target.value || undefined })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900"
                />
              </div>
              <div>
                <input
                  type="date"
                  value={filters.dateTo || ""}
                  onChange={(e) => onChange({ ...filters, dateTo: e.target.value || undefined })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900"
                />
              </div>
            </div>
          </div>
        )}

        {showGlobalSearch && (
          <div className="xl:col-span-2 lg:col-span-2 md:col-span-3 sm:col-span-2">
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Global Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-3.5 text-slate-500 w-4 h-4" />
              <input
                type="text"
                value={filters.search || ""}
                onChange={(e) => onChange({ ...filters, search: e.target.value || undefined })}
                placeholder="Search order, dealer, product, user..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-900 focus:border-emerald-500"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
