"use client";

import React, { useState, useEffect } from "react";
import { Filter, Calendar, Car, Shield, Search, Download, Trash2, ChevronLeft, ChevronRight, X, Image as ImageIcon, Loader2, CheckSquare, Square } from "lucide-react";

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

const VEHICLE_NAMES: Record<string, string> = {
  "stc01": "1. stc01 บช.ทท.", "stc02": "2. stc02 ภูเก็ต", "stc03": "3. stc03 อยุธยา",
  "stc04": "4. stc04 ชลบุรี", "stc05": "5. stc05 โคราช", "stc06": "6. stc06 เชียงใหม่",
  "stc07": "7. stc07 พิษณุโลก", "stc08": "8. stc08 หัวหิน", "stc09": "9. stc09 สนามศุภชลาศัย",
  "stc10": "10. stc10 หาดใหญ่", "uav mobile": "11. UAV Mobile", "UAV Mobile": "11. UAV Mobile"
};

const VEHICLE_AFFILIATIONS: Record<string, string> = {
  "stc01": "บช.ทท.",
  "stc02": "บก.ทท.3",
  "stc03": "บก.ทท.1",
  "stc04": "บก.ทท.1",
  "stc05": "บก.ทท.2",
  "stc06": "บก.ทท.2",
  "stc07": "บก.ทท.2",
  "stc08": "บก.ทท.3",
  "stc09": "บก.ทท.1",
  "stc10": "บก.ทท.3",
  "UAV Mobile": "บช.ทท.",
};

interface MissionPhotoViewProps {
  missions: any[];
  currentUser: any;
  isDarkMode: boolean;
}

