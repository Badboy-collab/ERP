"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

const Select = dynamic(() => import("react-select"), { ssr: false });

export interface OptionType {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: OptionType[];
  value: string | null;
  onChange: (val: string) => void;
  placeholder?: string;
  isSearchable?: boolean;
  isDisabled?: boolean;
  formatOptionLabel?: (option: OptionType) => React.ReactNode;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  isSearchable = true,
  isDisabled = false,
  formatOptionLabel,
}: SearchableSelectProps) {
  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value) || null,
    [options, value]
  );

  return (
    <Select
      options={options}
      value={selectedOption}
      onChange={(opt) => onChange(opt ? (opt as OptionType).value : "")}
      placeholder={placeholder}
      isSearchable={isSearchable}
      isDisabled={isDisabled}
      formatOptionLabel={formatOptionLabel as any}
      classNamePrefix="react-select"
      styles={{
        control: (base, state) => ({
          ...base,
          backgroundColor: "#0f172a", 
          borderColor: state.isFocused ? "#10b981" : "#1e293b",
          boxShadow: state.isFocused ? "0 0 0 1px #10b981" : "none",
          "&:hover": {
            borderColor: state.isFocused ? "#10b981" : "#334155",
          },
          padding: "2px",
          borderRadius: "0.5rem",
        }),
        menu: (base) => ({
          ...base,
          backgroundColor: "#0f172a",
          border: "1px solid #1e293b",
          borderRadius: "0.5rem",
          zIndex: 50,
        }),
        menuList: (base) => ({
          ...base,
          padding: "4px",
        }),
        option: (base, state) => ({
          ...base,
          backgroundColor: state.isSelected
            ? "#10b981"
            : state.isFocused
            ? "#1e293b"
            : "transparent",
          color: state.isSelected ? "white" : "white",
          cursor: "pointer",
          borderRadius: "0.25rem",
          "&:active": {
            backgroundColor: "#059669",
          },
        }),
        singleValue: (base) => ({
          ...base,
          color: "white",
          fontWeight: "bold",
          fontSize: "0.875rem",
        }),
        input: (base) => ({
          ...base,
          color: "white",
        }),
        placeholder: (base) => ({
          ...base,
          color: "#94a3b8",
          fontSize: "0.875rem",
        }),
      }}
    />
  );
}
