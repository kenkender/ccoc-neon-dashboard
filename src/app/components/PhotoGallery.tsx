"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, Download, Trash2, Image as ImageIcon, Loader2 } from "lucide-react";
import { usePopup } from "./PopupContext";

interface Photo {
  id: string;
  vehicle_id: string;
  mission_timestamp: string;
  mission_name: string;
  date: string;
  original_name: string;
  full_file: string;
  thumb_file: string;
  full_size_bytes: number;
  thumb_size_bytes: number;
  uploaded_at: string;
}

interface PhotoGalleryProps {
  missionTimestamp: string;
  currentUser: any;
  isDarkMode: boolean;
}

export default function PhotoGallery({
  missionTimestamp,
  currentUser,
  isDarkMode,
}: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const { showConfirm, showNotification } = usePopup();

  // ไม่มี API Key ใน client — ใช้ Next.js API proxy แทน

  const fetchPhotos = async () => {
    if (!missionTimestamp) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        `/api/photos${missionTimestamp ? `?mission_timestamp=${encodeURIComponent(missionTimestamp)}` : ''}`,
        {
          headers: {
            "x-vehicle-id": currentUser?.vehicle_id || "",
          },
        }
      );
      const result = await res.json();
      if (result.success) {
        setPhotos(result.photos || []);
      }
    } catch (err) {
      console.error("❌ Error fetching photos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, [missionTimestamp]);

  const handleDelete = async (photo: Photo, e: React.MouseEvent) => {
    e.stopPropagation();
    showConfirm({
      title: "ยืนยันการลบรูปภาพ",
      message: "คุณแน่ใจหรือไม่ว่าต้องการลบรูปภาพนี้ออกจากระบบ?\n(การลบจะไม่สามารถกู้คืนได้)",
      isDanger: true,
      confirmText: "ยืนยันลบรูปภาพ",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/photos/${photo.id}`, {
            method: "DELETE",
            headers: {
              "x-vehicle-id": currentUser?.vehicle_id || "",
            },
          });
          const result = await res.json();
          if (result.success) {
            setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
            if (lightboxIndex !== null) {
              setLightboxIndex(null);
            }
            showNotification({
              type: "success",
              title: "ลบรูปภาพสำเร็จ",
              message: "ลบรูปภาพออกจากระบบเรียบร้อยแล้ว",
            });
          } else {
            showNotification({
              type: "error",
              title: "ลบรูปภาพไม่สำเร็จ",
              message: result.error || "เกิดข้อผิดพลาดในการลบรูปภาพ",
            });
          }
        } catch (err) {
          showNotification({
            type: "error",
            title: "การเชื่อมต่อล้มเหลว",
            message: "เกิดข้อผิดพลาดในการเชื่อมต่อเพื่อลบรูปภาพ",
          });
          console.error(err);
        }
      },
    });
  };

  const handleDownload = async (photo: Photo, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/photos/download/${photo.id}`);
      if (!response.ok) throw new Error("Network response was not ok");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CCOC_${photo.vehicle_id}_${photo.id.substring(0, 8)}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      showNotification({
        type: "error",
        title: "ดาวน์โหลดไม่สำเร็จ",
        message: "ไม่สามารถดาวน์โหลดรูปภาพได้",
      });
      console.error(err);
    }
  };

  const nextImage = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => (prev! + 1) % photos.length);
  };

  const prevImage = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => (prev! - 1 + photos.length) % photos.length);
  };

  // Check delete permission
  const canDelete = (photo: Photo) => {
    if (currentUser?.role === "admin") return true;
    return currentUser?.vehicle_id === photo.vehicle_id;
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs py-4 text-gray-500 font-mono">
        <Loader2 size={16} className="animate-spin text-purple-500" />
        กำลังโหลดรูปภาพภารกิจ...
      </div>
    );
  }

  if (photos.length === 0) return null;

  return (
    <div className="w-full flex flex-col gap-2 mt-4">
      <h4 className={`text-xs font-bold font-mono uppercase tracking-wider ${isDarkMode ? "text-purple-400" : "text-purple-700"}`}>
        📸 รูปภาพประกอบภารกิจ ({photos.length} รูป)
      </h4>

      {/* Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            onClick={() => setLightboxIndex(index)}
            className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border group transition-all duration-300 hover:scale-[1.03] ${
              isDarkMode 
                ? "border-gray-800 hover:border-purple-500/50 bg-black/40" 
                : "border-gray-200 hover:border-purple-500/50 bg-white"
            }`}
          >
            <img
            src={`/api/photos/${photo.id}?size=thumb`}
              alt={photo.original_name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* Quick delete on hover */}
            {canDelete(photo) && (
              <button
                type="button"
                onClick={(e) => handleDelete(photo, e)}
                className="absolute top-1 right-1 p-1 bg-red-600/80 hover:bg-red-700 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4">
          {/* Close Area */}
          <div className="absolute inset-0 cursor-default" onClick={() => setLightboxIndex(null)} />

          {/* Lightbox controls */}
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 p-2 bg-gray-900/60 hover:bg-gray-800 text-white rounded-full transition-colors z-50"
          >
            <X size={24} />
          </button>

          {photos.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 p-2 bg-gray-900/60 hover:bg-gray-800 text-white rounded-full transition-colors z-50"
              >
                <ChevronLeft size={28} />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 p-2 bg-gray-900/60 hover:bg-gray-800 text-white rounded-full transition-colors z-50"
              >
                <ChevronRight size={28} />
              </button>
            </>
          )}

          {/* Content container */}
          <div className="relative max-w-4xl max-h-[80vh] w-full flex flex-col items-center justify-center z-40">
            <img
              src={`/api/photos/${photos[lightboxIndex].id}?size=full`}
              alt={photos[lightboxIndex].original_name}
              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl border border-gray-800"
            />

            {/* Bottom info bar */}
            <div className="w-full max-w-2xl bg-gray-900/90 text-white p-4 rounded-xl mt-4 border border-gray-800 flex justify-between items-center">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-bold truncate max-w-sm">
                  {photos[lightboxIndex].mission_name || "ไม่มีชื่อภารกิจ"}
                </span>
                <span className="text-[11px] text-gray-400 font-mono">
                  {photos[lightboxIndex].vehicle_id.toUpperCase()} • {new Date(photos[lightboxIndex].uploaded_at).toLocaleString("th-TH")}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={(e) => handleDownload(photos[lightboxIndex], e)}
                  className="flex items-center gap-1 bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
                >
                  <Download size={14} /> ดาวน์โหลด
                </button>
                {canDelete(photos[lightboxIndex]) && (
                  <button
                    onClick={(e) => handleDelete(photos[lightboxIndex], e)}
                    className="flex items-center gap-1 bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
                  >
                    <Trash2 size={14} /> ลบรูป
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
