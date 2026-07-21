"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";

export type NotificationType = "success" | "warning" | "error" | "info";

export interface NotificationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: NotificationType;
  details?: string[];
  onClose: () => void;
  confirmText?: string;
  isDarkMode?: boolean;
}

export default function NotificationModal({
  isOpen,
  title,
  message,
  type = "info",
  details = [],
  onClose,
  confirmText = "ตกลง",
  isDarkMode = true,
}: NotificationModalProps) {
  if (!isOpen) return null;

  const getConfig = () => {
    switch (type) {
      case "success":
        return {
          icon: <CheckCircle2 size={36} className="text-emerald-400 animate-bounce" />,
          titleColor: "text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]",
          badgeBg: "bg-emerald-950/60 border-emerald-500/40 text-emerald-300",
          cardBg: "bg-[#050f0b] border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.25)]",
          glowColor: "bg-emerald-500/25",
          btnStyle:
            "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-black shadow-emerald-950/60",
        };
      case "warning":
        return {
          icon: <AlertTriangle size={36} className="text-yellow-400 animate-pulse" />,
          titleColor: "text-yellow-400 drop-shadow-[0_0_12px_rgba(234,179,8,0.5)]",
          badgeBg: "bg-yellow-950/60 border-yellow-500/40 text-yellow-300",
          cardBg: "bg-[#0f0e05] border-yellow-500/50 shadow-[0_0_50px_rgba(234,179,8,0.25)]",
          glowColor: "bg-yellow-500/25",
          btnStyle:
            "bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-black shadow-yellow-950/60",
        };
      case "error":
        return {
          icon: <XCircle size={36} className="text-red-400 animate-bounce" />,
          titleColor: "text-red-400 drop-shadow-[0_0_12px_rgba(239,68,68,0.5)]",
          badgeBg: "bg-red-950/60 border-red-500/40 text-red-300",
          cardBg: "bg-[#0f0507] border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.25)]",
          glowColor: "bg-red-500/25",
          btnStyle: "bg-red-600 hover:bg-red-500 text-white font-bold shadow-red-950/60",
        };
      case "info":
      default:
        return {
          icon: <Info size={36} className="text-cyan-400 animate-pulse" />,
          titleColor: "text-cyan-400 drop-shadow-[0_0_12px_rgba(6,182,212,0.5)]",
          badgeBg: "bg-cyan-950/60 border-cyan-500/40 text-cyan-300",
          cardBg: "bg-[#050b0f] border-cyan-500/50 shadow-[0_0_50px_rgba(6,182,212,0.25)]",
          glowColor: "bg-cyan-500/25",
          btnStyle:
            "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black shadow-cyan-950/60",
        };
    }
  };

  const config = getConfig();

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 anim-fade-in">
      <div
        className={`w-full max-w-md rounded-3xl p-6 relative overflow-hidden shadow-2xl transition-all border transform scale-100 anim-pop-in ${config.cardBg}`}
      >
        {/* Glow Effects */}
        <div
          className={`absolute -top-20 -left-20 w-40 h-40 rounded-full blur-3xl pointer-events-none ${config.glowColor}`}
        />
        <div
          className={`absolute -bottom-20 -right-20 w-40 h-40 rounded-full blur-3xl pointer-events-none ${config.glowColor}`}
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors z-20"
        >
          <X size={18} />
        </button>

        {/* Icon & Title */}
        <div className="flex flex-col items-center text-center mt-2 mb-4 relative z-10">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border shadow-inner ${config.badgeBg}`}
          >
            {config.icon}
          </div>
          <h3 className={`text-xl font-black tracking-wide ${config.titleColor}`}>
            {title}
          </h3>
        </div>

        {/* Message */}
        <div className="text-center mb-5 relative z-10">
          <p className="text-sm font-medium text-gray-200 leading-relaxed whitespace-pre-line">
            {message}
          </p>
        </div>

        {/* Optional Details List */}
        {details.length > 0 && (
          <div className="mb-6 relative z-10 bg-black/50 border border-gray-800 rounded-2xl p-3.5 space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
            {details.map((detail, idx) => (
              <div key={idx} className="text-xs font-mono text-gray-300 flex items-start gap-2">
                <span className="text-gray-500">•</span>
                <span>{detail}</span>
              </div>
            ))}
          </div>
        )}

        {/* Action Button */}
        <div className="relative z-10 pt-2 flex justify-center">
          <button
            type="button"
            onClick={onClose}
            className={`w-full py-3 rounded-xl font-bold font-mono transition-all transform active:scale-95 shadow-lg ${config.btnStyle}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