export default function MissionPhotoView({
  missions = [],
  currentUser,
  isDarkMode,
}: MissionPhotoViewProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  // Filters State
  const [filterVehicle, setFilterVehicle] = useState("ALL");
  const [filterAffiliation, setFilterAffiliation] = useState("ALL");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Select state for bulk actions
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // ไม่มี API Key ใน client — ใช้ Next.js API proxy แทน


  const fetchAllPhotos = async () => {

    try {
      setLoading(true);
      const res = await fetch(`/api/photos`, {
        headers: {
          "x-vehicle-id": currentUser?.vehicle_id || "",
        },
      });
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
    fetchAllPhotos();
  }, []);

  // Filter logic on client side (mapping to mission details)
  const getEnrichedPhotoDetails = (photo: Photo) => {
    const matchedMission = missions.find(
      (m) => m.timestamp === photo.mission_timestamp
    );
    const affiliation = matchedMission?.affiliation || VEHICLE_AFFILIATIONS[photo.vehicle_id] || "ไม่ระบุ";
    const missionName = matchedMission?.mission_name || photo.mission_name || "ไม่ระบุชื่อภารกิจ";
    const province = matchedMission?.province || "";
    return { affiliation, missionName, province };
  };

  const filteredPhotos = photos.filter((photo) => {
    const details = getEnrichedPhotoDetails(photo);

    // Filter by vehicle
    if (filterVehicle !== "ALL" && photo.vehicle_id.toLowerCase() !== filterVehicle.toLowerCase()) {
      return false;
    }

    // Filter by affiliation
    if (filterAffiliation !== "ALL" && details.affiliation !== filterAffiliation) {
      return false;
    }

    // Filter by date range
    if (filterStartDate && photo.date < filterStartDate) {
      return false;
    }
    if (filterEndDate && photo.date > filterEndDate) {
      return false;
    }

    // Filter by Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchMission = details.missionName.toLowerCase().includes(q);
      const matchVehicle = (VEHICLE_NAMES[photo.vehicle_id] || photo.vehicle_id).toLowerCase().includes(q);
      const matchProvince = details.province.toLowerCase().includes(q);
      if (!matchMission && !matchVehicle && !matchProvince) {
        return false;
      }
    }

    return true;
  });

  // Bulk selection handlers
  const toggleSelectPhoto = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPhotoIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedPhotoIds.length === filteredPhotos.length) {
      setSelectedPhotoIds([]);
    } else {
      setSelectedPhotoIds(filteredPhotos.map((p) => p.id));
    }
  };

  // Bulk ZIP Download
  const handleBulkDownload = async () => {
    if (selectedPhotoIds.length === 0) return;
    try {
      setIsDownloadingZip(true);
      const response = await fetch(`/api/photos/download`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: selectedPhotoIds }),
      });

      if (!response.ok) throw new Error("ZIP request failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CCOC_Photos_Export_${new Date().toISOString().split("T")[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      alert("❌ เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์ ZIP");
      console.error(err);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  // Single download
  const handleDownload = async (photo: Photo, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/photos/download/${photo.id}`);
      if (!response.ok) throw new Error("Download failed");

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
      alert("❌ ไม่สามารถดาวน์โหลดรูปภาพได้");
    }
  };

  // Delete handler
  const handleDelete = async (photo: Photo, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmDelete = window.confirm("⚠️ คุณแน่ใจหรือไม่ว่าต้องการลบรูปภาพนี้?");
    if (!confirmDelete) return;

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
        setSelectedPhotoIds((prev) => prev.filter((id) => id !== photo.id));
        if (lightboxIndex !== null) setLightboxIndex(null);
        alert("✅ ลบรูปภาพสำเร็จ");
      } else {
        alert(`❌ ${result.error || "เกิดข้อผิดพลาดในการลบ"}`);
      }
    } catch (err) {
      alert("❌ เกิดข้อผิดพลาดในการลบรูปภาพ");
    }
  };

  const canDelete = (photo: Photo) => {
    if (currentUser?.role === "admin") return true;
    return currentUser?.vehicle_id === photo.vehicle_id;
  };

  return (
    <div className={`w-full max-w-[96%] mx-auto h-[84vh] flex flex-col p-6 rounded-3xl anim-fade-in ${
      isDarkMode ? "plate-3d-dark" : "plate-3d-light"
    }`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 pb-4 border-b border-white/10 shrink-0">
        <h2 className={`text-3xl font-bold flex items-center gap-3 ${isDarkMode ? "text-cyan-400" : "text-cyan-600"}`}>
          <div className={`p-3 rounded-xl btn-3d ${isDarkMode ? "btn-menu-dark text-cyan-400" : "btn-menu-light text-cyan-600"}`}>
            <ImageIcon size={24} />
          </div>
          คลังภาพภารกิจรถโมบาย
        </h2>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-3 mt-4 lg:mt-0">
          {filteredPhotos.length > 0 && (
            <button
              onClick={toggleSelectAll}
              className={`text-xs font-bold px-4 py-2.5 rounded-xl btn-3d ${
                isDarkMode ? "btn-menu-dark text-gray-300" : "btn-menu-light text-gray-700"
              }`}
            >
              {selectedPhotoIds.length === filteredPhotos.length ? "🚫 ยกเลิกเลือกทั้งหมด" : "✅ เลือกทั้งหมด"}
            </button>
          )}

          <button
            disabled={selectedPhotoIds.length === 0 || isDownloadingZip}
            onClick={handleBulkDownload}
            className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl btn-3d transition-all ${
              selectedPhotoIds.length > 0
                ? "bg-linear-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                : "opacity-50 cursor-not-allowed text-gray-500 bg-gray-800/20"
            }`}
          >
            {isDownloadingZip ? (
              <>
                <Loader2 size={14} className="animate-spin" /> กำลังบีบอัด...
              </>
            ) : (
              <>
                <Download size={14} /> ดาวน์โหลด ZIP ({selectedPhotoIds.length} รูป)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className={`p-4 rounded-2xl mb-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 shrink-0 ${
        isDarkMode ? "bg-black/30 border border-purple-950/20" : "bg-gray-100 border border-gray-200"
      }`}>
        {/* Search */}
        <div className={`flex items-center gap-2 p-2 px-3 rounded-xl ${isDarkMode ? "input-3d-dark" : "input-3d-light"}`}>
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาภารกิจ / จังหวัด..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs focus:outline-none w-full"
          />
        </div>

        {/* Filter Vehicle */}
        <div className={`flex items-center gap-2 p-2 px-3 rounded-xl ${isDarkMode ? "input-3d-dark" : "input-3d-light"}`}>
          <Car size={16} className="text-purple-400" />
          <select
            value={filterVehicle}
            onChange={(e) => setFilterVehicle(e.target.value)}
            className="bg-transparent text-xs focus:outline-none w-full font-bold cursor-pointer"
          >
            <option value="ALL">เลือกรถ: ทั้งหมด</option>
            {Object.keys(VEHICLE_NAMES).map((k) => (
              <option key={k} value={k}>
                {VEHICLE_NAMES[k]}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Affiliation */}
        <div className={`flex items-center gap-2 p-2 px-3 rounded-xl ${isDarkMode ? "input-3d-dark" : "input-3d-light"}`}>
          <Shield size={16} className="text-orange-400" />
          <select
            value={filterAffiliation}
            onChange={(e) => setFilterAffiliation(e.target.value)}
            className="bg-transparent text-xs focus:outline-none w-full font-bold cursor-pointer"
          >
            <option value="ALL">เลือกสังกัด: ทั้งหมด</option>
            <option value="บช.ทท.">บช.ทท.</option>
            <option value="บก.ทท.1">บก.ทท.1</option>
            <option value="บก.ทท.2">บก.ทท.2</option>
            <option value="บก.ทท.3">บก.ทท.3</option>
          </select>
        </div>

        {/* Date Filter */}
        <div className={`flex items-center gap-2 p-2 px-3 rounded-xl col-span-1 sm:col-span-2 ${
          isDarkMode ? "input-3d-dark" : "input-3d-light"
        }`}>
          <Calendar size={16} className="text-cyan-400" />
          <input
            type="date"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
            className="bg-transparent text-xs focus:outline-none cursor-pointer w-full"
            style={{ colorScheme: isDarkMode ? "dark" : "light" }}
          />
          <span className="text-gray-500">-</span>
          <input
            type="date"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
            className="bg-transparent text-xs focus:outline-none cursor-pointer w-full"
            style={{ colorScheme: isDarkMode ? "dark" : "light" }}
          />
        </div>
      </div>

      {/* Main Grid View */}
      {loading ? (
        <div className="flex flex-col justify-center items-center flex-1">
          <Loader2 size={36} className="animate-spin text-cyan-400 mb-2" />
          <p className="text-cyan-400 font-mono tracking-widest animate-pulse text-sm">กำลังโหลดคลังภาพ...</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {filteredPhotos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 border border-dashed border-gray-700/50 rounded-2xl p-6">
              <ImageIcon size={32} className="text-gray-500 mb-2" />
              <p className="text-gray-400 text-sm font-bold">ไม่พบรูปภาพตามเงื่อนไขการค้นหา</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {filteredPhotos.map((photo, index) => {
                const details = getEnrichedPhotoDetails(photo);
                const isSelected = selectedPhotoIds.includes(photo.id);

                return (
                  <div
                    key={photo.id}
                    onClick={() => setLightboxIndex(index)}
                    className={`relative rounded-2xl overflow-hidden cursor-pointer border group flex flex-col transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 ${
                      isSelected
                        ? "border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)] bg-purple-950/10"
                        : isDarkMode
                        ? "border-gray-800 bg-gray-900/60"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    {/* Checkbox badge */}
                    <button
                      type="button"
                      onClick={(e) => toggleSelectPhoto(photo.id, e)}
                      className="absolute top-2.5 left-2.5 p-1 bg-black/60 hover:bg-black/80 rounded-md text-white z-10 transition-transform active:scale-90"
                    >
                      {isSelected ? (
                        <CheckSquare size={16} className="text-purple-400" />
                      ) : (
                        <Square size={16} className="text-gray-400" />
                      )}
                    </button>

                    {/* Image */}
                    <div className="aspect-square relative overflow-hidden bg-black/10">
                      <img
                        src={`/api/photos/${photo.id}?size=thumb`}
                        alt={photo.original_name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>

                    {/* Text Details */}
                    <div className="p-3 flex flex-col flex-1 gap-1 text-[11px] justify-between">
                      <p className={`font-bold line-clamp-2 leading-snug ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                        {details.missionName}
                      </p>
                      
                      <div className="flex justify-between items-center mt-2 border-t border-white/5 pt-1.5 font-mono text-[9px] text-gray-500">
                        <span className="bg-purple-950/40 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded uppercase font-bold">
                          {photo.vehicle_id}
                        </span>
                        <span>{photo.date}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Lightbox Modal (Duplicate logic to support navigation) */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4">
          <div className="absolute inset-0" onClick={() => setLightboxIndex(null)} />

          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 p-2 bg-gray-900/60 hover:bg-gray-800 text-white rounded-full transition-colors z-50"
          >
            <X size={24} />
          </button>

          {filteredPhotos.length > 1 && (
            <>
              <button
                onClick={() => setLightboxIndex((prev) => (prev! - 1 + filteredPhotos.length) % filteredPhotos.length)}
                className="absolute left-4 p-2 bg-gray-900/60 hover:bg-gray-800 text-white rounded-full transition-colors z-50"
              >
                <ChevronLeft size={28} />
              </button>
              <button
                onClick={() => setLightboxIndex((prev) => (prev! + 1) % filteredPhotos.length)}
                className="absolute right-4 p-2 bg-gray-900/60 hover:bg-gray-800 text-white rounded-full transition-colors z-50"
              >
                <ChevronRight size={28} />
              </button>
            </>
          )}

          <div className="relative max-w-4xl max-h-[80vh] w-full flex flex-col items-center justify-center z-40">
            <img
              src={`/api/photos/${filteredPhotos[lightboxIndex].id}?size=full`}
              alt={filteredPhotos[lightboxIndex].original_name}
              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl border border-gray-800"
            />

            {/* Bottom info bar */}
            <div className="w-full max-w-2xl bg-gray-900/90 text-white p-4 rounded-xl mt-4 border border-gray-800 flex justify-between items-center">
              <div className="flex flex-col gap-0.5 max-w-md">
                <span className="text-sm font-bold truncate">
                  {getEnrichedPhotoDetails(filteredPhotos[lightboxIndex]).missionName}
                </span>
                <span className="text-[11px] text-gray-400 font-mono">
                  {filteredPhotos[lightboxIndex].vehicle_id.toUpperCase()} • {getEnrichedPhotoDetails(filteredPhotos[lightboxIndex]).affiliation} • {new Date(filteredPhotos[lightboxIndex].uploaded_at).toLocaleString("th-TH")}
                </span>
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  onClick={(e) => handleDownload(filteredPhotos[lightboxIndex], e)}
                  className="flex items-center gap-1 bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
                >
                  <Download size={14} /> ดาวน์โหลด
                </button>
                {canDelete(filteredPhotos[lightboxIndex]) && (
                  <button
                    onClick={(e) => handleDelete(filteredPhotos[lightboxIndex], e)}
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
