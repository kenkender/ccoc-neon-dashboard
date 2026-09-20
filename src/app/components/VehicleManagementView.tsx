"use client";

import { useState } from "react";
import {
  Plus,
  RefreshCw,
  Shield,
  Truck,
  Users,
  Eye,
  EyeOff,
  CheckCircle,
  Pencil,
  X,
  Save,
  Lock,
} from "lucide-react";
import { usePopup } from "./PopupContext";

interface VehicleManagementViewProps {
  isDarkMode: boolean;
  usersList: any[];
  fetchData: (forceRefresh?: boolean) => void;
  API_URL: string;
}

const affiliationOptions = [
  { value: "บช.ทท.", label: "1. กองบัญชาการตำรวจท่องเที่ยว (บช.ทท.)" },
  { value: "บก.ทท.1", label: "2. กองบังคับการตำรวจท่องเที่ยว 1 (บก.ทท.1)" },
  { value: "บก.ทท.2", label: "3. กองบังคับการตำรวจท่องเที่ยว 2 (บก.ทท.2)" },
  { value: "บก.ทท.3", label: "4. กองบังคับการตำรวจท่องเที่ยว 3 (บก.ทท.3)" },
];

const emptyForm = {
  vehicle_type: "CCOC Mobile",
  username: "",
  password: "",
  unit_name: "",
  affiliation: "",
};

