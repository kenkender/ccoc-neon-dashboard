"use client";

import React from "react";
import { AlertTriangle, Trash2, ShieldAlert } from "lucide-react";

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "ยืนยันดำเนินการ",
  cancelText = "ยกเลิก",
  isDanger = true,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 anim-fade-in">
      <div
        className={`w-full max-w-md rounded-3xl p-6 relative overflow-hidden shadow-2xl transition-all border transform scale-100 anim-pop-in ${
          isDanger
            ? "bg-[#0f0507] border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.3)]"
            : "bg-[#0c0a05] border-amber-500/50 shadow-[0_0_50px_rgba(245,158,11,0.3)]"
        }`}
      >
        {/* Glow Background */}
        <div
          className={`absolute -top-20 -left-20 w-40 h-40 rounded-full blur-3xl pointer-events-none ${
            isDanger ? "bg-red-600/30" : "bg-amber-600/30"
          }`}
        />

        {/* Icon & Title */}
        <div className="flex flex-col items-center text-center mt-2 mb-4 relative z-10">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border shadow-inner ${
              isDanger
                ? "bg-red-950/80 border-red-500/50 text-red-400"
                : "bg-amber-950/80 border-amber-500/50 text-amber-400"
            }`}
          >
            {isDanger ? (
              <Trash2 size={32} className="animate-pulse" />
            ) : (
              <AlertTriangle size={32} className="animate-pulse" />
            )}
          </div>

          <h3
            className={`text-xl font-black tracking-wide ${
              isDanger
                ? "text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                : "text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]"
            }`}
          >
            {title}
          </h3>
        </div>

        {/* Message */}
        <div className="text-center mb-6 relative z-10">
          <p className="text-sm text-gray-300 leading-relaxed font-medium whitespace-pre-line">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 relative z-10 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3.5 rounded-xl font-bold font-mono text-gray-300 bg-gray-900 border border-gray-700 hover:bg-gray-800 hover:text-white transition-all transform active:scale-95"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-3.5 rounded-xl font-bold font-mono transition-all transform active:scale-95 shadow-lg ${
              isDanger
                ? "bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white shadow-red-950/60"
                : "bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black font-black shadow-amber-950/60"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
