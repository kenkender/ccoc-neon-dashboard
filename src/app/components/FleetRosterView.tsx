"use client";

import { ChevronDown, ChevronRight, PenTool, Shield, Truck, Calendar, Users, MapPin, ClipboardList, Plane } from "lucide-react";
import { useState, useEffect } from "react";

interface FleetRosterViewProps {
  isDarkMode: boolean;
  currentUser: any;
  usersList: any[];
  missions: any[];
  onRecordMission: (vehicleId: string, affiliation: string, targetVehicleType?: "CCOC Mobile" | "UAV Mobile") => void;
}

const AFFILIATION_ORDER = ["บช.ทท.", "บก.ทท.1", "บก.ทท.2", "บก.ทท.3"];

const AFFILIATION_STYLE: Record<string, { color: string; darkBg: string; lightBg: string; darkBorder: string; lightBorder: string }> = {
  "บช.ทท.":   { color: "fuchsia", darkBg: "bg-fuchsia-900/20", lightBg: "bg-fuchsia-50",  darkBorder: "border-fuchsia-500/40", lightBorder: "border-fuchsia-300" },
  "บก.ทท.1":  { color: "cyan",    darkBg: "bg-cyan-900/20",    lightBg: "bg-cyan-50",    darkBorder: "border-cyan-500/40",    lightBorder: "border-cyan-300"    },
  "บก.ทท.2":  { color: "green",   darkBg: "bg-green-900/20",   lightBg: "bg-green-50",   darkBorder: "border-green-500/40",   lightBorder: "border-green-300"   },
  "บก.ทท.3":  { color: "orange",  darkBg: "bg-orange-900/20",  lightBg: "bg-orange-50",  darkBorder: "border-orange-500/40",  lightBorder: "border-orange-300"  },
};

const AFFILIATION_HEADER_COLOR: Record<string, string> = {
  "บช.ทท.":  "from-fuchsia-600/80 to-fuchsia-900/60 text-fuchsia-200 border-fuchsia-500/40",
  "บก.ทท.1": "from-cyan-600/80    to-cyan-900/60    text-cyan-200    border-cyan-500/40",
  "บก.ทท.2": "from-green-600/80   to-green-900/60   text-green-200   border-green-500/40",
  "บก.ทท.3": "from-orange-600/80  to-orange-900/60  text-orange-200  border-orange-500/40",
};

const AFFILIATION_BTN_COLOR: Record<string, string> = {
  "บช.ทท.":  "bg-fuchsia-600 hover:bg-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.4)] hover:shadow-[0_0_25px_rgba(217,70,239,0.7)]",
  "บก.ทท.1": "bg-cyan-600    hover:bg-cyan-500    shadow-[0_0_15px_rgba(34,211,238,0.4)]  hover:shadow-[0_0_25px_rgba(34,211,238,0.7)]",
  "บก.ทท.2": "bg-green-600   hover:bg-green-500   shadow-[0_0_15px_rgba(74,222,128,0.4)]  hover:shadow-[0_0_25px_rgba(74,222,128,0.7)]",
  "บก.ทท.3": "bg-orange-600  hover:bg-orange-500  shadow-[0_0_15px_rgba(251,146,60,0.4)]  hover:shadow-[0_0_25px_rgba(251,146,60,0.7)]",
};

const AFFILIATION_BADGE: Record<string, string> = {
  "บช.ทท.":  "bg-fuchsia-900/50 text-fuchsia-300 border border-fuchsia-500/40",
  "บก.ทท.1": "bg-cyan-900/50    text-cyan-300    border border-cyan-500/40",
  "บก.ทท.2": "bg-green-900/50   text-green-300   border border-green-500/40",
  "บก.ทท.3": "bg-orange-900/50  text-orange-300  border border-orange-500/40",
};

