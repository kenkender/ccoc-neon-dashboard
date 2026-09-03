"use client";

import { PenTool, List, Shield, Radio, Compass, Plane } from "lucide-react";
import PhotoUploadZone from "./PhotoUploadZone";

interface UavMissionFormProps {
  isDarkMode: boolean;
  currentUser: any;
  usersList: any[];
  formData: any;
  handleChange: (e: any) => void;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  uploadedFiles: File[];
  setUploadedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  onSubmit: (e: any) => void;
  isSubmitting: boolean;
  setShowMapOverlay: (show: boolean) => void;
  onSwitchFormType: (type: "CCOC Mobile" | "UAV Mobile") => void;
}

const PROVINCES = [
  "กทม.", "ชลบุรี", "ระยอง", "จันทบุรี", "ตราด", "ฉะเชิงเทรา", "ปราจีนบุรี", 
  "เชียงใหม่", "เชียงราย", "ภูเก็ต", "สุราษฎร์ธานี", "สงขลา", "ขอนแก่น", "นครราชสีมา",
  "อยุธยา", "เพชรบุรี", "ประจวบคีรีขันธ์"
];

const MISSION_TYPES = [
  "ว.10 ป้องกันเหตุ",
  "ว.43 สายตรวจโดรนมุมสูง",
  "ภารกิจถวายความปลอดภัย / VVIP",
  "การรักษาความปลอดภัยงานเทศกาล / คนหนาแน่น",
  "สนับสนุนคดีอาญา / สืบสวนปราบปราม",
  "ค้นหาและช่วยเหลือผู้ประสบภัย (SAR)",
  "บินตรวจการณ์พื้นที่เสี่ยง / จราจร"
];

const UNIT_OPTIONS = [
  // สังกัด บช.ทท. / ส่วนกลาง
  "บช.ทท.",

  // บก.ทท.1 (ภาคกลาง/ตะวันออก)
  "ส.ทท.1 กก.1 บก.ทท.1 (กรุงเทพเหนือ)",
  "ส.ทท.2 กก.1 บก.ทท.1 (กรุงเทพใต้)",
  "ส.ทท.3 กก.1 บก.ทท.1 (ธนบุรี)",
  "ส.ทท.1 กก.2 บก.ทท.1 (อยุธยา)",
  "ส.ทท.2 กก.2 บก.ทท.1 (ลพบุรี)",
  "ส.ทท.3 กก.2 บก.ทท.1 (สระแก้ว)",
  "ส.ทท.4 กก.2 บก.ทท.1 (ชลบุรี/พัทยา)",
  "ส.ทท.5 กก.2 บก.ทท.1 (ระยอง)",
  "ส.ทท.6 กก.2 บก.ทท.1 (ตราด)",

  // บก.ทท.2 (ภาคเหนือ/ตะวันออกเฉียงเหนือ)
  "ส.ทท.1 กก.1 บก.ทท.2 (ขอนแก่น)",
  "ส.ทท.2 กก.1 บก.ทท.2 (นครราชสีมา)",
  "ส.ทท.3 กก.1 บก.ทท.2 (อุบลราชธานี)",
  "ส.ทท.4 กก.1 บก.ทท.2 (นครพนม)",
  "ส.ทท.5 กก.1 บก.ทท.2 (อุดรธานี)",
  "ส.ทท.6 กก.1 บก.ทท.2 (เลย)",
  "ส.ทท.1 กก.2 บก.ทท.2 (เชียงใหม่)",
  "ส.ทท.2 กก.2 บก.ทท.2 (เชียงราย)",
  "ส.ทท.3 กก.2 บก.ทท.2 (น่าน)",
  "ส.ทท.4 กก.2 บก.ทท.2 (แม่ฮ่องสอน)",
  "ส.ทท.1 กก.3 บก.ทท.2 (พิษณุโลก)",
  "ส.ทท.2 กก.3 บก.ทท.2 (นครสวรรค์)",
  "ส.ทท.3 กก.3 บก.ทท.2 (ตาก)",

  // บก.ทท.3 (ภาคใต้/ตะวันตก)
  "ส.ทท.1 กก.1 บก.ทท.3 (กาญจนบุรี)",
  "ส.ทท.2 กก.1 บก.ทท.3 (ประจวบคีรีขันธ์/หัวหิน)",
  "ส.ทท.1 กก.2 บก.ทท.3 (ภูเก็ต)",
  "ส.ทท.2 กก.2 บก.ทท.3 (ระนอง)",
  "ส.ทท.3 กก.2 บก.ทท.3 (กระบี่)",
  "ส.ทท.4 กก.2 บก.ทท.3 (สุราษฎร์ธานี)",
  "ส.ทท.5 กก.2 บก.ทท.3 (เกาะสมุย)",
  "ส.ทท.1 กก.3 บก.ทท.3 (สงขลา/หาดใหญ่)",
  "ส.ทท.2 กก.3 บก.ทท.3 (ตรัง)",
  "ส.ทท.3 กก.3 บก.ทท.3 (นราธิวาส)"
];

