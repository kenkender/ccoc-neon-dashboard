"use client";

import { useState, useEffect, startTransition, memo } from "react";
import { PenTool, List, Shield, Radio, Compass, Plane, Lock, Plus, Trash2 } from "lucide-react";
import PhotoUploadZone from "./PhotoUploadZone";
import { VEHICLE_UNIT_MAP } from "@/app/data/users";

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

const DRONE_MODELS = [
  "DJI Matrice 4T",
  "DJI Matrice 4E",
  "DJI Air 3s"
];

const DENSITY_OPTIONS = [
  "ปริมาณน้อย",
  "ปริมาณปานกลาง",
  "ปริมาณมาก",
  "หนาแน่นแออัด"
];

interface DroneEntry {
  drone_id: string;
  custom_model?: string;
  sorties: number;
  flight_duration_min: number;
  coverage_detail: string;
}

export { VEHICLE_UNIT_MAP };

const resolveSpecificUnitName = (user: any, formUnit: string, usersList: any[]) => {
  const isGeneric = (str: string) => !str || ["บช.ทท.", "บก.ทท.1", "บก.ทท.2", "บก.ทท.3", "ALL", "ADMIN"].includes(str.trim());

  if (user?.unit_name && !isGeneric(user.unit_name)) {
    return user.unit_name;
  }

  const vId = String(user?.vehicle_id || user?.username || "").trim().toLowerCase();
  if (VEHICLE_UNIT_MAP[vId]) {
    return VEHICLE_UNIT_MAP[vId];
  }

  const foundUser = usersList?.find((u: any) => String(u.username || "").trim().toLowerCase() === vId);
  if (foundUser?.unit_name && !isGeneric(foundUser.unit_name)) {
    return foundUser.unit_name;
  }

  if (formUnit && !isGeneric(formUnit)) {
    return formUnit;
  }

  if (user?.affiliation === "บก.ทท.1") return "ส.ทท.4 กก.2 บก.ทท.1 (ชลบุรี/พัทยา)";
  if (user?.affiliation === "บก.ทท.2") return "ส.ทท.1 กก.2 บก.ทท.2 (เชียงใหม่)";
  if (user?.affiliation === "บก.ทท.3") return "ส.ทท.1 กก.2 บก.ทท.3 (ภูเก็ต)";

  return user?.affiliation || "ฝอ.6 บก.อก.บช.ทท.";
};