export default function FleetRosterView({ isDarkMode, currentUser, usersList, missions, onRecordMission }: FleetRosterViewProps) {
  // Default: Admin = expand all, User = expand only the group containing their own vehicle
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    if (currentUser?.role === "admin") {
      // Admin เห็นทุกกลุ่มขยาย
      AFFILIATION_ORDER.forEach(a => { init[a] = true; });
    } else {
      // User: หาสังกัดของรถตัวเองจาก usersList
      const myVehicleId = String(currentUser?.vehicle_id || currentUser?.username || "").trim().toLowerCase();
      const myVehicle = usersList.find((u: any) =>
        String(u.username || "").trim().toLowerCase() === myVehicleId
      );
      const myAffiliation = String(myVehicle?.affiliation || currentUser?.affiliation || "").trim();
      // เปิดเฉพาะกลุ่มของตัวเอง
      AFFILIATION_ORDER.forEach(a => { init[a] = (a === myAffiliation); });
    }
    return init;
  });

  // 🚀 Auto-scroll to logged-in user's vehicle card after mount
  useEffect(() => {
    if (!currentUser || currentUser.role === "admin") return;
    const myVehicleId = String(currentUser.vehicle_id || currentUser.username || "").trim().toLowerCase();
    if (!myVehicleId) return;

    const timer = setTimeout(() => {
      const el = document.getElementById(`vehicle-card-${myVehicleId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [currentUser]);

  const toggleGroup = (aff: string) => {
    setExpandedGroups(prev => ({ ...prev, [aff]: !prev[aff] }));
  };

  // Filter out admin users, empty username rows, and unspecified affiliations
  const vehicles = usersList.filter((u: any) => 
    u.role !== "admin" && 
    u.username && 
    String(u.username).trim() !== "" &&
    u.affiliation && 
    u.affiliation !== "ไม่ระบุ"
  );

  // Build mission stats per vehicle
  const missionStatsByVehicle: Record<string, { count: number; latest: any | null }> = {};
  vehicles.forEach((v: any) => {
    const vid = String(v.username || "").trim().toLowerCase();
    const vehicleMissions = missions.filter((m: any) => {
      const mvid = String(m.vehicle_id || "").trim().toLowerCase();
      return mvid === vid || mvid === String(v.username || "").trim();
    });
    vehicleMissions.sort((a: any, b: any) => new Date(b.start_date || 0).getTime() - new Date(a.start_date || 0).getTime());
    missionStatsByVehicle[vid] = {
      count: vehicleMissions.length,
      latest: vehicleMissions[0] || null,
    };
  });

  // Group vehicles by affiliation
  const grouped: Record<string, any[]> = {};
  vehicles.forEach((v: any) => {
    const aff = String(v.affiliation || "").trim();
    if (AFFILIATION_ORDER.includes(aff)) {
      if (!grouped[aff]) grouped[aff] = [];
      grouped[aff].push(v);
    }
  });

  const sortedAffs = AFFILIATION_ORDER.filter(a => grouped[a] && grouped[a].length > 0);

  const isMyVehicle = (vehicle: any) => {
    return String(currentUser?.vehicle_id || "").trim().toLowerCase() === String(vehicle.username || "").trim().toLowerCase();
  };

  // canRecord = true ถ้า:
  // 1. เป็น Admin
  // 2. เป็นรถของตัวเอง (vehicle_id ตรงกัน)
  // 3. มี vehicle_type = "ALL" และอยู่ unit_name เดียวกัน (สถานีเดียวกัน มีทั้ง CCOC + UAV)
  const canRecord = (vehicle: any) => {
    if (currentUser?.role === "admin") return true;
    if (isMyVehicle(vehicle)) return true;
    const isAllType = String(currentUser?.vehicle_type || "").trim().toUpperCase() === "ALL";
    const myUnit = String(currentUser?.unit_name || "").trim().toLowerCase();
    const vehicleUnit = String(vehicle.unit_name || "").trim().toLowerCase();
    if (isAllType && myUnit && vehicleUnit && myUnit === vehicleUnit) return true;
    return false;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "2-digit" });
    } catch { return "-"; }
  };

  const totalVehicles = vehicles.length;
  const totalMissions = missions.length;

  return (
    <div className="w-full flex flex-col gap-5 anim-fade-in pb-6">

      {/* ─── KPI Summary Bar ─── */}
      <div className={`p-4 sm:p-5 rounded-2xl flex flex-wrap gap-4 items-center justify-between ${isDarkMode ? "plate-3d-dark" : "plate-3d-light"}`}>
        <div>
          <h2 className={`text-xl sm:text-2xl font-black tracking-widest ${isDarkMode ? "text-fuchsia-400" : "text-fuchsia-600"}`}>
            CCOC FLEET ROSTER
          </h2>
          <p className={`text-xs font-mono mt-0.5 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
            รายชื่อรถปฏิบัติการเคลื่อนที่ทั้งหมด — เลือกรถเพื่อบันทึกภารกิจ
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className={`flex flex-col items-center px-4 py-2 rounded-xl btn-3d ${isDarkMode ? "btn-menu-dark" : "btn-menu-light"}`}>
            <span className={`text-2xl font-black ${isDarkMode ? "text-cyan-400" : "text-cyan-600"}`}>{totalVehicles}</span>
            <span className={`text-xs font-mono ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>รถทั้งหมด</span>
          </div>
          <div className={`flex flex-col items-center px-4 py-2 rounded-xl btn-3d ${isDarkMode ? "btn-menu-dark" : "btn-menu-light"}`}>
            <span className={`text-2xl font-black ${isDarkMode ? "text-fuchsia-400" : "text-fuchsia-600"}`}>{totalMissions}</span>
            <span className={`text-xs font-mono ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>ภารกิจรวม</span>
          </div>
          <div className={`flex flex-col items-center px-4 py-2 rounded-xl btn-3d ${isDarkMode ? "btn-menu-dark" : "btn-menu-light"}`}>
            <span className={`text-2xl font-black ${isDarkMode ? "text-green-400" : "text-green-600"}`}>{sortedAffs.length}</span>
            <span className={`text-xs font-mono ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>หน่วยงาน</span>
          </div>
        </div>
      </div>

      {/* ─── Accordion Groups ─── */}
      {sortedAffs.map((aff) => {
        const vehiclesInGroup = grouped[aff] || [];
        const missionsInGroup = vehiclesInGroup.reduce((sum, v) => {
          return sum + (missionStatsByVehicle[String(v.username || "").trim().toLowerCase()]?.count || 0);
        }, 0);
        const isExpanded = expandedGroups[aff] ?? true;
        const headerColor = AFFILIATION_HEADER_COLOR[aff] || "from-gray-600/80 to-gray-900/60 text-gray-200 border-gray-500/40";

        return (
          <div key={aff} className="flex flex-col gap-0">
            {/* Accordion Header */}
            <button
              onClick={() => toggleGroup(aff)}
              className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl bg-linear-to-r ${headerColor} border backdrop-blur-sm transition-all duration-300 hover:brightness-110 cursor-pointer`}
            >
              <div className="flex items-center gap-3">
                <div className={`transform transition-transform duration-300 ${isExpanded ? "rotate-0" : "-rotate-90"}`}>
                  <ChevronDown size={18} className="opacity-80" />
                </div>
                <span className="font-black text-lg tracking-wider">{aff}</span>
                <span className={`text-xs font-mono px-2 py-0.5 rounded-full bg-black/30`}>{vehiclesInGroup.length} คัน</span>
                <span className={`text-xs font-mono px-2 py-0.5 rounded-full bg-black/30`}>{missionsInGroup} ภารกิจรวม</span>
              </div>
              <div className="text-xs font-mono opacity-60">
                {isExpanded ? "คลิกเพื่อย่อ ▲" : "คลิกเพื่อขยาย ▼"}
              </div>
            </button>

            {/* Vehicle Cards Grid with Smooth Expand/Collapse Animation */}
            <div className={`grid transition-[grid-template-rows,opacity,margin] duration-300 ease-in-out ${isExpanded ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0 mt-0"}`}>
              <div className="overflow-hidden">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 px-1 pb-1">
                {vehiclesInGroup.map((vehicle: any, idx: number) => {
                  const vid = String(vehicle.username || "").trim().toLowerCase();
                  const stats = missionStatsByVehicle[vid] || { count: 0, latest: null };
                  const isMine = isMyVehicle(vehicle);
                  const canRec = canRecord(vehicle);
                  const affStyle = AFFILIATION_STYLE[aff];
                  const btnColor = AFFILIATION_BTN_COLOR[aff] || "bg-gray-600 hover:bg-gray-500";
                  const badgeColor = AFFILIATION_BADGE[aff] || "bg-gray-800 text-gray-400 border border-gray-600";
                  const isUav = String(vehicle.vehicle_type || vehicle.username || "").toLowerCase().includes("uav");

                  return (
                    <div
                      key={idx}
                      id={`vehicle-card-${vid}`}
                      className={`relative flex flex-col rounded-2xl border overflow-hidden transition-all duration-300 btn-3d
                        ${isDarkMode
                          ? `${affStyle?.darkBg ?? "bg-gray-900/20"} ${affStyle?.darkBorder ?? "border-gray-500/40"} list-item-3d-dark`
                          : `${affStyle?.lightBg ?? "bg-gray-50"}  ${affStyle?.lightBorder ?? "border-gray-300"} btn-menu-light`
                        }
                        ${isMine ? (isDarkMode ? "ring-2 ring-fuchsia-400 shadow-[0_0_30px_rgba(217,70,239,0.35)]" : "ring-2 ring-fuchsia-500 shadow-[0_0_20px_rgba(217,70,239,0.3)]") : ""}
                      `}
                    >
                      {/* MY VEHICLE Badge */}
                      {isMine && (
                        <div className="absolute top-2.5 right-2.5 text-[10px] font-black px-2 py-0.5 rounded-full bg-fuchsia-600/80 text-white tracking-widest z-10">
                          รถของฉัน
                        </div>
                      )}

                      {/* Card Body */}
                      <div className="flex-1 p-4 flex flex-col gap-3">

                        {/* Header: Station Name (Vehicle ID) + Type */}
                        <div className="flex items-start gap-3">
                          <div className={`p-2.5 rounded-xl shrink-0 ${isDarkMode ? "btn-menu-dark" : "btn-menu-light"} ${badgeColor.includes("fuchsia") ? "text-fuchsia-400" : badgeColor.includes("cyan") ? "text-cyan-400" : badgeColor.includes("green") ? "text-green-400" : "text-orange-400"}`}>
                            {isUav ? <Shield size={18} /> : <Truck size={18} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-black text-sm sm:text-base leading-snug ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                              {(vehicle.vehicle_name || vehicle.unit_name)
                                ? `${vehicle.vehicle_name || vehicle.unit_name} (${vehicle.username?.toUpperCase()})`
                                : vehicle.username?.toUpperCase()}
                            </p>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-1 inline-block ${badgeColor}`}>
                              {isUav ? "UAV Mobile" : "CCOC Mobile"}
                            </span>
                          </div>
                        </div>

                        {/* Affiliation Subtitle */}
                        {(vehicle.vehicle_name || vehicle.unit_name) && vehicle.affiliation && (
                          <p className={`text-xs font-mono truncate ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                            {vehicle.affiliation}
                          </p>
                        )}

                        {/* Divider */}
                        <div className={`border-t ${isDarkMode ? "border-white/10" : "border-gray-200"}`} />

                        {/* Mission Stats */}
                        <div className="flex gap-3">
                          <div className="flex items-center gap-1.5">
                            <ClipboardList size={13} className={isDarkMode ? "text-gray-500" : "text-gray-400"} />
                            <span className={`text-xs ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                              <span className="font-black">{stats.count}</span>
                              <span className={`ml-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>ภารกิจ</span>
                            </span>
                          </div>
                        </div>

                        {/* Latest Mission */}
                        {stats.latest ? (
                          <div className={`rounded-xl p-2.5 flex flex-col gap-1 ${isDarkMode ? "bg-black/30" : "bg-white/60"} border ${isDarkMode ? "border-white/5" : "border-gray-200"}`}>
                            <p className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                              ภารกิจล่าสุด
                            </p>
                            <p className={`text-xs font-bold leading-tight line-clamp-2 ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                              {stats.latest.mission_name || "-"}
                            </p>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className={`flex items-center gap-1 text-[10px] ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                                <Calendar size={10} />
                                {formatDate(stats.latest.start_date)}
                              </span>
                              {stats.latest.province && (
                                <span className={`flex items-center gap-1 text-[10px] ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                                  <MapPin size={10} />
                                  {stats.latest.province}
                                </span>
                              )}
                              {stats.latest.people_total && (
                                <span className={`flex items-center gap-1 text-[10px] ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                                  <Users size={10} />
                                  {Number(stats.latest.people_total).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className={`rounded-xl p-2.5 ${isDarkMode ? "bg-black/20" : "bg-gray-100"} border ${isDarkMode ? "border-white/5" : "border-gray-200"}`}>
                            <p className={`text-[10px] font-mono text-center ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}>
                              ยังไม่มีการบันทึกภารกิจ
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Record Button — only shown if canRecord */}
                      {canRec && (
                        (String(vehicle.vehicle_type || "").toUpperCase() === "ALL") ? (
                          <div className="grid grid-cols-2 gap-1.5 p-2 bg-black/40 border-t border-white/10">
                            <button
                              type="button"
                              onClick={() => onRecordMission(vehicle.username, aff, "CCOC Mobile")}
                              className="py-2.5 px-2 font-bold text-xs text-white bg-fuchsia-600 hover:bg-fuchsia-500 rounded-xl flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(217,70,239,0.3)] transition-all active:scale-95 cursor-pointer"
                            >
                              <Truck size={14} /> บันทึก CCOC
                            </button>
                            <button
                              type="button"
                              onClick={() => onRecordMission(vehicle.username, aff, "UAV Mobile")}
                              className="py-2.5 px-2 font-bold text-xs text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(34,211,238,0.3)] transition-all active:scale-95 cursor-pointer"
                            >
                              <Plane size={14} /> บันทึก UAV
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onRecordMission(vehicle.username, aff, isUav ? "UAV Mobile" : "CCOC Mobile")}
                            className={`w-full py-3 px-4 font-black text-sm text-white flex items-center justify-center gap-2 transition-all duration-300 ${btnColor}`}
                          >
                            {isUav ? <Plane size={15} /> : <PenTool size={15} />}
                            {currentUser?.role === "admin" && !isMine
                              ? `บันทึกภารกิจ (${vehicle.username?.toUpperCase()})`
                              : `➕ บันทึกภารกิจ ${isUav ? "UAV Mobile" : "CCOC Mobile"}`}
                          </button>
                        )
                      )}

                      {/* Read-only indicator for non-own vehicles */}
                      {!canRec && (
                        <div className={`w-full py-2.5 px-4 text-center ${isDarkMode ? "bg-black/20 text-gray-600" : "bg-gray-100 text-gray-400"}`}>
                          <span className="text-[11px] font-mono">— ดูข้อมูลได้เท่านั้น —</span>
                        </div>
                      )}
                    </div>
                  );
                })}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {vehicles.length === 0 && (
        <div className={`text-center py-16 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}>
          <Truck size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-mono text-sm">ไม่พบข้อมูลรถในระบบ</p>
          <p className="text-xs mt-1">กำลังโหลดข้อมูล...</p>
        </div>
      )}
    </div>
  );
}
