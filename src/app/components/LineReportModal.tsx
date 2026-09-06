"use client";

import { useState } from "react";
import { Check, Copy, MessageSquare, X } from "lucide-react";

interface LineReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  missionData: any;
  isDarkMode: boolean;
}

export default function LineReportModal({
  isOpen,
  onClose,
  missionData,
  isDarkMode,
}: LineReportModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !missionData) return null;

  // แปลงฟอร์แมตวันที่ให้สวยงามแบบไทย เช่น 2 ก.ย. 69
  const formatDateThai = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
        year: "2-digit",
      });
    } catch (e) {
      return dateStr;
    }
  };

  const isUav =
    String(missionData.vehicle_id || "").toLowerCase().includes("uav") ||
    String(missionData.vehicle_type || "").toLowerCase().includes("uav") ||
    Boolean(missionData.drone_id) ||
    Boolean(missionData.sorties);

  // 📝 สร้างข้อความรายงานผู้บังคับบัญชาแบบตำรวจ (LINE Report Format อ้างอิงหัวข้อฟอร์มล่าสุด)
  const lineMessageText = isUav
    ? `${missionData.unit_name || missionData.affiliation || "บช.ทท."}
เรียน ผู้บังคับบัญชา
🗓️  วันที่: ${formatDateThai(missionData.start_date)}
🕗  เวลา: ${missionData.start_time || "-"} น.
👮‍♂️  ผู้ปฏิบัติ: ${missionData.unit_name ? `${missionData.unit_name} (${missionData.raw_vehicle_id || missionData.vehicle_id || "UAV Mobile"})` : "สายตรวจอากาศยานไร้คนขับ"}
🟥  การปฏิบัติ: ${missionData.mission_name || "-"}
📍  สถานที่: ${missionData.location || missionData.province || "-"} ${missionData.province && missionData.location && missionData.location !== missionData.province ? `จ.${missionData.province}` : ""}
🚗  ระยะทางปฏิบัติภารกิจ (รวมไป-กลับ): ${(() => {
        const dist = missionData.distance_km || missionData.distance || missionData.km;
        if (!dist || dist === "-" || dist === "0") return "-";
        const distStr = String(dist).trim();
        return distStr.includes("กม") ? distStr : `${distStr} กม.`;
      })()}
👥  จำนวนนักท่องเที่ยวโดยประมาณ: ${(() => {
        const val = missionData.tourist_count_est || missionData.people_total || missionData.people_per_day || missionData.tourist_density;
        if (!val || val === "-") return "-";
        const str = String(val).trim();
        if (/^\d+$/.test(str)) return `${Number(str).toLocaleString()} คน`;
        return str.includes("คน") ? str : `${str} คน`;
      })()}
🛸  ข้อมูลการบิน UAV Mobile:
    - รหัส/รุ่นโดรน: ${missionData.drone_id || "-"} (${missionData.sorties || 1} รอบบิน / รวม ${missionData.flight_duration_min || 0} นาที)
    - รายละเอียดพื้นที่ปฏิบัติการ: ${missionData.coverage_detail || "-"}
🟦  ผลการปฏิบัติงาน: ${missionData.incident_report || "เหตุการณ์ทั่วไปปกติ"}${missionData.remark && missionData.remark !== "-" ? `\n💡  หมายเหตุ: ${missionData.remark}` : ""}`
    : `${missionData.unit_name || missionData.affiliation || "บช.ทท."}
เรียน ผู้บังคับบัญชา
🗓️  วันที่: ${formatDateThai(missionData.start_date)}${missionData.end_date ? ` ถึง ${formatDateThai(missionData.end_date)}` : ""}
👮‍♂️  ผู้ปฏิบัติ: รถปฏิบัติการเคลื่อนที่ ${missionData.vehicle_id} ${missionData.unit_name ? `(${missionData.unit_name})` : ""}
🟥  การปฏิบัติ: ${missionData.mission_name || "-"}
📍  สถานที่: ${missionData.location || ""} ${missionData.province ? `จ.${missionData.province}` : ""}
🚗  ระยะทางปฏิบัติงาน: ${(() => {
        const dist = missionData.distance_km || missionData.distance || missionData.km;
        if (!dist || dist === "-") return "0 กม.";
        const distStr = String(dist).trim();
        return distStr.includes("กม") ? distStr : `${distStr} กม.`;
      })()} ${missionData.total_days ? `(รวม ${missionData.total_days} วัน)` : ""}
👥  จำนวนผู้ร่วมงาน: ${Number(missionData.people_per_day || 0).toLocaleString()} คน/วัน ${missionData.people_total ? `(รวม ${Number(missionData.people_total || 0).toLocaleString()} คน)` : ""}
🟦  ผลการปฏิบัติงาน: ${missionData.incident_report || "เหตุการณ์ทั่วไปปกติ"}${missionData.remark && missionData.remark !== "-" ? `\n💡  หมายเหตุ: ${missionData.remark}` : ""}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(lineMessageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md anim-fade-in">
      <div
        className={`relative w-full max-w-lg p-6 rounded-3xl shadow-2xl transition-all border ${
          isDarkMode ? "plate-3d-dark text-white border-green-500/30" : "plate-3d-light text-gray-900 border-green-500/30"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/20 text-green-400 rounded-2xl border border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
              <MessageSquare size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold">รายงานผู้บังคับบัญชา (LINE)</h3>
              <p className="text-xs text-gray-400 font-mono">พร้อมส่งเข้ากลุ่มงานทันทีหลังบันทึกภารกิจ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl btn-3d ${
              isDarkMode ? "btn-menu-dark text-gray-400" : "btn-menu-light text-gray-600"
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Text Preview Area */}
        <div
          className={`p-4 rounded-2xl font-sans text-sm leading-relaxed whitespace-pre-wrap max-h-[350px] overflow-y-auto custom-scrollbar border ${
            isDarkMode
              ? "bg-slate-950/80 text-emerald-300 border-emerald-900/40 shadow-inner"
              : "bg-emerald-50/80 text-emerald-950 border-emerald-200"
          }`}
        >
          {lineMessageText}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-5 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className={`px-5 py-3 rounded-xl font-bold text-sm btn-3d ${
              isDarkMode ? "btn-menu-dark text-gray-300" : "btn-menu-light text-gray-700"
            }`}
          >
            ปิดหน้าต่าง
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 btn-3d transition-all ${
              copied
                ? "bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.6)]"
                : "bg-linear-to-r from-emerald-500 to-green-600 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)] hover:brightness-110"
            }`}
          >
            {copied ? (
              <>
                <Check size={18} /> คัดลอกสำเร็จแล้ว!
              </>
            ) : (
              <>
                <Copy size={18} /> คัดลอกข้อความรายงาน LINE
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
