"use client";

import { Database } from "lucide-react";

interface LoadingDatabaseModalProps {
  isOpen: boolean;
  isDarkMode?: boolean;
  title?: string;
  message?: string;
}

export default function LoadingDatabaseModal({
  isOpen,
  isDarkMode = true,
  title = "กำลังดึงข้อมูลจากฐานข้อมูล",
  message = "รอสักครู่ครับ...",
}: LoadingDatabaseModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md anim-fade-in">
      <div
        className={`relative w-full max-w-sm sm:max-w-md p-6 sm:p-8 rounded-3xl flex flex-col items-center text-center shadow-2xl anim-pop-in border ${
          isDarkMode
            ? "bg-slate-900/95 border-cyan-500/40 text-white shadow-[0_0_50px_rgba(6,182,212,0.25)]"
            : "bg-white/95 border-cyan-400/50 text-slate-800 shadow-2xl"
        }`}
      >
        {/* Glow ambient background */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-40 bg-cyan-500/20 blur-3xl rounded-full pointer-events-none" />

        {/* Dual Spinning Neon Loader */}
        <div className="relative flex items-center justify-center w-24 h-24 mb-5">
          {/* Outer track */}
          <div className="absolute inset-0 rounded-full border-4 border-cyan-500/15" />
          {/* Outer spin ring */}
          <div className="absolute inset-0 rounded-full border-4 border-cyan-400 border-t-transparent border-r-transparent animate-spin shadow-[0_0_20px_rgba(34,211,238,0.5)]" />
          {/* Inner reverse spin ring */}
          <div
            className="absolute inset-2 rounded-full border-2 border-fuchsia-400/80 border-b-transparent border-l-transparent animate-spin shadow-[0_0_15px_rgba(217,70,239,0.4)]"
            style={{ animationDirection: "reverse", animationDuration: "1.2s" }}
          />
          {/* Center pulsating database icon */}
          <div className="relative p-3 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            <Database size={26} className="animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg sm:text-xl font-bold tracking-wide">
          {title}
        </h3>

        {/* Subtitle / Wait message */}
        <div className="flex items-center justify-center gap-1.5 mt-2">
          <span className="text-sm font-semibold font-mono text-cyan-400 animate-pulse">
            {message}
          </span>
        </div>

        <p className="text-xs text-gray-400 mt-2 font-mono">
          ระบบกำลังเชื่อมต่อและประมวลผลข้อมูลล่าสุดจากเซิร์ฟเวอร์
        </p>

        {/* Animated Progress Bar */}
        <div className="w-full bg-slate-800/80 rounded-full h-1.5 mt-5 overflow-hidden border border-white/10 relative">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-cyan-400 rounded-full animate-pulse w-full"
            style={{
              backgroundSize: "200% 100%",
              animation: "shimmer-line 2s linear infinite",
            }}
          />
        </div>
      </div>
    </div>
  );
}