const LIVESTREAM_OPTIONS = [
  "🟢 ถ่ายทอดสดสัญญาณภาพ (Live Stream) เข้าศูนย์ CCOC เรียบร้อย",
  "🔴 ไม่ได้ถ่ายทอดสด (บันทึกวิดีโอลง SD Card)"
];

const MANPOWER_OPTIONS = [
  "ทดแทนกำลังพล 5 นาย",
  "ทดแทนกำลังพล 10 นาย",
  "ทดแทนกำลังพล 15 นายในการสแกนมุมสูง",
  "ทดแทนกำลังพล 20+ นายในการลาดตระเวนพื้นที่กว้าง"
];

const DENSITY_OPTIONS = [
  "ปริมาณน้อย",
  "ปริมาณปานกลาง",
  "ปริมาณมาก",
  "หนาแน่นแออัด"
];

export default function UavMissionForm({
  isDarkMode,
  currentUser,
  usersList,
  formData,
  handleChange,
  setFormData,
  uploadedFiles,
  setUploadedFiles,
  onSubmit,
  isSubmitting,
  setShowMapOverlay,
  onSwitchFormType,
}: UavMissionFormProps) {
  return (
    <div className={`p-3 sm:p-5 rounded-3xl flex flex-col transition-all ${isDarkMode ? 'plate-3d-dark' : 'plate-3d-light'}`}>
      {/* Header & Control Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 mb-3 border-b border-white/10 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`p-2.5 rounded-2xl btn-3d shrink-0 ${isDarkMode ? 'btn-menu-dark text-cyan-400' : 'btn-menu-light text-cyan-600'}`}>
            <Plane size={20} className="animate-pulse" />
          </div>
          <div className="min-w-0">
            <h2 className={`text-base sm:text-lg lg:text-xl font-black truncate ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
              บันทึกภารกิจ UAV Mobile (สายตรวจโดรน)
            </h2>
            <p className="text-[11px] text-gray-400 font-mono truncate">ฟอร์มบันทึกตัวชี้วัดความคุ้มค่าและรายงานผู้บังคับบัญชา</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => onSwitchFormType("CCOC Mobile")}
            className={`text-xs font-bold px-3 py-2 rounded-xl btn-3d flex items-center gap-1.5 ${
              isDarkMode ? 'btn-menu-dark text-fuchsia-400' : 'btn-menu-light text-fuchsia-600'
            }`}
          >
            <PenTool size={13} /> <span className="hidden sm:inline">สลับไป</span>ฟอร์ม CCOC
          </button>
          
          <button
            type="button"
            onClick={() => setShowMapOverlay(true)}
            className={`text-xs font-bold px-3 py-2 rounded-xl btn-3d flex items-center gap-1.5 ${
              isDarkMode ? 'btn-menu-dark text-cyan-400' : 'btn-menu-light text-cyan-600'
            }`}
          >
            <List size={13} /> รายชื่อรถ
          </button>
        </div>
      </div>

      <form id="uav-mission-form" onSubmit={onSubmit} className="flex flex-col gap-3.5">
        {/* Section 1: หน่วยงานที่ปฏิบัติภารกิจ */}
        <div className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${isDarkMode ? 'bg-slate-900/60 border-cyan-900/30' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center gap-2 mb-2.5 text-cyan-400 font-bold text-xs sm:text-sm">
            <Shield size={15} /> <span>1. หน่วยงานที่ปฏิบัติภารกิจ</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {/* หน่วยงาน */}
            <div className="flex flex-col gap-1 min-w-0">
              <label className={`text-xs font-mono font-bold truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>หน่วยงานผู้ปฏิบัติ</label>
              <input
                required
                type="text"
                name="unit_name"
                value={formData.unit_name || ""}
                onChange={handleChange}
                list="unit-options-list"
                placeholder="ส.ทท.5 กก.2 บก.ทท.1 (ระยอง)"
                className={`py-2 px-3 rounded-xl text-xs sm:text-sm focus:outline-none transition-all w-full min-w-0 ${isDarkMode ? 'input-3d-dark text-white' : 'input-3d-light text-black'}`}
              />
              <datalist id="unit-options-list">
                {UNIT_OPTIONS.map((u, i) => <option key={i} value={u} />)}
              </datalist>
            </div>
          </div>
        </div>

        {/* Section 2: ข้อมูลภารกิจและสถานที่ */}
        <div className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${isDarkMode ? 'bg-slate-900/60 border-purple-900/30' : 'bg-purple-50/50 border-purple-200'}`}>
          <div className="flex items-center gap-2 mb-2.5 text-purple-400 font-bold text-xs sm:text-sm">
            <Compass size={15} /> <span>2. ข้อมูลภารกิจ วันเวลา และพิกัดสถานที่</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {/* รหัสภารกิจ / ประเภทภารกิจ */}
            <div className="flex flex-col gap-1 min-w-0 sm:col-span-2 xl:col-span-2">
              <label className={`text-xs font-mono font-bold truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>ชื่อภารกิจ / โค้ดการปฏิบัติ</label>
              <input
                required
                type="text"
                name="mission_name"
                value={formData.mission_name || ""}
                onChange={handleChange}
                list="mission-types-list"
                placeholder="ว.10 ป้องกันเหตุ Walking Street"
                className={`py-2 px-3 rounded-xl text-xs sm:text-sm focus:outline-none transition-all w-full min-w-0 ${isDarkMode ? 'input-3d-dark text-white' : 'input-3d-light text-black'}`}
              />
              <datalist id="mission-types-list">
                {MISSION_TYPES.map((m, i) => <option key={i} value={m} />)}
              </datalist>
            </div>

            {/* สถานที่ */}
            <div className="flex flex-col gap-1 min-w-0">
              <label className={`text-xs font-mono font-bold truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>สถานที่ปฏิบัติการ</label>
              <input
                required
                type="text"
                name="location"
                value={formData.location || ""}
                onChange={handleChange}
                placeholder="Walking Street พัทยา"
                className={`py-2 px-3 rounded-xl text-xs sm:text-sm focus:outline-none transition-all w-full min-w-0 ${isDarkMode ? 'input-3d-dark text-white' : 'input-3d-light text-black'}`}
              />
            </div>

            {/* จังหวัด */}
            <div className="flex flex-col gap-1 min-w-0">
              <label className={`text-xs font-mono font-bold truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>พิกัด / จังหวัด</label>
              <input
                required
                type="text"
                name="province"
                value={formData.province || ""}
                onChange={handleChange}
                list="province-list"
                placeholder="ชลบุรี"
                className={`py-2 px-3 rounded-xl text-xs sm:text-sm focus:outline-none transition-all w-full min-w-0 ${isDarkMode ? 'input-3d-dark text-white' : 'input-3d-light text-black'}`}
              />
              <datalist id="province-list">
                {PROVINCES.map((p, i) => <option key={i} value={p} />)}
              </datalist>
            </div>

            {/* วันที่เริ่มปฏิบัติการ */}
            <div className="flex flex-col gap-1 min-w-0">
              <label className={`text-xs font-mono font-bold truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>วันที่ปฏิบัติการ</label>
              <input
                required
                type="date"
                name="start_date"
                value={formData.start_date || ""}
                onChange={handleChange}
                className={`py-2 px-3 rounded-xl text-xs sm:text-sm focus:outline-none transition-all cursor-pointer w-full min-w-0 ${isDarkMode ? 'input-3d-dark text-white' : 'input-3d-light text-black'}`}
                style={{ colorScheme: isDarkMode ? "dark" : "light" }}
              />
            </div>

            {/* เวลาปฏิบัติการ */}
            <div className="flex flex-col gap-1 min-w-0">
              <label className={`text-xs font-mono font-bold truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>เวลาปฏิบัติการ</label>
              <input
                required
                type="text"
                name="start_time"
                value={formData.start_time || "21.00"}
                onChange={handleChange}
                placeholder="21.00 น."
                className={`py-2 px-3 rounded-xl text-xs sm:text-sm focus:outline-none transition-all w-full min-w-0 ${isDarkMode ? 'input-3d-dark text-white' : 'input-3d-light text-black'}`}
              />
            </div>

            {/* ความหนาแน่นนักท่องเที่ยว (Dropdown) */}
            <div className="flex flex-col gap-1 min-w-0">
              <label className={`text-xs font-mono font-bold truncate ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>ปริมาณนักท่องเที่ยวในพื้นที่</label>
              <select
                name="tourist_density"
                value={formData.tourist_density || "ปริมาณน้อย"}
                onChange={handleChange}
                className={`py-2 px-3 rounded-xl text-xs sm:text-sm focus:outline-none transition-all cursor-pointer w-full min-w-0 ${isDarkMode ? 'input-3d-dark text-white' : 'input-3d-light text-black'}`}
              >
                {DENSITY_OPTIONS.map((d, i) => <option key={i} value={d}>{d}</option>)}
              </select>
            </div>

            {/* จำนวนนักท่องเที่ยวโดยประมาณ (Text/Number Input) */}
            <div className="flex flex-col gap-1 min-w-0">
              <label className={`text-xs font-mono font-bold truncate ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>ระบุจำนวนโดยประมาณ (คน)</label>
              <input
                type="text"
                name="tourist_count_est"
                value={formData.tourist_count_est || ""}
                onChange={handleChange}
                placeholder="เช่น ~100-150 คน"
                className={`py-2 px-3 rounded-xl text-xs sm:text-sm focus:outline-none transition-all w-full min-w-0 ${isDarkMode ? 'input-3d-dark text-white' : 'input-3d-light text-black'}`}
              />
            </div>
          </div>
        </div>

        {/* Section 3: ข้อมูลเทคนิคการบินโดรน & ตัวชี้วัดความคุ้มค่า */}
        <div className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${isDarkMode ? 'bg-slate-900/60 border-emerald-900/30' : 'bg-emerald-50/50 border-emerald-200'}`}>
          <div className="flex items-center gap-2 mb-2.5 text-emerald-400 font-bold text-xs sm:text-sm">
            <Radio size={15} /> <span>3. ตัวชี้วัดความคุ้มค่าและเทคนิคการบิน (UAV Flight Metrics)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {/* อุปกรณ์โดรนที่ใช้ */}
            <div className="flex flex-col gap-1 min-w-0">
              <label className={`text-xs font-mono font-bold truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>รหัส/รุ่น อุปกรณ์โดรน</label>
              <input
                type="text"
                name="drone_id"
                value={formData.drone_id || "Drone-01"}
                onChange={handleChange}
                placeholder="Drone-01 (Mavic 3T)"
                className={`py-2 px-3 rounded-xl text-xs sm:text-sm focus:outline-none transition-all w-full min-w-0 ${isDarkMode ? 'input-3d-dark text-white' : 'input-3d-light text-black'}`}
              />
            </div>

            {/* จำนวนรอบบิน (Sorties) */}
            <div className="flex flex-col gap-1 min-w-0">
              <label className={`text-xs font-mono font-bold truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>จำนวนรอบบิน (Sorties)</label>
              <input
                type="number"
                name="sorties"
                value={formData.sorties || 1}
                onChange={handleChange}
                min={1}
                placeholder="1"
                className={`py-2 px-3 rounded-xl text-xs sm:text-sm focus:outline-none transition-all w-full min-w-0 ${isDarkMode ? 'input-3d-dark text-white' : 'input-3d-light text-black'}`}
              />
            </div>

            {/* เวลาบินรวม (นาที) */}
            <div className="flex flex-col gap-1 min-w-0">
              <label className={`text-xs font-mono font-bold truncate ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>เวลาบินรวม (นาที)</label>
              <input
                type="number"
                name="flight_duration_min"
                value={formData.flight_duration_min || 45}
                onChange={handleChange}
                placeholder="45"
                className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold focus:outline-none transition-all w-full min-w-0 ${isDarkMode ? 'input-3d-dark text-emerald-400' : 'input-3d-light text-emerald-600'}`}
              />
            </div>

            {/* พื้นที่ครอบคลุม */}
            <div className="flex flex-col gap-1 min-w-0">
              <label className={`text-xs font-mono font-bold truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>ระยะทาง/พื้นที่ครอบคลุม</label>
              <input
                type="text"
                name="coverage_detail"
                value={formData.coverage_detail || ""}
                onChange={handleChange}
                placeholder="ความยาว 1.2 กม."
                className={`py-2 px-3 rounded-xl text-xs sm:text-sm focus:outline-none transition-all w-full min-w-0 ${isDarkMode ? 'input-3d-dark text-white' : 'input-3d-light text-black'}`}
              />
            </div>

            {/* สถานะ Live Stream เข้า CCOC */}
            <div className="flex flex-col gap-1 min-w-0 sm:col-span-2 xl:col-span-2">
              <label className={`text-xs font-mono font-bold truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>การถ่ายทอดสดสัญญาณภาพ (Live Stream)</label>
              <select
                name="livestream_status"
                value={formData.livestream_status || LIVESTREAM_OPTIONS[0]}
                onChange={handleChange}
                className={`py-2 px-3 rounded-xl text-xs sm:text-sm focus:outline-none transition-all cursor-pointer w-full min-w-0 ${isDarkMode ? 'input-3d-dark text-white' : 'input-3d-light text-black'}`}
              >
                {LIVESTREAM_OPTIONS.map((l, i) => <option key={i} value={l}>{l}</option>)}
              </select>
            </div>

            {/* การประหยัดกำลังพล (Dropdown) */}
            <div className="flex flex-col gap-1 min-w-0 sm:col-span-2 xl:col-span-2">
              <label className={`text-xs font-mono font-bold truncate ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>ประมาณการประหยัดกำลังพล (Manpower Saved)</label>
              <select
                name="manpower_saved"
                value={formData.manpower_saved || MANPOWER_OPTIONS[2]}
                onChange={handleChange}
                className={`py-2 px-3 rounded-xl text-xs sm:text-sm focus:outline-none transition-all cursor-pointer w-full min-w-0 ${isDarkMode ? 'input-3d-dark text-white' : 'input-3d-light text-black'}`}
              >
                {MANPOWER_OPTIONS.map((m, i) => <option key={i} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: ผลการปฏิบัติและอัปโหลดรูปภาพ */}
        <div className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${isDarkMode ? 'bg-slate-950/40 border-purple-900/30' : 'bg-gray-50/50 border-gray-200'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* ผลการปฏิบัติ / เหตุการณ์ */}
            <div className="flex flex-col gap-1 min-w-0">
              <label className={`text-xs font-mono font-bold truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>ผลการปฏิบัติ / เหตุการณ์สำคัญที่พบ</label>
              <textarea
                name="incident_report"
                value={formData.incident_report || "เหตุการณ์ทั่วไปปกติ"}
                onChange={handleChange}
                placeholder="เหตุการณ์ทั่วไปปกติ..."
                className={`py-2 px-3 rounded-xl text-xs sm:text-sm focus:outline-none transition-all min-h-[75px] resize-none w-full min-w-0 ${isDarkMode ? 'input-3d-dark text-white' : 'input-3d-light text-black'}`}
              />
            </div>

            {/* หมายเหตุ */}
            <div className="flex flex-col gap-1 min-w-0">
              <label className={`text-xs font-mono font-bold truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>หมายเหตุเพิ่มเติม (ถ้ามี)</label>
              <textarea
                name="remark"
                value={formData.remark || ""}
                onChange={handleChange}
                placeholder="ระบุข้อเสนอแนะเพิ่มเติม..."
                className={`py-2 px-3 rounded-xl text-xs sm:text-sm focus:outline-none transition-all min-h-[75px] resize-none w-full min-w-0 ${isDarkMode ? 'input-3d-dark text-white' : 'input-3d-light text-black'}`}
              />
            </div>

            {/* Upload Zone */}
            <div className="md:col-span-2 mt-1">
              <PhotoUploadZone
                files={uploadedFiles}
                setFiles={setUploadedFiles}
                isDarkMode={isDarkMode}
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-1 flex justify-center">
          <button
            disabled={isSubmitting}
            type="submit"
            className="btn-3d btn-primary-3d px-8 sm:px-12 py-3.5 rounded-2xl font-bold text-sm sm:text-base tracking-widest w-full md:w-auto shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2.5"
          >
            <Plane size={18} />
            <span>{isSubmitting ? "กำลังส่งเข้าฐานข้อมูล UAV Mobile..." : "บันทึกภารกิจ UAV Mobile"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
