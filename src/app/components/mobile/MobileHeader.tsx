"use client";

import React from "react";
import { Menu, Sun, Moon, Shield, UserCircle } from "lucide-react";

interface MobileHeaderProps {
  currentUser: any;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  onOpenDrawer: () => void;
}

export default function MobileHeader({
  currentUser,
  isDarkMode,
  setIsDarkMode,
  onOpenDrawer,
}: MobileHeaderProps) {
  const getAffiliationBadge = (aff: string) => {
    switch (aff) {
      case "บช.ทท.": return "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40";
      case "ฝ่ายอำนวยการ 6": case "ฝ่ายอำนวยการ 6.": return "bg-red-500/20 text-red-300 border-red-500/40";
      case "บก.ทท.1": return "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
      case "บก.ทท.2": return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case "บก.ทท.3": return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      default: return "bg-slate-500/20 text-slate-300 border-slate-500/40";
    }
  };

  return (
    <header className={`sticky top-0 z-40 w-full px-4 py-2.5 flex items-center justify-between border-b backdrop-blur-md transition-colors duration-300 ${
      isDarkMode
        ? "bg-slate-950/85 border-slate-800/80 text-white shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
        : "bg-white/90 border-slate-200/90 text-slate-900 shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
    }`}>
      {/* Left: Brand / Logo */}
      <div className="flex items-center space-x-2.5">
        <button
          onClick={onOpenDrawer}
          className={`p-2 rounded-xl border transition-all active:scale-95 ${
            isDarkMode
              ? "bg-slate-900 border-slate-700/60 text-cyan-400 hover:border-cyan-500/50 shadow-[0_0_12px_rgba(34,211,238,0.15)]"
              : "bg-slate-100 border-slate-300 text-cyan-600 hover:border-cyan-400"
          }`}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center space-x-1.5">
            <Shield className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="font-extrabold tracking-wider text-sm bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-300 bg-clip-text text-transparent drop-shadow">
              CCOC NEON
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono tracking-tight leading-none">
            MOBILE DASHBOARD
          </span>
        </div>
      </div>

      {/* Right: User Badge & Actions */}
      <div className="flex items-center space-x-2">
        {currentUser && (
          <div className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border flex items-center space-x-1 ${getAffiliationBadge(currentUser.affiliation)}`}>
            <UserCircle className="w-3.5 h-3.5" />
            <span className="truncate max-w-[90px]">{currentUser.affiliation}</span>
          </div>
        )}

        <button
          onClick={() => setIsDarkMode(prev => !prev)}
          className={`p-2 rounded-xl border transition-all active:scale-95 ${
            isDarkMode
              ? "bg-slate-900 border-slate-800 text-amber-300 hover:border-amber-400/40"
              : "bg-slate-100 border-slate-300 text-slate-700 hover:border-slate-400"
          }`}
          title="Toggle Theme"
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
