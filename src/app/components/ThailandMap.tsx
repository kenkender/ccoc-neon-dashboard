"use client";

import React, { useState, useEffect } from "react";
import { Lock, Unlock, ShieldAlert, Car, Truck, MapPin, Eye, X, Activity, Radio, Calendar, Info } from "lucide-react";
import thailandPaths from "./thailand_paths.json";

interface Station {
  id: string;
  vehicle_id: string;
  name: string;
  province: string;
  x: number;
  y: number;
  defaultLocation: string;
}

interface ThailandMapProps {
  currentUser: {
    role: string;
    username: string;
    affiliation: string;
    vehicle_id: string;
  };
  missions: any[];
  onSelectVehicle: (vehicleId: string) => void;
  isDarkMode: boolean;
}

const STATIONS: Station[] = [
  { id: "stc06", vehicle_id: "stc06", name: "stc06 เชียงใหม่", province: "เชียงใหม่", x: 121, y: 121, defaultLocation: "ตำรวจท่องเที่ยวเชียงใหม่" },
  { id: "stc07", vehicle_id: "stc07", name: "stc07 พิษณุโลก", province: "พิษณุโลก", x: 238, y: 238, defaultLocation: "ตำรวจท่องเที่ยวพิษณุโลก" },
  { id: "stc05", vehicle_id: "stc05", name: "stc05 โคราช", province: "นครราชสีมา", x: 345, y: 384, defaultLocation: "ตำรวจท่องเที่ยวนครราชสีมา" },
  { id: "stc03", vehicle_id: "stc03", name: "stc03 อยุธยา", province: "พระนครศรีอยุธยา", x: 238, y: 360, defaultLocation: "ตำรวจท่องเที่ยวอยุธยา" },
  { id: "stc01", vehicle_id: "stc01", name: "stc01 บช.ทท.", province: "กรุงเทพมหานคร", x: 241, y: 463, defaultLocation: "กองบัญชาการตำรวจท่องเที่ยว (บช.ทท.)" },
  { id: "stc09", vehicle_id: "stc09", name: "stc09 สนามศุภชลาศัย", province: "กรุงเทพมหานคร", x: 291, y: 453, defaultLocation: "สนามศุภชลาศัย" },
  { id: "UAV Mobile", vehicle_id: "UAV Mobile", name: "UAV Mobile", province: "กรุงเทพมหานคร", x: 191, y: 468, defaultLocation: "กองบัญชาการตำรวจท่องเที่ยว (UAV)" },
  { id: "stc04", vehicle_id: "stc04", name: "stc04 ชลบุรี", province: "ชลบุรี", x: 282, y: 515, defaultLocation: "ตำรวจท่องเที่ยวพัทยา/ชลบุรี" },
  { id: "stc08", vehicle_id: "stc08", name: "stc08 หัวหิน", province: "ประจวบคีรีขันธ์", x: 173, y: 592, defaultLocation: "ตำรวจท่องเที่ยวหัวหิน" },
  { id: "stc02", vehicle_id: "stc02", name: "stc02 ภูเก็ต", province: "ภูเก็ต", x: 93, y: 844, defaultLocation: "ตำรวจท่องเที่ยวภูเก็ต" },
  { id: "stc10", vehicle_id: "stc10", name: "stc10 หาดใหญ่", province: "สงขลา", x: 232, y: 909, defaultLocation: "ตำรวจท่องเที่ยวหาดใหญ่" }
];