function UavMissionForm({
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
  // ล็อคหน่วยงานอัตโนมัติตามชื่อสถานีจริงของผู้ใช้งานที่ล็อกอินเข้ามา
  const lockedUnitName = resolveSpecificUnitName(currentUser, formData.unit_name, usersList);

  // ⚡ High-performance local state สำหรับตอบสนองการพิมพ์ทันที 0ms
  const [localForm, setLocalForm] = useState<any>({
    mission_name: formData.mission_name || "",
    location: formData.location || "",
    province: formData.province || "",
    start_date: formData.start_date || "",
    start_time: formData.start_time ?? "21.00",
    tourist_density: formData.tourist_density || "ปริมาณน้อย",
    tourist_count_est: formData.tourist_count_est || "",
    distance_km: formData.distance_km || "",
    incident_report: formData.incident_report || "",
    remark: formData.remark || "",
  });

  // Sync Local State เมื่อ formData หลักมีการเปลี่ยนแปลงจากภายนอก (เช่น กดแก้ไข หรือ รีเซ็ต)
  useEffect(() => {
    setLocalForm((prev: any) => {
      let changed = false;
      const next = { ...prev };
      const keys = ["mission_name", "location", "province", "start_date", "start_time", "tourist_density", "tourist_count_est", "distance_km", "incident_report", "remark"];
      for (const key of keys) {
        if (formData[key] !== undefined && formData[key] !== prev[key]) {
          next[key] = formData[key];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [
    formData.mission_name,
    formData.location,
    formData.province,
    formData.start_date,
    formData.start_time,
    formData.tourist_density,
    formData.tourist_count_est,
    formData.distance_km,
    formData.incident_report,
    formData.remark
  ]);

  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // 1. อัปเดต Local State ทันที (พิมพ์ได้รวดเร็วทันใจ 0ms)
    setLocalForm((prev: any) => ({ ...prev, [name]: value }));
    // 2. ส่งข้อมูลไปอัปเดต State หลักแบบ Non-blocking Background Transition
    const fieldName = name;
    const fieldValue = value;
    startTransition(() => {
      setFormData((prev: any) => ({ ...prev, [fieldName]: fieldValue }));
    });
  };

  // State สำหรับแพทเทิร์นกรอกซ้ำโดรน (Repeatable Flight Metrics Entries - รองรับสูงสุด 3-4 ชุด)
  const [droneEntries, setDroneEntries] = useState<DroneEntry[]>([
    {
      drone_id: "DJI Matrice 4T",
      sorties: 1,
      flight_duration_min: 45,
      coverage_detail: ""
    }
  ]);

  // Sync ยอดรวมของโดรนทั้งหมดเข้าสู่ formData หลัก (เพิ่มการตรวจเช็คเพื่อป้องกัน Re-render ซ้ำและอาการพิมพ์แล้วหน่วง)
  useEffect(() => {
    const activeModels = droneEntries.map(d => d.drone_id === "อื่นๆ" ? (d.custom_model || "โดรนทั่วไป") : d.drone_id);
    const combinedDroneIds = activeModels.join(", ");
    const totalSorties = droneEntries.reduce((sum, d) => sum + Number(d.sorties || 0), 0);
    const totalFlightMins = droneEntries.reduce((sum, d) => sum + Number(d.flight_duration_min || 0), 0);
    const combinedCoverage = droneEntries.map(d => d.coverage_detail).filter(Boolean).join(" | ");

    setFormData((prev: any) => {
      if (
        prev.unit_name === lockedUnitName &&
        prev.drone_id === combinedDroneIds &&
        prev.sorties === totalSorties &&
        prev.flight_duration_min === totalFlightMins &&
        prev.coverage_detail === combinedCoverage
      ) {
        return prev;
      }
      return {
        ...prev,
        unit_name: lockedUnitName,
        drone_id: combinedDroneIds,
        sorties: totalSorties,
        flight_duration_min: totalFlightMins,
        coverage_detail: combinedCoverage
      };
    });
  }, [droneEntries, lockedUnitName, setFormData]);

  const addDroneEntry = () => {
    if (droneEntries.length >= 4) return;
    // สลับรุ่นโดรนตามลำดับเพื่อความสะดวก
    const nextModel = DRONE_MODELS[droneEntries.length % DRONE_MODELS.length] || "DJI Matrice 4T";
    setDroneEntries(prev => [
      ...prev,
      {
        drone_id: nextModel,
        sorties: 1,
        flight_duration_min: 45,
        coverage_detail: ""
      }
    ]);
  };

  const removeDroneEntry = (index: number) => {
    if (droneEntries.length <= 1) return;
    setDroneEntries(prev => prev.filter((_, i) => i !== index));
  };

  const updateDroneEntry = (index: number, field: keyof DroneEntry, value: any) => {
    setDroneEntries(prev => prev.map((entry, i) => {
      if (i === index) {
        return { ...entry, [field]: value };
      }
      return entry;
    }));
  };

  const totalSorties = droneEntries.reduce((s, d) => s + Number(d.sorties || 0), 0);
  const totalFlightMins = droneEntries.reduce((s, d) => s + Number(d.flight_duration_min || 0), 0);

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
        {/* Section 1: หน่วยงานที่ปฏิบัติภารกิจ (แบบล็อคช่องกรอกเรียบร้อยแล้ว) */}
        <div className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${isDarkMode ? 'bg-slate-900/60 border-cyan-900/30' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs sm:text-sm">
              <Shield size={15} /> <span>1. หน่วยงานที่ปฏิบัติภารกิจ</span>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-[11px] text-cyan-400 font-mono">
              <Lock size={12} /> <span>ระบบล็อคหน่วยงานอัตโนมัติ</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {/* หน่วยงาน - ล็อคไม่ให้แก้ไข */}
            <div className="flex flex-col gap-1 min-w-0">
              <label className={`text-xs font-mono font-bold truncate flex items-center gap-1.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <span>หน่วยงานผู้ปฏิบัติ (ประจำรถ/ผู้ใช้งาน)</span>
              </label>
              <div className="relative flex items-center">
                <input
                  readOnly
                  type="text"
                  name="unit_name"
                  value={lockedUnitName}
                  className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold w-full min-w-0 cursor-not-allowed border ${
                    isDarkMode 
                      ? 'bg-slate-950/80 text-cyan-400 border-cyan-500/40 shadow-[inset_0_0_10px_rgba(6,182,212,0.1)]' 
                      : 'bg-slate-200 text-cyan-800 border-cyan-300'
                  }`}
                />
                <Lock size={16} className="absolute right-3.5 text-cyan-500/70" />
              </div>
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
                value={localForm.mission_name || ""}
                onChange={handleLocalChange}
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
                value={localForm.location || ""}
                onChange={handleLocalChange}
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
                value={localForm.province || ""}
                onChange={handleLocalChange}
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
                value={localForm.start_date || ""}
                onChange={handleLocalChange}
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
                value={localForm.start_time ?? ""}
                onChange={handleLocalChange}
                placeholder="เช่น 21.00 น."
                className={`py-2 px-3 rounded-xl text-xs sm:text-sm focus:outline-none transition-all w-full min-w-0 ${isDarkMode ? 'input-3d-dark text-white' : 'input-3d-light text-black'}`}
              />
            </div>

            {/* ความหนาแน่นนักท่องเที่ยว (Dropdown) */}
            <div className="flex flex-col gap-1 min-w-0">
              <label className={`text-xs font-mono font-bold truncate ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>ปริมาณนักท่องเที่ยวในพื้นที่</label>
              <select
                name="tourist_density"
                value={localForm.tourist_density || "ปริมาณน้อย"}
                onChange={handleLocalChange}
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
                value={localForm.tourist_count_est || ""}
                onChange={handleLocalChange}
                placeholder="เช่น ~100-150 คน"
                className={`py-2 px-3 rounded-xl text-xs sm:text-sm focus:outline-none transition-all w-full min-w-0 ${isDarkMode ? 'input-3d-dark text-white' : 'input-3d-light text-black'}`}
              />
            </div>

            {/* ระยะทางที่ออกปฏิบัติภารกิจ (รวมไป-กลับ) */}
            <div className="flex flex-col gap-1 min-w-0">
              <label className={`text-xs font-mono font-bold leading-tight ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>ระยะทางที่ออกปฏิบัติภารกิจ รวมไป-กลับ กม.</label>
              <input
                type="text"
                name="distance_km"
                value={localForm.distance_km || ""}
                onChange={handleLocalChange}
                placeholder="เช่น 25 กม."
                className={`py-2 px-3 rounded-xl text-xs sm:text-sm focus:outline-none transition-all w-full min-w-0 ${isDarkMode ? 'input-3d-dark text-white' : 'input-3d-light text-black'}`}
              />
            </div>
          </div>
        </div>

        {/* Section 3: ข้อมูลเทคนิคการบินโดรน & ตัวชี้วัดความคุ้มค่า (เพิ่มการกรอกซ้ำ 3-4 รูปแบบ + Dropdown รุ่นโดรน) */}
        <div className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${isDarkMode ? 'bg-slate-900/60 border-emerald-900/30' : 'bg-emerald-50/50 border-emerald-200'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs sm:text-sm">
              <Radio size={15} /> <span>3. ตัวชี้วัดความคุ้มค่าและเทคนิคการบิน (UAV Flight Metrics)</span>
            </div>
            
            <button
              type="button"
              onClick={addDroneEntry}
              disabled={droneEntries.length >= 4}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl btn-3d flex items-center gap-1.5 self-start sm:self-auto ${
                droneEntries.length >= 4 
                  ? 'opacity-40 cursor-not-allowed bg-gray-800 text-gray-500' 
                  : isDarkMode ? 'btn-menu-dark text-emerald-400 border-emerald-500/40 hover:border-emerald-400' : 'btn-menu-light text-emerald-600'
              }`}
            >
              <Plus size={14} /> <span>เพิ่มรูปแบบการกรอกโดรน ({droneEntries.length}/4)</span>
            </button>
          </div>

          {/* รายการรูปแบบกรอกโดรน (Repeatable Cards) */}
          <div className="flex flex-col gap-3">
            {droneEntries.map((entry, index) => (
              <div 
                key={index}
                className={`p-3 sm:p-3.5 rounded-xl border relative transition-all ${
                  isDarkMode 
                    ? 'bg-slate-950/60 border-emerald-500/20 shadow-[inset_0_0_15px_rgba(16,185,129,0.03)]' 
                    : 'bg-white border-emerald-200 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    รายการที่ #{index + 1}
                  </span>
                  {droneEntries.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDroneEntry(index)}
                      className="p-1 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all"
                      title="ลบรายการนี้"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                  {/* รุ่นอุปกรณ์โดรน (Dropdown แบบ 3 รุ่นตามที่ผู้ใช้กำหนด) */}
                  <div className="flex flex-col gap-1 min-w-0">
                    <label className={`text-xs font-mono font-bold truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>รุ่นอุปกรณ์โดรน</label>
                    <select
                      value={entry.drone_id}
                      onChange={(e) => updateDroneEntry(index, 'drone_id', e.target.value)}
                      className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold focus:outline-none transition-all cursor-pointer w-full min-w-0 ${
                        isDarkMode ? 'input-3d-dark text-emerald-400 border-emerald-500/30' : 'input-3d-light text-emerald-700'
                      }`}
                    >
                      {DRONE_MODELS.map((model) => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                      <option value="อื่นๆ">อื่นๆ (ระบุ...)</option>
                    </select>

                    {entry.drone_id === "อื่นๆ" && (
                      <input
                        type="text"
                        placeholder="ระบุรุ่นโดรนเพิ่มเติม..."
                        value={entry.custom_model || ""}
                        onChange={(e) => updateDroneEntry(index, 'custom_model', e.target.value)}
                        className={`mt-1 py-1.5 px-3 rounded-lg text-xs focus:outline-none ${isDarkMode ? 'input-3d-dark text-white' : 'input-3d-light text-black'}`}
                      />
                    )}
                  </div>

                  {/* จำนวนรอบบิน (Sorties) */}
                  <div className="flex flex-col gap-1 min-w-0">
                    <label className={`text-xs font-mono font-bold truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>จำนวนรอบบิน (Sorties)</label>
                    <input
                      type="number"
                      value={entry.sorties || 1}
                      onChange={(e) => updateDroneEntry(index, 'sorties', Math.max(1, parseInt(e.target.value) || 1))}
                      min={1}
                      className={`py-2 px-3 rounded-xl text-xs sm:text-sm focus:outline-none transition-all w-full min-w-0 ${isDarkMode ? 'input-3d-dark text-white' : 'input-3d-light text-black'}`}
                    />
                  </div>

                  {/* เวลาบินรวม (นาที) */}
                  <div className="flex flex-col gap-1 min-w-0">
                    <label className={`text-xs font-mono font-bold truncate ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>เวลาบินรวม (นาที)</label>
                    <input
                      type="number"
                      value={entry.flight_duration_min || 45}
                      onChange={(e) => updateDroneEntry(index, 'flight_duration_min', Math.max(1, parseInt(e.target.value) || 0))}
                      placeholder="45"
                      className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold focus:outline-none transition-all w-full min-w-0 ${isDarkMode ? 'input-3d-dark text-emerald-400' : 'input-3d-light text-emerald-600'}`}
                    />
                  </div>

                  {/* พื้นที่ครอบคลุม */}
                  <div className="flex flex-col gap-1 min-w-0">
                    <label className={`text-xs font-mono font-bold truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>ระยะทาง/พื้นที่ครอบคลุม</label>
                    <input
                      type="text"
                      value={entry.coverage_detail || ""}
                      onChange={(e) => updateDroneEntry(index, 'coverage_detail', e.target.value)}
                      placeholder="รัศมีการบินกี่กิโล"
                      className={`py-2 px-3 rounded-xl text-xs sm:text-sm focus:outline-none transition-all w-full min-w-0 ${isDarkMode ? 'input-3d-dark text-white' : 'input-3d-light text-black'}`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* สรุปภาพรวมโดรนและเวลาบินทั้งหมด */}
          <div className={`mt-3 p-2.5 rounded-xl border flex flex-wrap items-center justify-between text-xs gap-2 ${
            isDarkMode ? 'bg-slate-950/80 border-emerald-500/30 text-emerald-300' : 'bg-emerald-100/60 border-emerald-300 text-emerald-900'
          }`}>
            <div className="flex items-center gap-2">
              <span className="font-bold">สรุปข้อมูลโดรน ({droneEntries.length} เครื่อง/รายการ):</span>
              <span className="font-mono bg-emerald-500/20 px-2 py-0.5 rounded text-[11px]">
                {droneEntries.map(d => d.drone_id === "อื่นๆ" ? (d.custom_model || "โดรนทั่วไป") : d.drone_id).join(", ")}
              </span>
            </div>
            <div className="flex items-center gap-3 font-bold font-mono">
              <span>รวม {totalSorties} รอบบิน</span>
              <span>•</span>
              <span className="text-emerald-400">
                รวมเวลา {totalFlightMins} นาที {totalFlightMins >= 60 ? `(${Math.floor(totalFlightMins / 60)} ชม. ${totalFlightMins % 60} นาที)` : ""}
              </span>
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
                value={localForm.incident_report || ""}
                onChange={handleLocalChange}
                placeholder="เหตุการณ์ทั่วไปปกติ..."
                className={`py-2 px-3 rounded-xl text-xs sm:text-sm focus:outline-none transition-all min-h-[75px] resize-none w-full min-w-0 ${isDarkMode ? 'input-3d-dark text-white' : 'input-3d-light text-black'}`}
              />
            </div>

            {/* หมายเหตุ */}
            <div className="flex flex-col gap-1 min-w-0">
              <label className={`text-xs font-mono font-bold truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>หมายเหตุเพิ่มเติม (ถ้ามี)</label>
              <textarea
                name="remark"
                value={localForm.remark || ""}
                onChange={handleLocalChange}
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

export default memo(UavMissionForm);
