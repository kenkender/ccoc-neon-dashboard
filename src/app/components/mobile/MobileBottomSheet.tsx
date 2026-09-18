"use client";

import React from "react";
import { X } from "lucide-react";

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  isDarkMode?: boolean;
}

export default function MobileBottomSheet({
  isOpen,
  onClose,
  title,
  children,
  isDarkMode = true,
}: MobileBottomSheetProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Sheet Panel */}
      <div
        className={`relative z-10 w-full max-h-[85vh] flex flex-col rounded-t-[28px] border-t shadow-2xl transition-transform transform duration-300 animate-in slide-in-from-bottom ${
          isDarkMode
            ? "bg-slate-950 text-white border-slate-800"
            : "bg-white text-slate-900 border-slate-200"
        }`}
      >
        {/* Drag Handle Bar */}
        <div className="w-full flex justify-center py-2.5" onClick={onClose}>
          <div className="w-12 h-1.5 rounded-full bg-slate-700/60" />
        </div>

        {/* Header */}
        {title && (
          <div
            className={`px-5 py-2.5 flex items-center justify-between border-b ${
              isDarkMode ? "border-slate-800/80" : "border-slate-100"
            }`}
          >
            <h3 className="font-bold text-base bg-gradient-to-r from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">
              {title}
            </h3>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-xl border transition-colors ${
                isDarkMode
                  ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                  : "bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900"
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Sheet Content */}
        <div className="flex-1 overflow-y-auto p-5 pb-safe space-y-4 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}
