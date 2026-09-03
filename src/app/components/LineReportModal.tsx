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
    missionData.vehicle_type === "UAV Mobile";

  // 📝 สร้างข้อความรายงานผู้บังคับบัญชาแบบตำรวจ (LINE Report Format)
  const lineMessageText = isUav
    ? `${missionData.unit_name || "ส.ทท.5 กก.2 บก.ทท.1"}
เรียน ผู้บังคับบัญชา
🗓️  วันที่ ${formatDateThai(missionData.start_date)}
🕗  เวลา ${missionData.start_time || "ไม่ระบุ"} น.
👮‍♂️  ผู้ปฏิบัติ: ${missionData.operators || "สายตรวจอากาศยานไร้คนขับ"}
     ผู้ควบคุมการปฏิบัติ: ${missionData.commander || "พ.ต.ท.อภิชาติ จารุรักษ์"}
🟥  การปฏิบัติ: ${missionData.mission_name || "ว.10 ป้องกันเหตุ"}
📍  สถานที่: ${missionData.location || "ไม่ระบุ"} ${missionData.province ? `จ.${missionData.province}` : ""}
🛸  ข้อมูลการบิน UAV Mobile:
    - อุปกรณ์โดรน: ${missionData.drone_id || "Drone-01"} (${missionData.sorties || 1} รอบบิน / รวม ${missionData.flight_duration_min || 0} นาที)
    - พื้นที่ครอบคลุม: ${missionData.coverage_detail || "สแกนพื้นที่มุมสูง"}
    - สัญญาณภาพ: ${missionData.livestream_status || "ถ่ายทอดสดเข้าศูนย์ CCOC"}
🟦  ผลการปฏิบัติ: ${missionData.incident_report || "เหตุการณ์ทั่วไปปกติ"}
    - ความหนาแน่นนักท่องเที่ยว: ${missionData.tourist_density || "ปริมาณน้อย"} ${missionData.tourist_count_est ? `(${missionData.tourist_count_est})` : ""}
💡  ความคุ้มค่า/ผลสัมฤทธิ์: 
    - ${missionData.manpower_saved ? `ประมาณการประหยัดกำลังพล: ${missionData.manpower_saved}` : "ภาพมุมสูงช่วยประเมินสถานการณ์พื้นที่โดยรวมได้ทันที"}`
    : `${missionData.unit_name || "ส.ทท.5 กก.2 บก.ทท.1"}
เรียน ผู้บังคับบัญชา
🗓️  วันที่ ${formatDateThai(missionData.start_date)} ถึง ${formatDateThai(missionData.end_date)}
👮‍♂️  ผู้ปฏิบัติ: รถปฏิบัติการเคลื่อนที่ ${missionData.vehicle_id} (${missionData.unit_name})
🟥  การปฏิบัติ: ${missionData.mission_name || "ว.10 ป้องกันเหตุ"}
📍  สถานที่: ${missionData.province || "ไม่ระบุ"}
🚗  ระยะทางปฏิบัติงาน: ${missionData.distance_km || 0} กม. (รวม ${missionData.total_days || 1} วัน)
👥  จำนวนผู้ร่วมงาน: ${Number(missionData.people_per_day || 0).toLocaleString()} คน/วัน (รวม ${Number(missionData.people_total || 0).toLocaleString()} คน)
🟦  ผลการปฏิบัติ: ${missionData.incident_report || "เหตุการณ์ทั่วไปปกติ"}`;

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
