"use client";

import React from "react";
import { LineChart, Truck, Edit3, Car, Image as ImageIcon } from "lucide-react";

interface MobileBottomNavProps {
  activeMenu: number;
  setActiveMenu: (menu: number) => void;
  isDarkMode: boolean;
}

export default function MobileBottomNav({
  activeMenu,
  setActiveMenu,
  isDarkMode,
}: MobileBottomNavProps) {
  const navItems = [
    { id: 3, label: "แดชบอร์ด", icon: LineChart },
    { id: 2, label: "รายการภารกิจ", icon: Truck },
    { id: 1, label: "ลงบันทึก", icon: Edit3, isAction: true },
    { id: 6, label: "จัดการรถ", icon: Car },
    { id: 5, label: "คลังภาพ", icon: ImageIcon },
  ];

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-40 px-2 pb-safe pt-1 border-t backdrop-blur-xl transition-all duration-300 ${
        isDarkMode
          ? "bg-slate-950/90 border-slate-800/80 shadow-[0_-8px_30px_rgba(0,0,0,0.8)] text-slate-400"
          : "bg-white/95 border-slate-200/90 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] text-slate-600"
      }`}
    >
      <div className="flex items-center justify-around max-w-md mx-auto h-14">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeMenu === item.id;

          if (item.isAction) {
            return (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                className="relative -top-3 group flex flex-col items-center justify-center focus:outline-none"
                aria-label={item.label}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 transform active:scale-90 ${
                    isActive
                      ? "bg-gradient-to-tr from-fuchsia-600 to-cyan-500 text-white shadow-[0_0_20px_rgba(217,70,239,0.6)] ring-2 ring-white/50"
                      : "bg-gradient-to-tr from-cyan-500 to-fuchsia-500 text-white shadow-[0_4px_15px_rgba(34,211,238,0.4)] hover:scale-105"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={`text-[10px] font-medium mt-0.5 tracking-tight ${
                    isActive
                      ? "text-fuchsia-400 font-bold"
                      : isDarkMode
                      ? "text-slate-400"
                      : "text-slate-600"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => setActiveMenu(item.id)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 active:scale-95 ${
                isActive
                  ? isDarkMode
                    ? "text-cyan-400"
                    : "text-cyan-600 font-semibold"
                  : "hover:text-slate-200"
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? "scale-110" : ""
                  }`}
                />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse" />
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-1">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
