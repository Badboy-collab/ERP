"use client";

import { useState, useEffect } from "react";

interface DualQuantityInputProps {
  kgValue: number | "";
  onKgChange: (val: number | "") => void;
  bagSizeKg: number;
}

export default function DualQuantityInput({
  kgValue,
  onKgChange,
  bagSizeKg,
}: DualQuantityInputProps) {
  const [bagsValue, setBagsValue] = useState<number | "">("");

  useEffect(() => {
    if (kgValue === "") {
      setBagsValue("");
    } else {
      const b = kgValue / bagSizeKg;
      setBagsValue(parseFloat(b.toFixed(2)));
    }
  }, [kgValue, bagSizeKg]);

  const handleKgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "") {
      onKgChange("");
    } else {
      const num = parseFloat(val);
      onKgChange(num);
    }
  };

  const handleBagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "") {
      setBagsValue("");
      onKgChange("");
    } else {
      const b = parseFloat(val);
      setBagsValue(b);
      onKgChange(b * bagSizeKg);
    }
  };

  return (
    <div className="flex gap-2 w-full">
      <div className="flex-1 relative">
        <input
          type="number"
          min="0"
          step="any"
          value={kgValue}
          onChange={handleKgChange}
          placeholder="0"
          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-bold pr-8"
        />
        <span className="absolute right-3 top-2 text-xs text-slate-500 pointer-events-none">Kg</span>
      </div>
      <div className="flex-1 relative">
        <input
          type="number"
          min="0"
          step="any"
          value={bagsValue}
          onChange={handleBagsChange}
          placeholder="0"
          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-bold pr-10"
        />
        <span className="absolute right-3 top-2 text-xs text-slate-500 pointer-events-none">Bags</span>
      </div>
    </div>
  );
}