export default function ThailandMap({ currentUser, missions, onSelectVehicle, isDarkMode }: ThailandMapProps) {
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [hoveredStation, setHoveredStation] = useState<Station | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [vehicleStatuses, setVehicleStatuses] = useState<Record<string, { status: "ACTIVE" | "STANDBY"; missionName?: string; province?: string; lastUpdate?: string }>>({});
  const [activePhoto, setActivePhoto] = useState<"front" | "side">("front");

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    // Scale zoom factor based on deltaY for smooth scrolling on both wheels and trackpads
    const zoomFactor = Math.max(0.5, Math.min(Math.exp(-e.deltaY * 0.0015), 2));
    const nextZoom = Math.max(0.8, Math.min(zoom * zoomFactor, 8));

    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = (rect && typeof e.clientX === "number" && !isNaN(e.clientX)) 
      ? (e.clientX - rect.left) 
      : (rect ? rect.width / 2 : 300);
    const mouseY = (rect && typeof e.clientY === "number" && !isNaN(e.clientY)) 
      ? (e.clientY - rect.top) 
      : (rect ? rect.height / 2 : 500);

    setPan(prev => {
      const nextX = mouseX - (mouseX - prev.x) * (nextZoom / zoom);
      const nextY = mouseY - (mouseY - prev.y) * (nextZoom / zoom);
      return {
        x: isNaN(nextX) ? prev.x : nextX,
        y: isNaN(nextY) ? prev.y : nextY
      };
    });
    setZoom(nextZoom);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('.cursor-pointer') || target.closest('button')) return;
    if (typeof e.clientX !== 'number' || typeof e.clientY !== 'number' || isNaN(e.clientX) || isNaN(e.clientY)) return;

    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    if (typeof e.clientX !== 'number' || typeof e.clientY !== 'number' || isNaN(e.clientX) || isNaN(e.clientY)) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // วิเคราะห์สถานะรถแต่ละคันจาก Database ภารกิจล่าสุด
  useEffect(() => {
    const statuses: typeof vehicleStatuses = {};
    const today = new Date().toISOString().split("T")[0];

    STATIONS.forEach((station) => {
      // ค้นหาภารกิจของรถคันนี้
      const vehicleMissions = (missions || [])
        .filter((m) => String(m.vehicle_id).trim() === station.vehicle_id)
        // เรียงลำดับจากล่าสุดตามวันที่จัดงานหรือ timestamp
        .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());

      if (vehicleMissions.length > 0) {
        const latest = vehicleMissions[0];
        
        // เช็คว่าอยู่ในห้วงเวลาจัดภารกิจหรือไม่
        const startDate = latest.start_date ? new Date(latest.start_date).toISOString().split("T")[0] : null;
        const endDate = latest.end_date ? new Date(latest.end_date).toISOString().split("T")[0] : null;
        
        const isActive = startDate && endDate && today >= startDate && today <= endDate;

        statuses[station.vehicle_id] = {
          status: isActive ? "ACTIVE" : "STANDBY",
          missionName: latest.mission_name,
          province: latest.province,
          lastUpdate: latest.timestamp ? new Date(latest.timestamp).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' }) : undefined
        };
      } else {
        statuses[station.vehicle_id] = {
          status: "STANDBY"
        };
      }
    });

    setVehicleStatuses(statuses);
  }, [missions]);

  // ฟังก์ชันตรวจสอบสิทธิ์การคลิกเลือกรถ
  const handleStationClick = (station: Station) => {
    const isAdmin = currentUser.role === "admin";
    const isOwner = currentUser.vehicle_id === station.vehicle_id;

    if (isAdmin || isOwner) {
      setSelectedStation(station);
      setAuthError(null);
    } else {
      setAuthError(`ปฏิเสธการเข้าถึง: รหัสของคุณผูกกับยานพาหนะ "${currentUser.vehicle_id}" เท่านั้น ไม่สามารถควบคุม "${station.vehicle_id}" ของสถานีอื่นได้`);
      
      // อนุมัติลบการแจ้งเตือนหลังจากผ่านไป 4 วินาที
      setTimeout(() => {
        setAuthError(null);
      }, 4000);
    }
  };

  const handleConfirmSelection = () => {
    if (selectedStation) {
      onSelectVehicle(selectedStation.vehicle_id);
    }
  };

  const getStatusColor = (vehicleId: string) => {
    const info = vehicleStatuses[vehicleId];
    if (!info) return "bg-green-500 border-green-300 shadow-[0_0_10px_#22c55e]";
    return info.status === "ACTIVE" 
      ? "bg-fuchsia-500 border-fuchsia-300 shadow-[0_0_15px_#d946ef] animate-pulse"
      : "bg-green-500 border-green-300 shadow-[0_0_10px_#22c55e]";
  };

  const checkHasAccess = (vehicleId: string) => {
    return currentUser.role === "admin" || currentUser.vehicle_id === vehicleId;
  };

  return (
    <div className="w-full h-full flex flex-col lg:flex-row gap-6 relative font-sans select-none overflow-hidden">
      
      {/* ⚠️ ไฟไซเรนแจ้งเตือนความปลอดภัย (Security Denied Glow) */}
      {authError && (
        <div className="absolute inset-0 bg-red-950/20 pointer-events-none z-40 border border-red-500/50 animate-pulse flex items-center justify-center">
          <div className="bg-black/90 border border-red-500 p-6 rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.5)] flex flex-col items-center gap-3 max-w-md pointer-events-auto">
            <ShieldAlert size={48} className="text-red-500 animate-bounce" />
            <h4 className="text-red-500 font-black tracking-widest text-lg font-mono">ACCESS RESTRICTED</h4>
            <p className="text-gray-300 text-sm text-center font-bold">{authError}</p>
            <button onClick={() => setAuthError(null)} className="mt-2 text-xs font-mono text-gray-500 hover:text-white border border-gray-800 hover:border-gray-500 px-3 py-1.5 rounded-lg transition-all">CLOSE SYSTEM WARNING</button>
          </div>
        </div>
      )}

      {/* ฝั่งซ้าย: แผนที่ประเทศไทย */}
      <div 
        className={`flex-1 flex flex-col items-center justify-center p-4 rounded-3xl relative h-[84vh] overflow-hidden select-none transition-colors duration-500 ${
          isDarkMode ? 'input-3d-dark' : 'input-3d-light'
        } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        
        {/* หัวข้อหน้าจอแผนที่ไซไฟ */}
        <div className="absolute top-4 left-6 z-10 pointer-events-none">
          <div className="flex items-center gap-2">
            <Radio className="text-cyan-400 animate-ping" size={16} />
            <h3 className={`text-lg font-black tracking-wider uppercase font-mono ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
              CCOC TACTICAL DIGITAL MAP
            </h3>
          </div>
          <p className="text-[10px] text-gray-500 font-mono tracking-widest mt-0.5">SATELLITE POSITIONING SYSTEM // ACTIVE STATUS</p>
        </div>

        {/* Floating Zoom Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10" onClick={(e) => e.stopPropagation()}>
          <button 
            onClick={() => {
              const nextZoom = Math.min(zoom * 1.25, 8);
              setPan(prev => ({
                x: prev.x - (300 - prev.x) * ((nextZoom - zoom) / zoom),
                y: prev.y - (500 - prev.y) * ((nextZoom - zoom) / zoom)
              }));
              setZoom(nextZoom);
            }} 
            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg btn-3d ${
              isDarkMode 
                ? 'bg-slate-900 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-950/40' 
                : 'bg-white border border-slate-350 text-slate-700 shadow-md hover:bg-slate-50'
            }`}
            title="ซูมเข้า"
          >
            +
          </button>
          <button 
            onClick={() => {
              const nextZoom = Math.max(zoom / 1.25, 0.8);
              setPan(prev => ({
                x: prev.x - (300 - prev.x) * ((nextZoom - zoom) / zoom),
                y: prev.y - (500 - prev.y) * ((nextZoom - zoom) / zoom)
              }));
              setZoom(nextZoom);
            }} 
            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg btn-3d ${
              isDarkMode 
                ? 'bg-slate-900 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-950/40' 
                : 'bg-white border border-slate-350 text-slate-700 shadow-md hover:bg-slate-50'
            }`}
            title="ซูมออก"
          >
            -
          </button>
          <button 
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }} 
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold btn-3d ${
              isDarkMode 
                ? 'bg-slate-900 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-950/40' 
                : 'bg-white border border-slate-350 text-slate-700 shadow-md hover:bg-slate-50'
            }`}
            title="รีเซ็ตตำแหน่ง"
          >
            RST
          </button>
        </div>

        {/* แผนที่ SVG */}
        <div className="relative w-full h-full flex items-center justify-center mt-6 pointer-events-none" style={{ overflow: 'visible' }}>
          <svg
            viewBox="0 0 600 1000"
            className="w-full h-full filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] select-none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ overflow: 'visible' }}
          >
            <defs>
              {/* แสงเรืองแสงสีฟ้านีออนสำหรับเส้นขอบแผนที่ */}
              <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`} className={`pointer-events-auto origin-center ${isDragging ? "" : "transition-transform duration-200 ease-out"}`}>
              {/* โครงสร้างร่างแผนที่ประเทศไทยสไตล์ Cyber Grid */}
              {/* เส้นเชื่อมโยงยุทธวิธี (เชื่อมภาคเหนือ ลงมาภาคกลาง และใต้) */}
              <g stroke={isDarkMode ? "rgba(6, 182, 212, 0.15)" : "rgba(6, 182, 212, 0.3)"} strokeWidth="1.5" strokeDasharray="5,5" fill="none">
                <line x1="121" y1="121" x2="238" y2="238" />
                <line x1="238" y1="238" x2="238" y2="360" />
                <line x1="238" y1="360" x2="345" y2="384" />
                <line x1="238" y1="360" x2="241" y2="463" />
                <line x1="241" y1="463" x2="282" y2="515" />
                <line x1="241" y1="463" x2="173" y2="592" />
                <line x1="173" y1="592" x2="93" y2="844" />
                <line x1="93" y1="844" x2="232" y2="909" />
              </g>

              {/* ร่างแผนที่ประเทศไทยจริงพร้อมขอบจังหวัดย่อย */}
              <g className="transition-colors duration-500">
                {Object.entries(thailandPaths.paths).map(([provName, pathD]) => {
                  const hasStation = STATIONS.some(s => s.province === provName || (provName === "Bangkok Metropolis" && s.province === "กรุงเทพมหานคร"));
                  return (
                    <path
                      key={provName}
                      d={pathD}
                      fill={
                        hasStation
                          ? isDarkMode
                            ? "rgba(6, 182, 212, 0.15)"
                            : "rgba(6, 182, 212, 0.1)"
                          : isDarkMode
                          ? "rgba(15, 23, 42, 0.5)"
                          : "rgba(226, 232, 240, 0.3)"
                      }
                      stroke={
                        hasStation
                          ? isDarkMode
                            ? "rgba(34, 211, 238, 0.6)"
                            : "rgba(2, 132, 199, 0.7)"
                          : isDarkMode
                          ? "rgba(8, 145, 178, 0.18)"
                          : "rgba(148, 163, 184, 0.35)"
                      }
                      strokeWidth={hasStation ? 1.5 : 0.8}
                      className="transition-all duration-300 hover:fill-cyan-500/20 hover:stroke-cyan-400 hover:stroke-[2]"
                    >
                      <title>{provName}</title>
                    </path>
                  );
                })}
              </g>

              {/* หมุดสถานีรถโมบาย */}
              {STATIONS.map((station) => {
                const hasAccess = checkHasAccess(station.vehicle_id);
                const info = vehicleStatuses[station.vehicle_id];
                const isActive = info?.status === "ACTIVE";
                const isSelected = selectedStation?.id === station.id;
                const isHovered = hoveredStation?.id === station.id;

                return (
                  <g
                    key={station.id}
                    transform={`translate(${station.x}, ${station.y})`}
                    className="cursor-pointer"
                    onClick={() => handleStationClick(station)}
                    onMouseEnter={() => setHoveredStation(station)}
                    onMouseLeave={() => setHoveredStation(null)}
                  >
                    {/* คลื่นวิทยุเรดาร์ล้อมหมุด (Ping animation) */}
                    {isActive && (
                      <circle
                        r="22"
                        className="fill-none stroke-fuchsia-500 opacity-60 animate-ping"
                        style={{ transformOrigin: "0px 0px" }}
                      />
                    )}
                    {isSelected && (
                      <circle
                        r="26"
                        className="fill-none stroke-cyan-400 opacity-80 animate-pulse"
                        strokeWidth="2"
                        style={{ transformOrigin: "0px 0px" }}
                      />
                    )}

                    {/* HTML Mobile Truck Icon Marker via foreignObject (Vertical Stacked Label) */}
                    <foreignObject x="-24" y="-28" width="48" height="56" className="overflow-visible">
                      <div className="flex flex-col items-center gap-1 w-full pointer-events-auto">
                        {/* Glowing Truck Badge (Color changes based on online/offline status) */}
                        <div className={`relative w-10 h-10 rounded-2xl flex items-center justify-center border transition-all duration-300 ${
                          isActive
                            ? isSelected
                              ? "bg-fuchsia-950/95 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)] text-fuchsia-400"
                              : isHovered
                              ? "bg-fuchsia-950/90 border-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,0.7)] text-fuchsia-400 scale-105"
                              : "bg-fuchsia-950/90 border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.5)] text-fuchsia-400"
                            : isDarkMode
                            ? isSelected
                              ? "bg-green-950/95 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)] text-green-400"
                              : isHovered
                              ? "bg-green-950/90 border-green-400 shadow-[0_0_15px_rgba(34,197,94,0.7)] text-green-400 scale-105"
                              : "bg-green-950/90 border-green-600/80 shadow-[0_0_10px_rgba(34,197,94,0.3)] text-green-400"
                            : isSelected
                            ? "bg-green-50 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)] text-green-700"
                            : isHovered
                            ? "bg-green-100 border-green-500 text-green-700 scale-105"
                            : "bg-green-50 border-green-300 text-green-600 shadow-sm"
                        }`}>
                          {/* Truck Icon */}
                          <Truck size={18} className="drop-shadow-[0_0_4px_currentColor]" />

                          {/* Access status icon (Lock if restricted) */}
                          {!hasAccess && (
                            <span className="absolute -bottom-1 -right-1 bg-red-950 border border-red-500 text-red-500 rounded-md p-0.5 scale-75 shadow-lg">
                              <Lock size={8} />
                            </span>
                          )}
                          
                          {/* Access status icon (Unlock if own vehicle) */}
                          {hasAccess && !currentUser.role.includes("admin") && (
                            <span className="absolute -bottom-1 -right-1 bg-cyan-950 border border-cyan-500 text-cyan-400 rounded-md p-0.5 scale-75 shadow-lg">
                              <Unlock size={8} />
                            </span>
                          )}
                        </div>

                        {/* Label Text Centered Directly Below Pin */}
                        <div className={`px-1.5 py-0.5 rounded text-[8px] font-bold font-mono border shadow-xs transition-all duration-300 ${
                          isSelected
                            ? "bg-cyan-500 text-black border-cyan-400"
                            : isDarkMode
                            ? "bg-slate-950/90 border-slate-800 text-slate-300"
                            : "bg-white border-slate-200 text-slate-700"
                        }`}>
                          {station.id.toUpperCase()}
                        </div>
                      </div>
                    </foreignObject>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* เมนูระบุความหมายสีกระพริบ */}
        <div className="absolute bottom-4 left-6 flex flex-wrap gap-4 z-10 text-[10px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></span>
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>STANDBY (พร้อมปฏิบัติงาน)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-500 shadow-[0_0_10px_#d946ef] animate-pulse"></span>
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>ACTIVE (กำลังปฏิบัติภารกิจ)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="flex items-center justify-center w-3.5 h-3.5 rounded bg-red-950 border border-red-750 text-red-500 scale-75 font-bold"><Lock size={8}/></span>
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>RESTRICTED (ไม่ใช่รถโมบายของคุณ)</span>
          </div>
        </div>
      </div>

      {/* ฝั่งขวา: รายละเอียดของรถที่ถูกเลือก หรือการสรุปภาพรวม */}
      <div className={`w-full lg:w-96 flex flex-col p-6 rounded-3xl h-[84vh] transition-all anim-fade-in-right ${isDarkMode ? 'plate-3d-dark' : 'plate-3d-light'}`}>
        
        {selectedStation ? (
          // --- รายละเอียดของรถที่เลือก ---
          <div className="flex-1 flex flex-col justify-between h-full">
            <div className="space-y-5">
              {/* ส่วนหัวรายละเอียด */}
              <div className="flex justify-between items-start border-b border-white/10 pb-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${getStatusColor(selectedStation.vehicle_id)}`}></span>
                    <span className="text-[10px] font-mono tracking-widest text-gray-500 uppercase">TELEMETRY DATA</span>
                  </div>
                  <h4 className={`text-xl font-black mt-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    {selectedStation.vehicle_id.toUpperCase()}
                  </h4>
                </div>
                <button
                  onClick={() => setSelectedStation(null)}
                  className={`p-2 rounded-xl btn-3d ${isDarkMode ? 'btn-menu-dark text-gray-400' : 'btn-menu-light text-gray-600'}`}
                >
                  <X size={16} />
                </button>
              </div>

              {/* 📷 Sci-Fi Web Camera feed (ภาพรถที่อัปโหลด) */}
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-cyan-500/20 bg-black flex items-center justify-center group">
                <div className="absolute inset-0 bg-linear-to-b from-transparent via-cyan-500/5 to-transparent bg-[length:100%_4px] pointer-events-none z-10 animate-scan"></div>
                <div className="absolute top-2 left-3 bg-red-600 text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded animate-pulse z-20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white"></span> CCTV LIVE FEED
                </div>

                {/* ภาพถ่ายรถโมบายสลับกล้องหน้า/ข้าง */}
                <img
                  src={activePhoto === "front" ? "/stc_vehicle_front.jpg" : "/stc_vehicle_side.jpg"}
                  alt="Mobile Unit CCTV Feed"
                  className="w-full h-full object-contain transition-all duration-500 group-hover:scale-105"
                />

                {/* เมนูเลือกสลับรูปหน้าหลัง */}
                <div className="absolute bottom-2 right-2 z-20 flex gap-1 bg-black/60 backdrop-blur-xs p-1 rounded-lg">
                  <button
                    onClick={() => setActivePhoto("front")}
                    className={`text-[8.5px] font-mono px-2 py-1 rounded transition-all ${
                      activePhoto === "front" ? "bg-cyan-500 text-black font-bold" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    กล้องหน้าเฉียง
                  </button>
                  <button
                    onClick={() => setActivePhoto("side")}
                    className={`text-[8.5px] font-mono px-2 py-1 rounded transition-all ${
                      activePhoto === "side" ? "bg-cyan-500 text-black font-bold" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    กล้องด้านข้าง
                  </button>
                </div>
              </div>

              {/* ข้อมูลทั่วไป */}
              <div className="space-y-3.5">
                <div className={`p-4 rounded-xl ${isDarkMode ? 'input-3d-dark' : 'input-3d-light'}`}>
                  <div className="flex items-center gap-2 text-xs text-gray-500 font-bold mb-1">
                    <MapPin size={13} /> พิกัดตั้งต้น (Base Station)
                  </div>
                  <p className={`text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {selectedStation.defaultLocation}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{selectedStation.province}</p>
                </div>

                <div className={`p-4 rounded-xl ${isDarkMode ? 'input-3d-dark' : 'input-3d-light'}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-bold">
                      <Activity size={13} /> สถานะความเคลื่อนไหว
                    </div>
                    <span className={`text-[10.5px] px-2 py-0.5 rounded font-bold font-mono ${
                      vehicleStatuses[selectedStation.vehicle_id]?.status === "ACTIVE"
                        ? "bg-fuchsia-950/40 text-fuchsia-400 border border-fuchsia-500/20"
                        : "bg-green-950/40 text-green-400 border border-green-500/20"
                    }`}>
                      {vehicleStatuses[selectedStation.vehicle_id]?.status || "STANDBY"}
                    </span>
                  </div>

                  {vehicleStatuses[selectedStation.vehicle_id]?.status === "ACTIVE" ? (
                    <div className="space-y-1">
                      <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        กำลังออกปฏิบัติงาน: {vehicleStatuses[selectedStation.vehicle_id].missionName}
                      </p>
                      <p className="text-[11px] text-cyan-400 font-mono">
                        สถานที่: {vehicleStatuses[selectedStation.vehicle_id].province}
                      </p>
                      <p className="text-[9.5px] text-gray-500">
                        อัปเดตล่าสุด: {vehicleStatuses[selectedStation.vehicle_id].lastUpdate}
                      </p>
                    </div>
                  ) : (
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      ยานพาหนะพร้อมใช้งาน จอดสแตนด์บายประจุดยุทธศาสตร์ที่หน่วยงาน
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ปุ่มกดอนุมัติดำเนินการเข้าหน้าลงภารกิจ */}
            <div className="pt-4 mt-auto">
              <button
                onClick={handleConfirmSelection}
                className="w-full btn-3d btn-primary-3d py-4 rounded-xl font-bold flex items-center justify-center gap-2 text-sm tracking-wider"
              >
                <Unlock size={18} />
                นำทางเข้าสู่หน้าบันทึกภารกิจ
              </button>
              <p className="text-center text-[9px] text-gray-500 font-mono mt-2 uppercase">
                SECURE AUTHENTICATION CLEARED // REDIRECT PERMITTED
              </p>
            </div>
          </div>
        ) : (
          // --- หน้าเริ่มต้น แสดงสรุปจำนวนสถิติบอร์ดไซไฟ ---
          <div className="flex-1 flex flex-col justify-between h-full">
            <div className="space-y-5">
              <div className="border-b border-white/10 pb-3">
                <h4 className={`text-lg font-black tracking-wide ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  ภาพรวมยานพาหนะ
                </h4>
                <p className="text-[10px] text-gray-500 font-mono">STATIONARY FLEET OVERVIEW</p>
              </div>

              {/* การ์ดสถิติจำลอง */}
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-2xl text-center ${isDarkMode ? 'input-3d-dark' : 'input-3d-light'}`}>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">รถทั้งหมด</p>
                  <p className="text-3xl font-black text-cyan-400 font-mono mt-1">11</p>
                </div>
                <div className={`p-4 rounded-2xl text-center ${isDarkMode ? 'input-3d-dark' : 'input-3d-light'}`}>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">กำลังทำงาน</p>
                  <p className="text-3xl font-black text-fuchsia-400 font-mono mt-1 animate-pulse">
                    {Object.values(vehicleStatuses).filter((v) => v.status === "ACTIVE").length}
                  </p>
                </div>
              </div>

              {/* ข้อแนะนำการใช้งาน */}
              <div className={`p-5 rounded-2xl flex gap-3.5 border ${
                isDarkMode 
                  ? 'bg-cyan-950/20 border-cyan-500/20 text-cyan-400' 
                  : 'bg-cyan-50 border-cyan-200 text-cyan-800'
              }`}>
                <Info className="shrink-0 mt-0.5" size={18} />
                <div className="text-xs space-y-1">
                  <p className="font-bold">คู่มือการเริ่มต้น:</p>
                  <p className="leading-relaxed text-gray-500">
                    โปรดจิ้มเลือกหมุดจุดกลมบนแผนที่ตามจังหวัดที่ต้องการลงภารกิจ
                  </p>
                  <p className="leading-relaxed font-bold">
                    {currentUser.role === 'admin' 
                      ? "สิทธิ์แอดมิน: สามารถคลิกและนำทางรถโมบายได้ทุกคัน" 
                      : `คุณเป็นเจ้าหน้าที่ประจำรถ: สามารถลงรายการได้เฉพาะ "${currentUser.vehicle_id}" เท่านั้น`}
                  </p>
                </div>
              </div>

              {/* ข้อมูลบัญชีที่เข้าใช้ */}
              <div className={`p-4 rounded-2xl border ${isDarkMode ? 'border-gray-800/80 bg-black/40' : 'border-gray-200 bg-white/40'}`}>
                <p className="text-[10px] text-gray-500 font-mono">AUTHORIZED OPERATOR</p>
                <div className="flex justify-between items-center mt-2">
                  <div className="overflow-hidden">
                    <p className={`text-sm font-bold truncate ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{currentUser.username}</p>
                    <p className="text-[10px] text-gray-500 font-mono truncate">{currentUser.affiliation}</p>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    currentUser.role === "admin" ? "bg-red-950/50 text-red-400" : "bg-cyan-950/50 text-cyan-400"
                  }`}>
                    {currentUser.role.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center pb-2 border-t border-white/5 pt-4">
              <p className="text-[9.5px] text-gray-500 font-mono">
                SECURE PLATFORM MONITORED // LOGGED AS {currentUser.username.toUpperCase()}
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
