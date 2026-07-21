"use client";

import React from "react";
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, ShieldCheck } from "lucide-react";

export type UploadStage = "sending_data" | "uploading_photos" | "success" | "error";

export interface UploadProgressModalProps {
  isOpen: boolean;
  stage: UploadStage;
  progress: number; // 0 - 100
  currentFileName?: string;
  files?: File[];
  isDarkMode?: boolean;
  missionName?: string;
  totalFiles?: number;
  errorMessage?: string;
  onClose?: () => void;
}

export default function UploadProgressModal({
  isOpen,
  stage,
  progress,
  currentFileName,
  files = [],
  isDarkMode = true,
  missionName,
  totalFiles = 0,
  errorMessage,
  onClose,
}: UploadProgressModalProps) {
  if (!isOpen) return null;

  const isSuccess = stage === "success";
  const isError = stage === "error";

  const getStageTitle = () => {
    switch (stage) {
      case "sending_data":
        return "กำลังส่งข้อมูลเข้าระบบ...";
      case "uploading_photos":
        return "กำลังอัปโหลดรูปภาพประกอบภารกิจ...";
      case "success":
        return "อัปโหลดและบันทึกข้อมูลสำเร็จ!";
      case "error":
        return "เกิดข้อผิดพลาดในการอัปโหลด";
      default:
        return "กำลังดำเนินการ...";
    }
  };

  const getStageSubtext = () => {
    switch (stage) {
      case "sending_data":
        return "📡 กำลังบันทึกรายละเอียดภารกิจไปยังฐานข้อมูล Google Sheets...";
      case "uploading_photos":
        return currentFileName
          ? `🖼️ กำลังประมวลผลไฟล์ "${currentFileName}"`
          : `🖼️ กำลังบีบอัดและอัปโหลดรูปภาพ ${files.length} รายการ`;
      case "success":
        return "✨ ข้อมูลภารกิจและรูปภาพทั้งหมดถูกบันทึกเข้าระบบเรียบร้อยแล้ว";
      case "error":
        return errorMessage || "❌ ไม่สามารถส่งข้อมูลได้ กรุณาลองใหม่อีกครั้ง";
      default:
        return "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 anim-fade-in">
      <div
        className={`w-full max-w-lg rounded-3xl p-7 relative overflow-hidden shadow-2xl transition-all border transform scale-100 anim-pop-in ${
          isError
            ? "bg-[#0f0507] border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.25)]"
            : isSuccess
            ? "bg-[#050f0b] border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.25)]"
            : "bg-[#090a12] border-cyan-500/40 shadow-[0_0_60px_rgba(6,182,212,0.25)]"
        }`}
      >
        {/* Top Decorative Neon Glows */}
        <div
          className={`absolute -top-24 -left-24 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
            isError
              ? "bg-red-600/30"
              : isSuccess
              ? "bg-emerald-500/30"
              : "bg-cyan-500/30"
          }`}
        />
        <div
          className={`absolute -bottom-24 -right-24 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
            isError
              ? "bg-rose-600/20"
              : isSuccess
              ? "bg-teal-500/20"
              : "bg-fuchsia-600/25"
          }`}
        />

        {/* Header Graphic Animation */}
        <div className="flex flex-col items-center justify-center mb-6 relative">
          <div className="relative w-28 h-28 flex items-center justify-center">
            {/* Outer Spinning Ring */}
            {!isSuccess && !isError && (
              <>
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-500/40 animate-spin [animation-duration:8s]" />
                <div className="absolute inset-2 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 border-r-fuchsia-500 animate-spin [animation-duration:2s]" />
              </>
            )}

            {isSuccess && (
              <div className="absolute inset-0 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 animate-pulse" />
            )}

            {isError && (
              <div className="absolute inset-0 rounded-full bg-red-500/10 border-2 border-red-500/40 animate-pulse" />
            )}

            {/* Center Icon */}
            <div
              className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-300 ${
                isError
                  ? "bg-red-950/80 text-red-400 border border-red-500/50 shadow-red-950/50"
                  : isSuccess
                  ? "bg-emerald-950/80 text-emerald-400 border border-emerald-500/50 shadow-emerald-950/50 scale-110"
                  : "bg-gray-900/90 text-cyan-400 border border-cyan-500/40 shadow-cyan-950/50"
              }`}
            >
              {isError ? (
                <AlertCircle size={42} className="animate-bounce" />
              ) : isSuccess ? (
                <ShieldCheck size={44} className="anim-pop-in text-emerald-400" />
              ) : (
                <UploadCloud size={40} className="animate-pulse text-cyan-400" />
              )}
            </div>
          </div>
        </div>

        {/* Title & Stage */}
        <div className="text-center mb-6 relative z-10">
          <h3
            className={`text-2xl font-black tracking-wide mb-1.5 ${
              isError
                ? "text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                : isSuccess
                ? "text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                : "text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-300 to-cyan-200 drop-shadow-[0_0_12px_rgba(6,182,212,0.4)]"
            }`}
          >
            {getStageTitle()}
          </h3>
          {missionName && (
            <p className="text-xs font-mono text-cyan-400/90 bg-cyan-950/40 border border-cyan-800/40 rounded-full px-3 py-1 inline-block mb-2 truncate max-w-[320px]">
              ภารกิจ: {missionName}
            </p>
          )}
          <p className="text-xs font-mono text-gray-400 mt-1 min-h-[20px]">
            {getStageSubtext()}
          </p>
        </div>

        {/* Progress Bar & Percentage */}
        {!isError && (
          <div className="mb-6 relative z-10 space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-gray-400 flex items-center gap-1.5">
                {!isSuccess && <Loader2 size={12} className="animate-spin text-cyan-400" />}
                {isSuccess ? "100% COMPLETE" : "UPLOADING PROCESS..."}
              </span>
              <span
                className={`font-bold font-mono text-base ${
                  isSuccess ? "text-emerald-400" : "text-cyan-400"
                }`}
              >
                {Math.round(progress)}%
              </span>
            </div>

            {/* Glowing Bar */}
            <div className="w-full h-3.5 bg-black/60 rounded-full p-0.5 border border-gray-800 shadow-inner overflow-hidden relative">
              <div
                className={`h-full rounded-full transition-all duration-300 relative overflow-hidden ${
                  isSuccess
                    ? "bg-gradient-to-r from-teal-500 to-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.8)]"
                    : "bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-emerald-400 shadow-[0_0_12px_rgba(6,182,212,0.8)]"
                }`}
                style={{ width: `${Math.max(5, Math.min(100, progress))}%` }}
              >
                {/* Shimmer sweep animation overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
              </div>
            </div>
          </div>
        )}

        {/* Thumbnail Previews if files exist */}
        {files.length > 0 && (
          <div className="mb-4 relative z-10">
            <p className="text-[11px] font-mono text-gray-400 mb-2 flex items-center justify-between">
              <span>รายการรูปภาพ ({files.length} รูป)</span>
              {totalFiles > 0 && <span>เตรียมพร้อมทั้งหมด {totalFiles} รูป</span>}
            </p>
            <div className="grid grid-cols-5 gap-2 max-h-[90px] overflow-y-auto p-2 bg-black/50 rounded-2xl border border-gray-800/80">
              {files.map((file, idx) => {
                const imgUrl = URL.createObjectURL(file);
                const stepThreshold = (idx + 1) * (100 / (files.length || 1));
                const isPhotoDone = isSuccess || progress >= stepThreshold;

                return (
                  <div
                    key={idx}
                    className={`relative aspect-square rounded-xl overflow-hidden border transition-all ${
                      isPhotoDone
                        ? "border-emerald-500/70 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                        : "border-cyan-500/40 animate-pulse"
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={file.name}
                      className="w-full h-full object-cover"
                      onLoad={() => URL.revokeObjectURL(imgUrl)}
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      {isPhotoDone ? (
                        <div className="bg-emerald-500/90 text-black rounded-full p-0.5 shadow-md anim-pop-in">
                          <CheckCircle2 size={14} className="stroke-[3]" />
                        </div>
                      ) : (
                        <Loader2 size={14} className="text-cyan-300 animate-spin" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Button for Error / Completion close */}
        {(isSuccess || isError) && onClose && (
          <div className="mt-6 pt-4 border-t border-gray-800/80 flex justify-center relative z-10">
            <button
              type="button"
              onClick={onClose}
              className={`w-full py-3.5 rounded-xl font-bold font-mono transition-all transform active:scale-95 shadow-lg ${
                isError
                  ? "bg-red-600 hover:bg-red-500 text-white shadow-red-900/40"
                  : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-black shadow-emerald-950/60"
              }`}
            >
              {isError ? "ปิดหน้าต่างและลองใหม่" : "ตกลง / ปิดหน้าต่าง"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
