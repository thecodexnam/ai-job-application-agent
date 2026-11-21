"use client";

import React, { useState, useRef, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  Cancel01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";

interface ProfileDatePickerProps {
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  disabledText?: string;
  hasError?: boolean;
  id?: string;
}

const MONTHS = [
  { label: "Jan", full: "January", value: "01" },
  { label: "Feb", full: "February", value: "02" },
  { label: "Mar", full: "March", value: "03" },
  { label: "Apr", full: "April", value: "04" },
  { label: "May", full: "May", value: "05" },
  { label: "Jun", full: "June", value: "06" },
  { label: "Jul", full: "July", value: "07" },
  { label: "Aug", full: "August", value: "08" },
  { label: "Sep", full: "September", value: "09" },
  { label: "Oct", full: "October", value: "10" },
  { label: "Nov", full: "November", value: "11" },
  { label: "Dec", full: "December", value: "12" },
];

export function ProfileDatePicker({
  value,
  onChange,
  placeholder = "Select date",
  disabled = false,
  disabledText = "Present",
  hasError = false,
  id,
}: ProfileDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentYear = new Date().getFullYear();

  const parseValue = (val?: string | null) => {
    if (!val) return { year: currentYear, month: "" };
    const matchHyphen = val.match(/^(\d{4})-(\d{1,2})/);
    if (matchHyphen) {
      return {
        year: parseInt(matchHyphen[1], 10),
        month: matchHyphen[2].padStart(2, "0"),
      };
    }
    const matchText = val.match(/^([a-zA-Z]+)\s+(\d{4})/);
    if (matchText) {
      const mIdx = MONTHS.findIndex(
        (m) =>
          m.label.toLowerCase() === matchText[1].toLowerCase() ||
          m.full.toLowerCase() === matchText[1].toLowerCase()
      );
      if (mIdx !== -1) {
        return {
          year: parseInt(matchText[2], 10),
          month: MONTHS[mIdx].value,
        };
      }
    }
    return { year: currentYear, month: "" };
  };

  const parsed = parseValue(value);
  const [selectedYear, setSelectedYear] = useState<number>(parsed.year);
  const [selectedMonth, setSelectedMonth] = useState<string>(parsed.month);

  useEffect(() => {
    const p = parseValue(value);
    setSelectedYear(p.year);
    setSelectedMonth(p.month);
  }, [value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleMonthSelect = (monthVal: string) => {
    setSelectedMonth(monthVal);
    const formatted = `${selectedYear}-${monthVal}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSelectedMonth("");
  };

  const getDisplayText = () => {
    if (disabled) return disabledText;
    if (!value) return null;
    const p = parseValue(value);
    if (!p.month) return value;
    const m = MONTHS.find((item) => item.value === p.month);
    return m ? `${m.label} ${p.year}` : value;
  };

  const displayText = getDisplayText();

  const yearsList = [];
  for (let y = currentYear + 10; y >= 1970; y--) {
    yearsList.push(y);
  }

  return (
    <div ref={containerRef} className="relative w-full" id={id}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full h-9 px-3 flex items-center justify-between text-xs font-medium rounded-md border transition-colors cursor-pointer ${
          disabled
            ? "bg-[#E7E5DC]/50 border-[#1A1A1A]/10 text-[#687064] cursor-not-allowed opacity-80"
            : hasError
            ? "bg-[#F7F6F0] border-rose-300 text-[#171914] ring-1 ring-rose-300"
            : isOpen
            ? "bg-white border-[#1A1A1A]/35 ring-1 ring-[#1A1A1A]/20"
            : "bg-[#F7F6F0] border-[#1A1A1A]/15 text-[#171914] hover:bg-white focus:bg-white"
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <HugeiconsIcon
            icon={Calendar03Icon}
            className={`size-3.5 shrink-0 ${
              disabled
                ? "text-[#687064]"
                : hasError
                ? "text-rose-600"
                : "text-[#687064]"
            }`}
          />
          <span className={displayText ? "font-semibold text-[#171914]" : "text-[#687064]"}>
            {displayText || placeholder}
          </span>
        </div>

        {!disabled && value && (
          <span
            onClick={handleClear}
            title="Clear date"
            className="p-1 rounded text-[#687064] hover:text-rose-600 hover:bg-[#F2F0E8] transition-colors"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="size-3" />
          </span>
        )}
      </button>

      {/* Popover Calendar Picker */}
      {isOpen && !disabled && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-72 bg-white border border-[#1A1A1A]/20 rounded-lg p-3.5 shadow-xl animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Year Navigation */}
          <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-[#1A1A1A]/10">
            <button
              type="button"
              onClick={() => setSelectedYear((y) => y - 1)}
              className="size-7 rounded-md border border-[#1A1A1A]/15 flex items-center justify-center hover:bg-[#F2F0E8] transition-colors cursor-pointer"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} className="size-3.5 text-[#171914]" />
            </button>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="h-7 px-2 rounded-md border border-[#1A1A1A]/15 bg-[#F7F6F0] text-xs font-semibold text-[#171914] outline-none cursor-pointer"
            >
              {yearsList.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setSelectedYear((y) => y + 1)}
              className="size-7 rounded-md border border-[#1A1A1A]/15 flex items-center justify-center hover:bg-[#F2F0E8] transition-colors cursor-pointer"
            >
              <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5 text-[#171914]" />
            </button>
          </div>

          {/* Month Grid (4 columns x 3 rows) */}
          <div className="grid grid-cols-4 gap-1.5">
            {MONTHS.map((m) => {
              const isSelected =
                parsed.year === selectedYear && parsed.month === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => handleMonthSelect(m.value)}
                  className={`py-1.5 text-xs font-semibold rounded-md border transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-[#DDF19B] text-[#1B2710] border-[#9FB944]"
                      : "bg-[#F7F6F0] text-[#171914] border-[#1A1A1A]/10 hover:bg-[#F2F0E8] hover:border-[#1A1A1A]/30"
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* Popover Footer: Quick Actions */}
          <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-[#1A1A1A]/10 text-[11px]">
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                setSelectedYear(now.getFullYear());
                const mStr = String(now.getMonth() + 1).padStart(2, "0");
                handleMonthSelect(mStr);
              }}
              className="font-semibold text-[#171914] hover:underline cursor-pointer"
            >
              This Month
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-2.5 py-1 rounded-md bg-[#172013] text-white font-semibold text-[10px] hover:bg-[#26321E] cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