export default function VehicleManagementView({
  isDarkMode,
  usersList,
  fetchData,
  API_URL,
}: VehicleManagementViewProps) {
  const { showNotification } = usePopup();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editMode, setEditMode] = useState(false); // false = add, true = edit
  const [formData, setFormData] = useState(emptyForm);
  const [activeListTab, setActiveListTab] = useState<"ALL" | "CCOC" | "UAV">("ALL");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ── โหมดแก้ไข: คลิกปุ่ม ✏️ จากรายการ ──────────────────────────────────
  const handleEditClick = (u: any) => {
    setEditMode(true);
    setShowPassword(false);
    setFormData({
      vehicle_type: u.vehicle_type || "CCOC Mobile",
      username: u.username || "",
      password: u.password || "",
      unit_name: u.unit_name || u.vehicle_name || "",
      affiliation: u.affiliation || "",
    });
    // Scroll ฟอร์มขึ้นบน (มือถือ)
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setFormData(emptyForm);
    setShowPassword(false);
  };

  // ── Submit: เพิ่มใหม่ ──────────────────────────────────────────────────
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.username ||
      !formData.password ||
      !formData.unit_name ||
      !formData.affiliation
    ) {
      showNotification({
        type: "warning",
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        message: "ทุกช่องจำเป็นต้องกรอก",
      });
      return;
    }

    const usernameClean = formData.username.trim().toLowerCase();
    if (
      formData.vehicle_type === "CCOC Mobile" &&
      !usernameClean.startsWith("stc")
    ) {
      showNotification({
        type: "warning",
        title: "รูปแบบ Username ไม่ถูกต้อง",
        message: "CCOC Mobile ควรใช้รูปแบบ stcXX เช่น stc11, stc12",
      });
      return;
    }
    if (
      formData.vehicle_type === "UAV Mobile" &&
      !usernameClean.startsWith("uav")
    ) {
      showNotification({
        type: "warning",
        title: "รูปแบบ Username ไม่ถูกต้อง",
        message: "UAV Mobile ควรใช้รูปแบบ uavXX เช่น uav02, uav03",
      });
      return;
    }

    const isDuplicate = usersList.some(
      (u: any) =>
        String(u.username || "")
          .trim()
          .toLowerCase() === usernameClean
    );
    if (isDuplicate) {
      showNotification({
        type: "error",
        title: "Username ซ้ำในระบบ",
        message: `รหัส "${formData.username}" มีอยู่แล้ว กรุณาใช้ Username ใหม่`,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "addVehicle",
          timestamp: new Date().toLocaleString("sv-SE", {
            timeZone: "Asia/Bangkok",
          }),
          data: {
            username: usernameClean,
            password: formData.password,
            unit_name: formData.unit_name,
            vehicle_name: formData.unit_name,
            station_name: formData.unit_name,
            station: formData.unit_name,
            affiliation: formData.affiliation,
            vehicle_type: formData.vehicle_type,
            role: "user",
          },
        }),
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        mode: "no-cors",
      });

      showNotification({
        type: "success",
        title: "เพิ่มรถเข้าระบบสำเร็จ!",
        message: `รหัสรถ "${usernameClean}" (${formData.vehicle_type}) ถูกเพิ่มเข้าระบบแล้ว`,
        details: [
          `ประเภท: ${formData.vehicle_type}`,
          `รหัส: ${usernameClean}`,
          `หน่วย: ${formData.unit_name}`,
          `สังกัด: ${formData.affiliation}`,
          "⚠️ กรุณารอ 2-3 วินาทีระบบกำลังอัปเดตข้อมูลล่าสด",
        ],
      });

      setFormData(emptyForm);
      setTimeout(() => {
        fetchData(true);
      }, 2000);
    } catch {
      showNotification({
        type: "error",
        title: "เกิดข้อผิดพลาด",
        message: "ไม่สามารถเพิ่มรถเข้าระบบได้ กรุณาลองใหม่อีกครั้ง",
      });
    }
    setIsSubmitting(false);
  };

  // ── Submit: แก้ไข ─────────────────────────────────────────────────────
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.unit_name || !formData.affiliation) {
      showNotification({
        type: "warning",
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        message: "หน่วยงานและสังกัดจำเป็นต้องกรอก",
      });
      return;
    }

    const usernameClean = formData.username.trim().toLowerCase();
    setIsSubmitting(true);

    try {
      const payload = {
        action: "editVehicle",
        timestamp: new Date().toLocaleString("sv-SE", {
          timeZone: "Asia/Bangkok",
        }),
        data: {
          username: usernameClean,
          password: formData.password,
          unit_name: formData.unit_name,
          vehicle_name: formData.unit_name,
          affiliation: formData.affiliation,
          vehicle_type: formData.vehicle_type,
          role: "user",
        },
      };

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json().catch(() => ({}));

      showNotification({
        type: result.status === "success" || result.gasSuccess ? "success" : "warning",
        title:
          result.status === "success" || result.gasSuccess
            ? "แก้ไขข้อมูลสำเร็จ!"
            : "บันทึกแล้ว (Sync บางส่วน)",
        message: `ข้อมูลของ "${usernameClean}" ถูกอัปเดตแล้ว`,
        details: [
          `หน่วย: ${formData.unit_name}`,
          `สังกัด: ${formData.affiliation}`,
          `ประเภท: ${formData.vehicle_type}`,
          result.gasSuccess === false
            ? "⚠️ Google Sheets sync ไม่สมบูรณ์ (GAS อาจยังไม่รองรับ editVehicle)"
            : "✅ ข้อมูลถูก sync ไปยัง Google Sheets แล้ว",
        ],
      });

      setEditMode(false);
      setFormData(emptyForm);
      setTimeout(() => {
        fetchData(true);
      }, 1500);
    } catch {
      showNotification({
        type: "error",
        title: "เกิดข้อผิดพลาด",
        message: "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่",
      });
    }
    setIsSubmitting(false);
  };

  // ── Lists ──────────────────────────────────────────────────────────────
  const vehicleList = usersList.filter(
    (u: any) =>
      u.role !== "admin" && u.username && String(u.username).trim() !== ""
  );
  const ccocVehicles = vehicleList.filter((u: any) => {
    const uname = String(u.username || "").toLowerCase();
    const vtype = String(u.vehicle_type || "").toLowerCase();
    return vtype === "ccoc mobile" || uname.startsWith("stc");
  });
  const uavVehicles = vehicleList.filter((u: any) => {
    const uname = String(u.username || "").toLowerCase();
    const vtype = String(u.vehicle_type || "").toLowerCase();
    return vtype === "uav mobile" || uname.startsWith("uav");
  });

  const inputClass = `py-2 px-3 rounded-xl text-xs sm:text-sm focus:outline-none transition-all w-full min-w-0 ${
    isDarkMode ? "input-3d-dark text-white" : "input-3d-light text-black"
  }`;
  const labelClass = `text-xs font-mono font-bold ${
    isDarkMode ? "text-gray-400" : "text-gray-600"
  }`;

  // ── UserCard component (shared CCOC/UAV) ──────────────────────────────
  const UserCard = ({ u, accentColor }: { u: any; accentColor: "fuchsia" | "cyan" }) => {
    const colors = {
      fuchsia: {
        iconBg: isDarkMode
          ? "bg-fuchsia-900/40 text-fuchsia-400 border border-fuchsia-500/30"
          : "bg-fuchsia-100 text-fuchsia-600",
        badge: isDarkMode
          ? "bg-fuchsia-900/30 text-fuchsia-400 border border-fuchsia-500/30"
          : "bg-fuchsia-100 text-fuchsia-600",
        editBtn: isDarkMode
          ? "bg-fuchsia-900/20 border border-fuchsia-500/40 text-fuchsia-400 hover:bg-fuchsia-900/50"
          : "bg-fuchsia-50 border border-fuchsia-300 text-fuchsia-600 hover:bg-fuchsia-100",
      },
      cyan: {
        iconBg: isDarkMode
          ? "bg-cyan-900/40 text-cyan-400 border border-cyan-500/30"
          : "bg-cyan-100 text-cyan-600",
        badge: isDarkMode
          ? "bg-cyan-900/30 text-cyan-400 border border-cyan-500/30"
          : "bg-cyan-100 text-cyan-600",
        editBtn: isDarkMode
          ? "bg-cyan-900/20 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-900/50"
          : "bg-cyan-50 border border-cyan-300 text-cyan-600 hover:bg-cyan-100",
      },
    }[accentColor];

    const isCurrentlyEditing =
      editMode && formData.username === u.username;

    return (
      <div
        className={`flex items-center gap-2.5 p-2.5 rounded-xl btn-3d transition-all ${
          isCurrentlyEditing
            ? isDarkMode
              ? "ring-2 ring-amber-400/60 list-item-3d-dark"
              : "ring-2 ring-amber-400/60 btn-menu-light"
            : isDarkMode
            ? "list-item-3d-dark"
            : "btn-menu-light"
        }`}
      >
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${colors.iconBg}`}
        >
          {accentColor === "fuchsia" ? <Truck size={15} /> : <Shield size={15} />}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={`font-bold font-mono text-xs sm:text-sm ${
              isDarkMode ? "text-white" : "text-gray-800"
            }`}
          >
            {u.username}
          </p>
          <p
            className={`text-[11px] truncate ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {u.vehicle_name || u.unit_name || "-"}
          </p>
        </div>
        <span
          className={`text-[11px] font-bold px-2 py-0.5 rounded-lg shrink-0 ${colors.badge}`}
        >
          {u.affiliation || "-"}
        </span>

        {/* ปุ่มแก้ไข */}
        <button
          type="button"
          onClick={() => handleEditClick(u)}
          title={`แก้ไข ${u.username}`}
          className={`ml-1 p-1.5 rounded-lg text-[11px] font-bold transition-all shrink-0 ${colors.editBtn} ${
            isCurrentlyEditing ? "ring-1 ring-amber-400" : ""
          }`}
        >
          <Pencil size={13} />
        </button>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col gap-4 anim-fade-in pb-4">

      {/* Header */}
      <div
        className={`p-3.5 sm:p-5 rounded-3xl ${
          isDarkMode ? "plate-3d-dark" : "plate-3d-light"
        }`}
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2
            className={`text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2.5 ${
              isDarkMode ? "text-emerald-400" : "text-emerald-600"
            }`}
          >
            <div
              className={`p-2.5 rounded-xl btn-3d ${
                isDarkMode
                  ? "btn-menu-dark text-emerald-400"
                  : "btn-menu-light text-emerald-600"
              }`}
            >
              <Truck size={22} />
            </div>
            จัดการรถ / ผู้ใช้งาน
          </h2>
          <button
            onClick={() => fetchData(true)}
            className={`flex items-center gap-2 text-xs sm:text-sm font-bold px-3.5 py-2 rounded-xl btn-3d ${
              isDarkMode
                ? "btn-menu-dark text-blue-400"
                : "btn-menu-light text-blue-600"
            }`}
          >
            <RefreshCw size={15} /> รีเฟรชข้อมูล
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* ─── ฝั่งซ้าย: ฟอร์ม (เพิ่มใหม่ หรือ แก้ไข) ─────────────────── */}
        <div
          className={`p-3.5 sm:p-5 rounded-3xl flex flex-col gap-3.5 transition-all ${
            isDarkMode ? "plate-3d-dark" : "plate-3d-light"
          } ${editMode ? (isDarkMode ? "ring-2 ring-amber-500/40" : "ring-2 ring-amber-400/60") : ""}`}
        >
          {/* ─── Header ฟอร์ม ─── */}
          <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
            <h3
              className={`text-base font-bold flex items-center gap-2 ${
                editMode
                  ? isDarkMode
                    ? "text-amber-400"
                    : "text-amber-600"
                  : isDarkMode
                  ? "text-emerald-400"
                  : "text-emerald-600"
              }`}
            >
              {editMode ? (
                <>
                  <Pencil size={18} /> แก้ไขข้อมูลผู้ใช้
                </>
              ) : (
                <>
                  <Plus size={18} /> เพิ่มรถ / บัญชีผู้ใช้ใหม่
                </>
              )}
            </h3>
            {editMode && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all ${
                  isDarkMode
                    ? "bg-slate-800 border border-slate-700 text-gray-400 hover:text-white hover:border-gray-500"
                    : "bg-gray-100 border border-gray-300 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <X size={13} /> ยกเลิก
              </button>
            )}
          </div>

          {/* เมื่ออยู่โหมด Edit แสดง banner */}
          {editMode && (
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border ${
                isDarkMode
                  ? "bg-amber-900/20 border-amber-500/40 text-amber-400"
                  : "bg-amber-50 border-amber-400/60 text-amber-700"
              }`}
            >
              <Pencil size={13} />
              <span>
                กำลังแก้ไข:{" "}
                <span className="font-mono">{formData.username}</span>
              </span>
              <span
                className={`ml-auto text-[10px] px-2 py-0.5 rounded-lg ${
                  isDarkMode
                    ? "bg-amber-900/30 border border-amber-500/30"
                    : "bg-amber-100 border border-amber-300"
                }`}
              >
                {formData.vehicle_type}
              </span>
            </div>
          )}

          <form
            onSubmit={editMode ? handleSaveEdit : handleAdd}
            className="flex flex-col gap-3"
          >
            {/* ประเภทรถ */}
            <div className="flex flex-col gap-1 min-w-0">
              <label className={labelClass}>ประเภทรถ *</label>
              <div className="grid grid-cols-2 gap-2.5">
                {["CCOC Mobile", "UAV Mobile"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    disabled={editMode}
                    onClick={() =>
                      setFormData({ ...formData, vehicle_type: type, username: "" })
                    }
                    className={`py-2 px-3 rounded-xl font-bold text-xs sm:text-sm border-2 transition-all btn-3d flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                      formData.vehicle_type === type
                        ? type === "CCOC Mobile"
                          ? "border-fuchsia-500 bg-fuchsia-900/20 text-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,0.3)]"
                          : "border-cyan-500 bg-cyan-900/20 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                        : isDarkMode
                        ? "border-gray-700 text-gray-400 btn-menu-dark"
                        : "border-gray-300 text-gray-600 btn-menu-light"
                    }`}
                  >
                    {type === "CCOC Mobile" ? <Truck size={15} /> : <Shield size={15} />}
                    {type}
                  </button>
                ))}
              </div>
              {!editMode && (
                <p
                  className={`text-[11px] mt-0.5 ${
                    isDarkMode ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  {formData.vehicle_type === "CCOC Mobile"
                    ? "Username ควรเป็นรูปแบบ stcXX เช่น stc11, stc12"
                    : "Username ควรเป็นรูปแบบ uavXX เช่น uav02, uav03"}
                </p>
              )}
            </div>

            {/* รหัสรถ / Username */}
            <div className="flex flex-col gap-1 min-w-0">
              <label className={labelClass}>
                รหัสรถ (Username){" "}
                {editMode ? (
                  <span
                    className={`ml-1 inline-flex items-center gap-1 text-[10px] font-normal ${
                      isDarkMode ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    <Lock size={10} /> ไม่สามารถเปลี่ยนได้
                  </span>
                ) : (
                  "*"
                )}
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  readOnly={editMode}
                  placeholder={
                    formData.vehicle_type === "CCOC Mobile"
                      ? "เช่น stc11, stc12"
                      : "เช่น uav02, uav03"
                  }
                  className={`${inputClass} ${
                    editMode
                      ? isDarkMode
                        ? "cursor-not-allowed opacity-60"
                        : "cursor-not-allowed opacity-60 bg-gray-100"
                      : ""
                  }`}
                  autoComplete="off"
                />
                {editMode && (
                  <Lock
                    size={14}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                      isDarkMode ? "text-gray-600" : "text-gray-400"
                    }`}
                  />
                )}
              </div>
            </div>

            {/* รหัสผ่าน */}
            <div className="flex flex-col gap-1 min-w-0">
              <label className={labelClass}>
                รหัสผ่าน (Password) {editMode ? "(เว้นว่างเพื่อคงรหัสเดิม)" : "*"}
              </label>
              <div className="relative w-full min-w-0">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={
                    editMode ? "เว้นว่างเพื่อคงรหัสผ่านเดิม" : "ตั้งรหัสผ่าน..."
                  }
                  className={inputClass + " pr-10"}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-all ${
                    isDarkMode
                      ? "text-gray-500 hover:text-gray-300"
                      : "text-gray-400 hover:text-gray-700"
                  }`}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* หน่วยงาน / ชื่อสถานี */}
            <div className="flex flex-col gap-1 min-w-0">
              <label className={labelClass}>
                หน่วยงาน / ชื่อสถานี (Unit Name / Vehicle Name) *
              </label>
              <input
                type="text"
                name="unit_name"
                value={formData.unit_name}
                onChange={handleChange}
                placeholder="เช่น ส.ทท.1 กก.1 บก.ทท.1 (กรุงเทพเหนือ)"
                className={inputClass}
              />
            </div>

            {/* สังกัด */}
            <div className="flex flex-col gap-1 min-w-0">
              <label className={labelClass}>สังกัด (Affiliation) *</label>
              <select
                name="affiliation"
                value={formData.affiliation}
                onChange={handleChange}
                className={`py-2 px-3 rounded-xl text-xs sm:text-sm focus:outline-none transition-all cursor-pointer w-full min-w-0 ${
                  isDarkMode
                    ? "input-3d-dark text-white"
                    : "input-3d-light text-black"
                }`}
              >
                <option value="">-- โปรดเลือกสังกัด --</option>
                {affiliationOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* ปุ่มบันทึก */}
            {editMode ? (
              <div className="grid grid-cols-2 gap-2.5 mt-1">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className={`py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all btn-3d ${
                    isDarkMode
                      ? "btn-menu-dark text-gray-400 hover:text-white"
                      : "btn-menu-light text-gray-600"
                  }`}
                >
                  <X size={16} /> ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-3d py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:scale-[1.02] active:scale-95 transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" /> กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <Save size={16} /> บันทึกการแก้ไข
                    </>
                  )}
                </button>
              </div>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-3d btn-primary-3d mt-1 py-3.5 rounded-2xl font-bold text-sm sm:text-base tracking-wider w-full flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" /> กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Plus size={18} /> เพิ่มรถเข้าระบบ
                  </>
                )}
              </button>
            )}
          </form>
        </div>

        {/* ─── ฝั่งขวา: รายการรถในระบบ ─────────────────────────────────── */}
        <div
          className={`p-3.5 sm:p-5 rounded-3xl flex flex-col gap-3.5 ${
            isDarkMode ? "plate-3d-dark" : "plate-3d-light"
          }`}
        >
          {/* Header การ์ดขวา พร้อมแท็บปุ่มแยกประเภท */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-white/10">
            <h3
              className={`text-base font-bold flex items-center gap-2 ${
                isDarkMode ? "text-cyan-400" : "text-cyan-600"
              }`}
            >
              <Users size={18} /> รายการรถ/ผู้ใช้ในระบบ ({vehicleList.length} คัน)
            </h3>

            {/* ปุ่มแถบแยกประเภท (Category Tabs) */}
            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setActiveListTab("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeListTab === "ALL"
                    ? isDarkMode
                      ? "bg-slate-700 text-white shadow-sm border border-slate-600"
                      : "bg-white text-gray-900 shadow-sm border border-gray-200"
                    : isDarkMode
                    ? "text-gray-400 hover:text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <span>ทั้งหมด</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 font-mono">
                  {vehicleList.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveListTab("CCOC")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeListTab === "CCOC"
                    ? "bg-fuchsia-900/70 text-fuchsia-300 border border-fuchsia-500/50 shadow-[0_0_12px_rgba(217,70,239,0.35)]"
                    : isDarkMode
                    ? "text-gray-400 hover:text-fuchsia-400"
                    : "text-gray-600 hover:text-fuchsia-600"
                }`}
              >
                <Truck size={13} />
                <span>CCOC</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-fuchsia-500/20 font-mono text-fuchsia-300">
                  {ccocVehicles.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveListTab("UAV")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeListTab === "UAV"
                    ? "bg-cyan-900/70 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(34,211,238,0.35)]"
                    : isDarkMode
                    ? "text-gray-400 hover:text-cyan-400"
                    : "text-gray-600 hover:text-cyan-600"
                }`}
              >
                <Shield size={13} />
                <span>UAV</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 font-mono text-cyan-300">
                  {uavVehicles.length}
                </span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 overflow-y-auto max-h-[65vh] custom-scrollbar pr-1">

            {/* CCOC Mobile Section */}
            {(activeListTab === "ALL" || activeListTab === "CCOC") && (
              <div>
                <div
                  className={`flex items-center gap-2 mb-2 px-2.5 py-1 rounded-lg ${
                    isDarkMode ? "bg-fuchsia-900/20" : "bg-fuchsia-50"
                  }`}
                >
                  <Truck size={14} className="text-fuchsia-400" />
                  <span className="text-fuchsia-400 font-bold text-xs sm:text-sm tracking-wider">
                    CCOC Mobile ({ccocVehicles.length} คัน)
                  </span>
                </div>
                {ccocVehicles.length === 0 ? (
                  <p
                    className={`text-center text-xs py-3 ${
                      isDarkMode ? "text-gray-600" : "text-gray-400"
                    }`}
                  >
                    ไม่พบข้อมูลรถ CCOC Mobile
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {ccocVehicles.map((u: any, i: number) => (
                      <UserCard key={i} u={u} accentColor="fuchsia" />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* UAV Mobile Section */}
            {(activeListTab === "ALL" || activeListTab === "UAV") && (
              <div>
                <div
                  className={`flex items-center gap-2 mb-2 px-2.5 py-1 rounded-lg ${
                    isDarkMode ? "bg-cyan-900/20" : "bg-cyan-50"
                  }`}
                >
                  <Shield size={14} className="text-cyan-400" />
                  <span className="text-cyan-400 font-bold text-xs sm:text-sm tracking-wider">
                    UAV Mobile ({uavVehicles.length} คัน)
                  </span>
                </div>
                {uavVehicles.length === 0 ? (
                  <p
                    className={`text-center text-xs py-3 ${
                      isDarkMode ? "text-gray-600" : "text-gray-400"
                    }`}
                  >
                    ไม่พบข้อมูลรถ UAV Mobile
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {uavVehicles.map((u: any, i: number) => (
                      <UserCard key={i} u={u} accentColor="cyan" />
                    ))}
                  </div>
                )}
              </div>
            )}

            {vehicleList.length === 0 && (
              <div
                className={`text-center py-8 ${
                  isDarkMode ? "text-gray-500" : "text-gray-400"
                }`}
              >
                <Users size={36} className="mx-auto mb-2 opacity-30" />
                <p className="font-mono text-xs">ยังไม่มีข้อมูลรถในระบบ</p>
                <p className="text-[11px] mt-1">หรือกำลังโหลดข้อมูล...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── คำแนะนำ ─── */}
      <div
        className={`p-3.5 sm:p-4 rounded-3xl border-2 ${
          isDarkMode
            ? "border-yellow-500/30 bg-yellow-900/5"
            : "border-yellow-400/50 bg-yellow-50"
        }`}
      >
        <h3
          className={`text-sm font-bold flex items-center gap-2 mb-2 ${
            isDarkMode ? "text-yellow-400" : "text-yellow-600"
          }`}
        >
          <CheckCircle size={16} /> ข้อควรทราบสำหรับ Admin
        </h3>
        <ul
          className={`text-xs flex flex-col gap-1.5 ${
            isDarkMode ? "text-gray-300" : "text-gray-600"
          }`}
        >
          <li className="flex items-start gap-1.5">
            <span className="text-yellow-400 mt-0.5">•</span>
            กดปุ่ม ✏️ <strong>แก้ไข</strong> ที่รายการรถ เพื่อแก้ไขข้อมูล รหัสผ่าน หรือสังกัด
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-yellow-400 mt-0.5">•</span>
            <strong>รหัสรถ (Username)</strong> ไม่สามารถเปลี่ยนได้
            (ใช้เป็น Key หลักของระบบ)
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-yellow-400 mt-0.5">•</span>
            หลังเพิ่มหรือแก้ไขรถสำเร็จ ข้อมูลจะถูกบันทึกลง <strong>Supabase (และ Sync สำรองไปยัง Google Sheets)</strong> ทันที
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-yellow-400 mt-0.5">•</span>
            กดปุ่ม <strong>"รีเฟรชข้อมูล"</strong> เพื่ออัปเดตรายการรถในหน้านี้
          </li>
        </ul>
      </div>
    </div>
  );
}
