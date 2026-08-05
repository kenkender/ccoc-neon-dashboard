"use client";

import { useState } from "react";
import { Car, Plus, RefreshCw, Shield, Truck, Users, Eye, EyeOff, CheckCircle } from "lucide-react";
import { usePopup } from "./PopupContext";

interface VehicleManagementViewProps {
  isDarkMode: boolean;
  usersList: any[];
  fetchData: () => void;
  API_URL: string;
}

export default function VehicleManagementView({ isDarkMode, usersList, fetchData, API_URL }: VehicleManagementViewProps) {
  const { showNotification } = usePopup();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_type: "CCOC Mobile",
    username: "",
    password: "",
    unit_name: "",
    affiliation: "",
  });

  const affiliationOptions = [
    { value: "บช.ทท.", label: "1. กองบัญชาการตำรวจท่องเที่ยว (บช.ทท.)" },
    { value: "บก.ทท.1", label: "2. กองบังคับการตำรวจท่องเที่ยว 1 (บก.ทท.1)" },
    { value: "บก.ทท.2", label: "3. กองบังคับการตำรวจท่องเที่ยว 2 (บก.ทท.2)" },
    { value: "บก.ทท.3", label: "4. กองบังคับการตำรวจท่องเที่ยว 3 (บก.ทท.3)" },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.password || !formData.unit_name || !formData.affiliation) {
      showNotification({ type: "warning", title: "กรุณากรอกข้อมูลให้ครบถ้วน", message: "ทุกช่องจำเป็นต้องกรอก" });
      return;
    }

    const usernameClean = formData.username.trim().toLowerCase();
    if (formData.vehicle_type === "CCOC Mobile" && !usernameClean.startsWith("stc")) {
      showNotification({ type: "warning", title: "รูปแบบ Username ไม่ถูกต้อง", message: "CCOC Mobile ควรใช้รูปแบบ stcXX เช่น stc11, stc12" });
      return;
    }
    if (formData.vehicle_type === "UAV Mobile" && !usernameClean.startsWith("uav")) {
      showNotification({ type: "warning", title: "รูปแบบ Username ไม่ถูกต้อง", message: "UAV Mobile ควรใช้รูปแบบ uavXX เช่น uav02, uav03" });
      return;
    }

    const isDuplicate = usersList.some((u: any) =>
      String(u.username || "").trim().toLowerCase() === usernameClean
    );
    if (isDuplicate) {
      showNotification({ type: "error", title: "Username ซ้ำในระบบ", message: `รหัส "${formData.username}" มีอยู่แล้ว กรุณาใช้ Username ใหม่` });
      return;
    }

    setIsSubmitting(true);
    try {
      await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "addVehicle",
          timestamp: new Date().toLocaleString("sv-SE", { timeZone: "Asia/Bangkok" }),
          data: {
            username: usernameClean,
            password: formData.password,
            unit_name: formData.unit_name,
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
          "⚠️ กรุณารอ 3-5 วินาทีแล้วกดรีเฟรชเพื่อดูข้อมูลล่าสุด",
        ],
      });

      setFormData({ vehicle_type: "CCOC Mobile", username: "", password: "", unit_name: "", affiliation: "" });
      setTimeout(() => { fetchData(); }, 3000);

    } catch (error) {
      showNotification({ type: "error", title: "เกิดข้อผิดพลาด", message: "ไม่สามารถเพิ่มรถเข้าระบบได้ กรุณาลองใหม่อีกครั้ง" });
    }
    setIsSubmitting(false);
  };

  const vehicleList = usersList.filter((u: any) => u.role !== "admin");
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

  const inputClass = `py-3 px-4 rounded-xl text-sm focus:outline-none transition-all w-full ${isDarkMode ? "input-3d-dark text-white" : "input-3d-light text-black"}`;
  const labelClass = `text-sm font-mono font-bold ${isDarkMode ? "text-gray-400" : "text-gray-600"}`;

  return (
    <div className="w-full max-w-[98%] lg:max-w-[96%] mx-auto min-h-[80vh] flex flex-col gap-5 anim-fade-in">

      {/* Header */}
      <div className={`p-4 sm:p-6 rounded-3xl ${isDarkMode ? "plate-3d-dark" : "plate-3d-light"}`}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className={`text-2xl sm:text-3xl font-bold flex items-center gap-3 ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}>
            <div className={`p-2.5 sm:p-3 rounded-xl btn-3d ${isDarkMode ? "btn-menu-dark text-emerald-400" : "btn-menu-light text-emerald-600"}`}>
              <Truck size={24} />
            </div>
            จัดการรถ / ผู้ใช้งาน
          </h2>
          <button
            onClick={() => fetchData()}
            className={`flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl btn-3d ${isDarkMode ? "btn-menu-dark text-blue-400" : "btn-menu-light text-blue-600"}`}
          >
            <RefreshCw size={16} /> รีเฟรชข้อมูล
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* ─── ฟอร์มเพิ่มรถใหม่ ─── */}
        <div className={`p-4 sm:p-6 rounded-3xl flex flex-col gap-4 ${isDarkMode ? "plate-3d-dark" : "plate-3d-light"}`}>
          <h3 className={`text-lg font-bold flex items-center gap-2 pb-3 border-b border-white/10 ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}>
            <Plus size={20} /> เพิ่มรถ / บัญชีผู้ใช้ใหม่
          </h3>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* ประเภทรถ */}
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>ประเภทรถ *</label>
              <div className="grid grid-cols-2 gap-3">
                {["CCOC Mobile", "UAV Mobile"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, vehicle_type: type, username: "" })}
                    className={`py-3 px-4 rounded-xl font-bold text-sm border-2 transition-all btn-3d flex items-center justify-center gap-2 ${
                      formData.vehicle_type === type
                        ? type === "CCOC Mobile"
                          ? "border-fuchsia-500 bg-fuchsia-900/20 text-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,0.3)]"
                          : "border-cyan-500 bg-cyan-900/20 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                        : isDarkMode ? "border-gray-700 text-gray-400 btn-menu-dark" : "border-gray-300 text-gray-600 btn-menu-light"
                    }`}
                  >
                    {type === "CCOC Mobile" ? <Truck size={16} /> : <Shield size={16} />}
                    {type}
                  </button>
                ))}
              </div>
              <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                {formData.vehicle_type === "CCOC Mobile" ? "Username ควรเป็นรูปแบบ stcXX เช่น stc11, stc12" : "Username ควรเป็นรูปแบบ uavXX เช่น uav02, uav03"}
              </p>
            </div>

            {/* รหัสรถ / Username */}
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>รหัสรถ (Username) *</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder={formData.vehicle_type === "CCOC Mobile" ? "เช่น stc11, stc12" : "เช่น uav02, uav03"}
                className={inputClass}
                autoComplete="off"
              />
            </div>

            {/* รหัสผ่าน */}
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>รหัสผ่าน (Password) *</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="ตั้งรหัสผ่าน..."
                  className={inputClass + " pr-12"}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-all ${isDarkMode ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-700"}`}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* หน่วยงาน */}
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>หน่วยงาน (Unit Name) *</label>
              <input
                type="text"
                name="unit_name"
                value={formData.unit_name}
                onChange={handleChange}
                placeholder="เช่น ฝอ.6 บก.อก.บช.ทท., สภ.เมืองเชียงใหม่"
                className={inputClass}
              />
            </div>

            {/* สังกัด */}
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>สังกัด (Affiliation) *</label>
              <select
                name="affiliation"
                value={formData.affiliation}
                onChange={handleChange}
                className={`py-3 px-4 rounded-xl text-sm focus:outline-none transition-all cursor-pointer w-full ${isDarkMode ? "input-3d-dark text-white" : "input-3d-light text-black"}`}
              >
                <option value="">-- โปรดเลือกสังกัด --</option>
                {affiliationOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* ปุ่มบันทึก */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-3d btn-primary-3d mt-2 py-4 rounded-2xl font-bold text-lg tracking-wider w-full flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <><RefreshCw size={20} className="animate-spin" /> กำลังบันทึก...</>
              ) : (
                <><Plus size={20} /> เพิ่มรถเข้าระบบ</>
              )}
            </button>
          </form>
        </div>

        {/* ─── รายการรถในระบบ ─── */}
        <div className={`p-4 sm:p-6 rounded-3xl flex flex-col gap-4 ${isDarkMode ? "plate-3d-dark" : "plate-3d-light"}`}>
          <h3 className={`text-lg font-bold flex items-center gap-2 pb-3 border-b border-white/10 ${isDarkMode ? "text-cyan-400" : "text-cyan-600"}`}>
            <Users size={20} /> รายการรถ/ผู้ใช้ในระบบ ({vehicleList.length} คัน)
          </h3>

          <div className="flex flex-col gap-4 overflow-y-auto max-h-[70vh] custom-scrollbar">

            {/* CCOC Mobile Section */}
            <div>
              <div className={`flex items-center gap-2 mb-2 px-2 py-1.5 rounded-lg ${isDarkMode ? "bg-fuchsia-900/20" : "bg-fuchsia-50"}`}>
                <Truck size={14} className="text-fuchsia-400" />
                <span className="text-fuchsia-400 font-bold text-sm tracking-wider">CCOC Mobile ({ccocVehicles.length} คัน)</span>
              </div>
              {ccocVehicles.length === 0 ? (
                <p className={`text-center text-xs py-4 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}>ไม่พบข้อมูลรถ CCOC Mobile</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {ccocVehicles.map((u: any, i: number) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl btn-3d ${isDarkMode ? "list-item-3d-dark" : "btn-menu-light"}`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isDarkMode ? "bg-fuchsia-900/40 text-fuchsia-400 border border-fuchsia-500/30" : "bg-fuchsia-100 text-fuchsia-600"}`}>
                        <Truck size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold font-mono text-sm ${isDarkMode ? "text-white" : "text-gray-800"}`}>{u.username}</p>
                        <p className={`text-xs truncate ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{u.unit_name || "-"}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg shrink-0 ${isDarkMode ? "bg-fuchsia-900/30 text-fuchsia-400 border border-fuchsia-500/30" : "bg-fuchsia-100 text-fuchsia-600"}`}>
                        {u.affiliation || "-"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* UAV Mobile Section */}
            <div>
              <div className={`flex items-center gap-2 mb-2 px-2 py-1.5 rounded-lg ${isDarkMode ? "bg-cyan-900/20" : "bg-cyan-50"}`}>
                <Shield size={14} className="text-cyan-400" />
                <span className="text-cyan-400 font-bold text-sm tracking-wider">UAV Mobile ({uavVehicles.length} คัน)</span>
              </div>
              {uavVehicles.length === 0 ? (
                <p className={`text-center text-xs py-4 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}>ไม่พบข้อมูลรถ UAV Mobile</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {uavVehicles.map((u: any, i: number) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl btn-3d ${isDarkMode ? "list-item-3d-dark" : "btn-menu-light"}`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isDarkMode ? "bg-cyan-900/40 text-cyan-400 border border-cyan-500/30" : "bg-cyan-100 text-cyan-600"}`}>
                        <Shield size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold font-mono text-sm ${isDarkMode ? "text-white" : "text-gray-800"}`}>{u.username}</p>
                        <p className={`text-xs truncate ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{u.unit_name || "-"}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg shrink-0 ${isDarkMode ? "bg-cyan-900/30 text-cyan-400 border border-cyan-500/30" : "bg-cyan-100 text-cyan-600"}`}>
                        {u.affiliation || "-"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {vehicleList.length === 0 && (
              <div className={`text-center py-10 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                <Users size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-mono text-sm">ยังไม่มีข้อมูลรถในระบบ</p>
                <p className="text-xs mt-1">หรือกำลังโหลดข้อมูล...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── คำแนะนำ ─── */}
      <div className={`p-4 sm:p-6 rounded-3xl border-2 ${isDarkMode ? "border-yellow-500/30 bg-yellow-900/5" : "border-yellow-400/50 bg-yellow-50"}`}>
        <h3 className={`text-base font-bold flex items-center gap-2 mb-3 ${isDarkMode ? "text-yellow-400" : "text-yellow-600"}`}>
          <CheckCircle size={18} /> ข้อควรทราบสำหรับ Admin
        </h3>
        <ul className={`text-sm flex flex-col gap-2 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
          <li className="flex items-start gap-2"><span className="text-yellow-400 mt-0.5">•</span> หลังเพิ่มรถสำเร็จ ข้อมูลจะถูกบันทึกลง Google Sheets ทันที</li>
          <li className="flex items-start gap-2"><span className="text-yellow-400 mt-0.5">•</span> กดปุ่ม <strong>"รีเฟรชข้อมูล"</strong> เพื่ออัปเดตรายการรถในหน้านี้</li>
          <li className="flex items-start gap-2"><span className="text-yellow-400 mt-0.5">•</span> รถที่เพิ่มใหม่จะปรากฏใน Dropdown ของฟอร์มบันทึกภารกิจโดยอัตโนมัติ</li>
          <li className="flex items-start gap-2"><span className="text-yellow-400 mt-0.5">•</span> <strong>Password เก็บเป็น plain text</strong> กรุณาไม่ใช้รหัสผ่านที่ใช้ที่อื่น</li>
        </ul>
      </div>

    </div>
  );
}
