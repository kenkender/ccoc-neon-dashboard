"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, X, FileImage } from "lucide-react";
import { usePopup } from "./PopupContext";

interface PhotoUploadZoneProps {
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
  isDarkMode: boolean;
  maxFiles?: number;
}

export default function PhotoUploadZone({
  files,
  setFiles,
  isDarkMode,
  maxFiles = 5,
}: PhotoUploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showNotification } = usePopup();

  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif"];
  const maxSizeBytes = 20 * 1024 * 1024; // 20MB

  const handleFiles = (incomingFiles: FileList | null) => {
    if (!incomingFiles) return;

    const validFiles: File[] = [];
    const currentTotal = files.length;
    let limitExceeded = false;

    Array.from(incomingFiles).forEach((file, index) => {
      if (currentTotal + validFiles.length >= maxFiles) {
        limitExceeded = true;
        return;
      }

      // Check file type
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
      const isAllowedType = allowedTypes.includes(file.type) || 
        [".heic", ".heif", ".jpg", ".jpeg", ".png", ".webp"].includes(fileExtension);

      if (!isAllowedType) {
        showNotification({
          type: "warning",
          title: "รูปแบบไฟล์ไม่รองรับ",
          message: `ไฟล์ "${file.name}" ไม่ใช่รูปภาพที่รองรับ`,
          details: ["ชนิดไฟล์ที่รองรับ: JPG, JPEG, PNG, WEBP, HEIC"],
        });
        return;
      }

      // Check file size
      if (file.size > maxSizeBytes) {
        showNotification({
          type: "warning",
          title: "ไฟล์มีขนาดใหญ่เกินกำหนด",
          message: `ไฟล์ "${file.name}" มีขนาดใหญ่เกินไป (${(file.size / 1024 / 1024).toFixed(1)}MB)`,
          details: ["จำกัดขนาดไฟล์ไม่เกิน 20MB ต่อรูปภาพ"],
        });
        return;
      }

      validFiles.push(file);
    });

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles]);
    }

    if (limitExceeded) {
      showNotification({
        type: "warning",
        title: "จำนวนไฟล์เกินกำหนด",
        message: `อัปโหลดรูปภาพได้สูงสุดไม่เกิน ${maxFiles} รูปภาพต่อภารกิจ`,
      });
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (indexToRemove: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full h-full flex flex-col gap-1.5 min-h-0">
      <label className={`text-base font-mono font-bold shrink-0 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
        9. อัปโหลดรูปภาพประกอบภารกิจ (อย่างน้อย 2 รูป ไม่เกิน 5 รูปครับ)
      </label>

      {/* Drag & Drop Area */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={`border-2 border-dashed rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 flex-1 min-h-0 ${
          isDragActive
            ? "border-fuchsia-500 bg-fuchsia-500/10 shadow-[0_0_10px_rgba(217,70,239,0.2)]"
            : isDarkMode
            ? "border-gray-700 hover:border-purple-500 hover:bg-purple-950/5 input-3d-dark"
            : "border-gray-300 hover:border-purple-500 hover:bg-purple-50 input-3d-light"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.heic,.heif"
          onChange={handleFileChange}
          className="hidden"
        />
        <UploadCloud
          size={24}
          className={`mb-1 animate-bounce ${isDarkMode ? "text-purple-400" : "text-purple-600"}`}
        />
        <p className={`text-[11px] font-bold text-center ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
          ลากไฟล์รูปภาพมาวางที่นี่ หรือ <span className="text-fuchsia-500 underline">คลิกเพื่อเลือกไฟล์</span>
        </p>
        <p className={`text-[9px] mt-0.5 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
          รองรับ JPG, JPEG, PNG, WEBP, HEIC (บีบอัดอัตโนมัติ)
        </p>
      </div>

      {/* Previews */}
      {files.length > 0 && (
        <div
          className={`p-2 rounded-xl grid grid-cols-5 gap-2 max-h-[110px] overflow-y-auto custom-scrollbar ${
            isDarkMode ? "bg-black/30 border border-purple-950/30" : "bg-gray-100 border border-gray-200"
          }`}
        >
          {files.map((file, idx) => {
            const url = URL.createObjectURL(file);
            return (
              <div
                key={idx}
                className="relative group aspect-square rounded-xl overflow-hidden border border-gray-700/50 shadow-md transition-all hover:scale-[1.05]"
              >
                <img
                  src={url}
                  alt={`preview-${idx}`}
                  className="w-full h-full object-cover"
                  onLoad={() => URL.revokeObjectURL(url)}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(idx);
                  }}
                  className="absolute top-1.5 right-1.5 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg"
                >
                  <X size={12} />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[9px] text-gray-200 truncate p-1 font-mono text-center">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
