"use client";

import React from "react";
import {
  X,
  UserCircle,
  Printer,
  RefreshCw,
  LogOut,
  Shield,
  LineChart,
  Truck,
  Edit3,
  Car,
  Image as ImageIcon,
} from "lucide-react";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  activeMenu: number;
  setActiveMenu: (menu: number) => void;
  isDarkMode: boolean;
  onOpenPdfModal: () => void;
  onRefreshData: () => void;
  onLogout: () => void;
}

export default function MobileDrawer({
  isOpen,
  onClose,
  currentUser,
  activeMenu,
  setActiveMenu,
  isDarkMode,
  onOpenPdfModal,
  onRefreshData,
  onLogout,
}: MobileDrawerProps) {
  if (!isOpen) return null;

  const menuList = [
    { id: 1, label: "1. บันทึกภารกิจรถโมบาย", icon: Edit3 },
    { id: 2, label: "2. รายการบันทึกภารกิจ", icon: Truck },
    { id: 3, label: "3. แดชบอร์ดวิเคราะห์สถิติ", icon: LineChart },
    ...(currentUser?.role === "admin" ? [{ id: 4, label: "4. ประวัติการเข้าใช้งาน", icon: Shield }] : []),
    { id: 5, label: currentUser?.role === "admin" ? "5. คลังภาพภารกิจ" : "4. คลังภาพภารกิจ", icon: ImageIcon },
    ...(currentUser?.role === "admin" ? [{ id: 6, label: "6. จัดการรถ/ผู้ใช้", icon: Car }] : []),
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div
        className={`absolute inset-y-0 left-0 max-w-xs w-full flex flex-col shadow-2xl transition-transform transform duration-300 ${
          isDarkMode
            ? "bg-slate-950 text-white border-r border-slate-800"
            : "bg-white text-slate-900 border-r border-slate-200"
        }`}
      >
        {/* Drawer Header */}
        <div
          className={`p-4 flex items-center justify-between border-b ${
            isDarkMode ? "border-slate-800 bg-slate-900/60" : "border-slate-100 bg-slate-50"
          }`}
        >
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <span className="font-extrabold text-base bg-gradient-to-r from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">
              เมนูหลัก CCOC
            </span>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg border transition-colors ${
              isDarkMode
                ? "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                : "bg-slate-200 border-slate-300 text-slate-600 hover:text-slate-900"
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        {currentUser && (
          <div className="p-4 border-b border-slate-800/50 bg-gradient-to-r from-cyan-950/30 to-fuchsia-950/30">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-fuchsia-500 flex items-center justify-center text-white font-bold shadow-md">
                <UserCircle className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{currentUser.username || "User"}</p>
                <p className="text-xs text-cyan-400 font-mono truncate">{currentUser.affiliation}</p>
                <p className="text-[10px] text-slate-400 truncate">{currentUser.unit_name || "-"}</p>
              </div>
            </div>
          </div>
        )}

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-4 custom-scrollbar">
          {/* Main Navigation Menu */}
          <div>
            <p className="text-[11px] font-semibold text-slate-400 px-3 mb-2 uppercase tracking-wider font-mono">
              หมวดหมู่การใช้งาน
            </p>
            <div className="space-y-1">
              {menuList.map((item) => {
                const Icon = item.icon;
                const isActive = activeMenu === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveMenu(item.id);
                      onClose();
                    }}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? isDarkMode
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                          : "bg-cyan-50 text-cyan-700 border border-cyan-200"
                        : isDarkMode
                        ? "text-slate-300 hover:bg-slate-900"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tools & Reports */}
          <div>
            <p className="text-[11px] font-semibold text-slate-400 px-3 mb-2 uppercase tracking-wider font-mono">
              เครื่องมือ & รายงาน
            </p>
            <div className="space-y-1">
              <button
                onClick={() => {
                  onOpenPdfModal();
                  onClose();
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isDarkMode
                    ? "text-rose-400 hover:bg-rose-950/30 border border-rose-900/30"
                    : "text-rose-700 hover:bg-rose-50 border border-rose-200"
                }`}
              >
                <Printer className="w-4 h-4 text-rose-400" />
                <span>พิมพ์รายงานสรุป PDF</span>
              </button>

              <button
                onClick={() => {
                  onRefreshData();
                  onClose();
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isDarkMode
                    ? "text-cyan-400 hover:bg-cyan-950/30 border border-cyan-900/30"
                    : "text-cyan-700 hover:bg-cyan-50 border border-cyan-200"
                }`}
              >
                <RefreshCw className="w-4 h-4 text-cyan-400" />
                <span>รีเฟรชข้อมูล (Sync)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Drawer Footer / Logout */}
        <div
          className={`p-3 border-t ${
            isDarkMode ? "border-slate-800 bg-slate-900/40" : "border-slate-100 bg-slate-50"
          }`}
        >
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 transition-all active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </div>
    </div>
  );
}
