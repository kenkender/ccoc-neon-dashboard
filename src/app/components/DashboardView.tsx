"use client";

import { useState } from "react";
import { Activity, Filter, List, MapPin, Users, Car, Trophy, AlertTriangle, Map, Download, Shield, RefreshCw} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import IncidentModal from "./IncidentModal";


const VEHICLE_NAMES: Record<string, string> = {
  "stc01": "1. stc01 บช.ทท.", "stc02": "2. stc02 ภูเก็ต", "stc03": "3. stc03 อยุธยา",
  "stc04": "4. stc04 ชลบุรี", "stc05": "5. stc05 โคราช", "stc06": "6. stc06 เชียงใหม่",
  "stc07": "7. stc07 พิษณุโลก", "stc08": "8. stc08 หัวหิน", "stc09": "9. stc09 สนามศุภชลาศัย",
  "stc10": "10. stc10 หาดใหญ่", "uav mobile": "11. UAV Mobile", "UAV Mobile": "11. UAV Mobile"
};

export default function DashboardView({ missions, refreshData }: { missions: any[], refreshData?: any }) {
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterVehicle, setFilterVehicle] = useState("ALL");
  const [filterAffiliation, setFilterAffiliation] = useState("ALL");
  const [isExporting, setIsExporting] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleLocalRefresh = async () => { 
    setIsRefreshing(true);
    if (refreshData) {
      await refreshData();
    }
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleExport = async () => {
    setIsExporting(true);
    const { toPng } = await import('html-to-image');
    const element = document.getElementById('dashboard-content');

    if (!element) {
      setIsExporting(false);
      return;
    }

    // 1. ดึงความกว้างและความสูงที่แท้จริงของเนื้อหาทั้งหมด (รวมส่วนที่มองไม่เห็น)
    const scrollWidth = element.scrollWidth;
    const scrollHeight = element.scrollHeight;

    // 2. ปลดล็อกข้อจำกัดเพื่อเตรียมวาดภาพ
    const originalWidth = element.style.width;
    const originalHeight = element.style.height;
    element.style.width = `${scrollWidth}px`;
    element.style.height = `${scrollHeight}px`;

    // หน่วงเวลาให้ DOM จัด Layout ใหม่เสร็จสมบูรณ์
    await new Promise((resolve) => setTimeout(resolve, 300));

    try {
      const dataUrl = await toPng(element, {
        backgroundColor: '#050505',
        pixelRatio: 2,
        // 3. แจ้ง html-to-image ให้สร้าง Canvas เท่ากับขนาดเนื้อหาจริงเป๊ะๆ
        width: scrollWidth,
        height: scrollHeight,
        style: {
          width: `${scrollWidth}px`,
          height: `${scrollHeight}px`,
          transform: 'scale(1)',
          transformOrigin: 'top left',
        },
        filter: (node: any) => node?.id !== 'export-btn'
      });
      
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `CCOC_Dashboard_${new Date().toISOString().split('T')[0]}.png`;
      link.click();
    } catch (err) {
      console.error('Export Failed:', err);
      alert('❌ ไม่สามารถแคปภาพได้');
    } finally {
      // 4. ทำความสะอาด คืนค่า UI กลับสู่สภาวะปกติ
      if (element) {
        element.style.width = originalWidth || '';
        element.style.height = originalHeight || '';
      }
      setIsExporting(false);
    }
  };

  const filteredMissions = missions.filter((m: any) => {
    let passDate = true; let passVehicle = true; let passAffiliation = true;
    if (m.start_date) {
      const mDate = new Date(m.start_date);
      const mDateStr = `${mDate.getFullYear()}-${String(mDate.getMonth() + 1).padStart(2, '0')}-${String(mDate.getDate()).padStart(2, '0')}`;
      if (filterStartDate) passDate = mDateStr >= filterStartDate;
      if (passDate && filterEndDate) passDate = mDateStr <= filterEndDate;
    }
    if (filterVehicle !== "ALL") passVehicle = String(m.vehicle_id).trim().toLowerCase() === filterVehicle.toLowerCase();
    if (filterAffiliation !== "ALL") passAffiliation = String(m.affiliation || "").trim() === filterAffiliation;
    return passDate && passVehicle && passAffiliation;
  });

  const kpiTotalMissions = filteredMissions.length;
  const kpiTotalDistance = filteredMissions.reduce((sum: number, m: any) => sum + Number(m.distance_km || 0), 0);
  const kpiTotalPeople = filteredMissions.reduce((sum: number, m: any) => sum + Number(m.people_total || 0), 0);

  const vehicleStats = filteredMissions.reduce((acc: any, m: any) => { const v = String(m.vehicle_id || 'Unknown').toLowerCase(); acc[v] = (acc[v] || 0) + 1; return acc; }, {});
  const chartDataVehicle = Object.keys(vehicleStats).map(key => ({ name: VEHICLE_NAMES[key] || key.toUpperCase(), shortName: key.toUpperCase(), count: vehicleStats[key]}));
  const topVehicles = [...chartDataVehicle].sort((a, b) => b.count - a.count).slice(0, 10);

  const provinceStats = filteredMissions.reduce((acc: any, m: any) => { const p = m.province || 'ไม่ระบุ'; acc[p] = (acc[p] || 0) + 1; return acc; }, {});
  const chartDataProvince = Object.keys(provinceStats).map(key => ({ name: key, count: provinceStats[key] }));
  const topProvinces = [...chartDataProvince].sort((a, b) => b.count - a.count).slice(0, 10);
  
  const affiliationStats = filteredMissions.reduce((acc: any, m: any) => { 
    let aff = String(m.affiliation || "").trim();
    if (!aff || aff === "-") aff = "ไม่ระบุสังกัด";
    acc[aff] = (acc[aff] || 0) + 1; 
    return acc; 
  }, {});

  const orderWeight: Record<string, number> = {
    "ฝ่ายอำนวยการ 6": 1,
    "บช.ทท.": 1,
    "บก.ทท.1": 2,
    "บก.ทท.2": 3,
    "บก.ทท.3": 4
  };

  const chartDataAffiliation = Object.keys(affiliationStats)
    .map((key, index) => ({ 
      name: key, 
      count: affiliationStats[key],
      fill: ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e', '#ec4899'][index % 6] 
    }))
    .sort((a, b) => {
      const weightA = orderWeight[a.name] || 99;
      const weightB = orderWeight[b.name] || 99;
      return weightA - weightB;
    });

  const incidentStats = filteredMissions.reduce((acc: any, m: any) => {
    let report = String(m.incident_report || "").trim();
    if (report === "" || report === "-" || report === "ปกติ" || report.includes("เหตุการณ์ปกติ")) { report = "เหตุการณ์ปกติ / ไม่มีเหตุ"; }
    acc[report] = (acc[report] || 0) + 1; return acc;
  }, {});
  const topIncidents = Object.keys(incidentStats).map(key => ({ name: key, count: incidentStats[key] })).sort((a, b) => b.count - a.count).slice(0, 10);

  return (
    <div id="dashboard-content" className={`w-full mx-auto relative transition-all p-3 md:p-4 bg-[#0f151f] flex flex-col rounded-2xl ${isExporting ? 'h-auto overflow-visible shrink-0' : 'h-full overflow-hidden'}`}>

      {isExporting && (
        <style>{`
          #dashboard-content {
            height: auto !important;
            min-height: fit-content !important;
            overflow: visible !important;
          }
          #dashboard-content .chart-grid-container {
            height: 320px !important;
            flex: none !important;
          }
          #dashboard-content .lists-grid-container {
            height: auto !important;
            flex: none !important;
          }
          #dashboard-content * {
            animation: none !important;
            transition: none !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
          }
        `}</style>
      )}

      {/* Header Section */}
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center mb-3 pb-2 border-b border-purple-900/50 gap-3 shrink-0 ${isExporting ? '' : 'anim-fade-in-down'}`}>
        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-pink-500 flex items-center gap-2 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]"><Activity size={24} className="text-purple-400" /> แดชบอร์ดวิเคราะห์สถิติ</h2>
        
        <div className="flex flex-wrap items-center gap-2 bg-gray-950/95 p-1.5 rounded-xl border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
          <Filter className="text-purple-400 ml-2" size={16} />
          <input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className="bg-black/50 text-[11px] text-gray-300 p-1.5 rounded border border-gray-700 focus:outline-none focus:border-purple-500 transition-colors" style={{colorScheme: "dark"}} />
          <span className="text-gray-600">-</span>
          <input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className="bg-black/50 text-[11px] text-gray-300 p-1.5 rounded border border-gray-700 focus:outline-none focus:border-purple-500 transition-colors" style={{colorScheme: "dark"}} />
          
          <select value={filterAffiliation} onChange={(e) => setFilterAffiliation(e.target.value)} className="bg-black/50 text-[11px] text-orange-400 p-1.5 rounded border border-orange-900/50 focus:outline-none font-bold transition-colors">
            <option value="ALL">ทุกสังกัด (ALL UNITS)</option>
            <option value="บช.ทท.">บช.ทท.</option><option value="บก.ทท.1">บก.ทท.1</option><option value="บก.ทท.2">บก.ทท.2</option><option value="บก.ทท.3">บก.ทท.3</option>
          </select>

          <select value={filterVehicle} onChange={(e) => setFilterVehicle(e.target.value)} className="bg-black/50 text-[11px] text-purple-300 p-1.5 rounded border border-purple-900/50 focus:outline-none font-bold transition-colors">
            <option value="ALL">ทุกคัน (ALL VEHICLES)</option>
            {Object.keys(VEHICLE_NAMES).map(k => <option key={k} value={k}>{VEHICLE_NAMES[k]}</option>)}
          </select>

          <button onClick={handleLocalRefresh} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-cyan-400 text-[11px] font-bold px-4 py-1.5 rounded-lg transition-all border border-cyan-900/50 shadow-lg active:scale-95">
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} /> REFRESH
          </button>

          <button id="export-btn" onClick={handleExport} className="flex items-center gap-2 bg-linear-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white text-[11px] font-bold px-4 py-1.5 rounded-lg transition-all border border-purple-400/50 ml-1 shadow-[0_0_15px_rgba(168,85,247,0.5)] active:scale-95">
            <Download size={14} /> EXPORT .PNG
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 shrink-0">
        <div className="relative group bg-gray-900/90 p-3 md:p-4 rounded-2xl border border-purple-500/20 shadow-[0_15px_40px_rgba(168,85,247,0.15)] flex items-center gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-purple-500/30 hover:border-purple-500/50 overflow-hidden anim-fade-in-up" style={{ animationDelay: '60ms' }}>
          <div className="absolute top-0 left-0 w-1.5 h-full bg-linear-to-b from-purple-500 to-transparent opacity-70 group-hover:from-purple-400 group-hover:to-purple-600 transition-colors"></div>
          <div className="bg-purple-900/40 p-3 rounded-xl text-purple-400 border border-purple-500/20 shadow-[inset_0_0_10px_rgba(168,85,247,0.2)] relative z-10"><List size={24}/></div>
          <div className="relative z-10"><p className="text-purple-300/70 text-[11px] font-bold tracking-widest drop-shadow-md">รวมภารกิจทั้งหมด</p><p className="text-3xl font-black text-purple-200 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]">{kpiTotalMissions}</p></div>
        </div>
        
        <div className="relative group bg-gray-900/90 p-3 md:p-4 rounded-2xl border border-cyan-500/20 shadow-[0_15px_40px_rgba(6,182,212,0.15)] flex items-center gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-cyan-500/30 hover:border-cyan-500/50 overflow-hidden anim-fade-in-up" style={{ animationDelay: '150ms' }}>
          <div className="absolute top-0 left-0 w-1.5 h-full bg-linear-to-b from-cyan-500 to-transparent opacity-70 group-hover:from-cyan-400 group-hover:to-cyan-600 transition-colors"></div>
          <div className="bg-cyan-900/40 p-3 rounded-xl text-cyan-400 border border-cyan-500/20 shadow-[inset_0_0_10px_rgba(6,182,212,0.2)] relative z-10"><MapPin size={24}/></div>
          <div className="relative z-10"><p className="text-cyan-300/70 text-[11px] font-bold tracking-widest drop-shadow-md">ระยะทางปฏิบัติการ (กม.)</p><p className="text-3xl font-black text-cyan-200 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]">{kpiTotalDistance.toLocaleString()}</p></div>
        </div>
        
        <div className="relative group bg-gray-900/90 p-3 md:p-4 rounded-2xl border border-green-500/20 shadow-[0_15px_40px_rgba(34,197,94,0.15)] flex items-center gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-green-500/30 hover:border-green-500/50 overflow-hidden anim-fade-in-up" style={{ animationDelay: '240ms' }}>
          <div className="absolute top-0 left-0 w-1.5 h-full bg-linear-to-b from-green-500 to-transparent opacity-70 group-hover:from-green-400 group-hover:to-green-600 transition-colors"></div>
          <div className="bg-green-900/40 p-3 rounded-xl text-green-400 border border-green-500/20 shadow-[inset_0_0_10px_rgba(34,197,94,0.2)] relative z-10"><Users size={24}/></div>
          <div className="relative z-10"><p className="text-green-300/70 text-[11px] font-bold tracking-widest drop-shadow-md">จำนวนผู้เข้าร่วมงานรวม</p><p className="text-3xl font-black text-green-200 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]">{kpiTotalPeople.toLocaleString()}</p></div>
        </div>
      </div>

      {/* Chart Panels (Flex-1) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3 flex-1 min-h-0 chart-grid-container">
        <div className="relative group bg-gray-900/85 border border-gray-700/50 p-3 md:p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col transition-all duration-500 hover:border-purple-500/30 hover:shadow-purple-500/10 anim-fade-in-up" style={{ animationDelay: '320ms' }}>
          <h3 className="text-purple-400 font-bold mb-2 text-[13px] tracking-widest flex items-center gap-2 shrink-0 drop-shadow-md"><Car size={18} className="anim-float"/> สถิติภารกิจของรถ CCOC Mobile</h3>
          <div className="flex-1 min-h-0 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataVehicle} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVehicle" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c084fc" stopOpacity={1}/>
                    <stop offset="80%" stopColor="#7e22ce" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#3b0764" stopOpacity={0.3}/>
                  </linearGradient>
                  <filter id="shadowPurple">
                    <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="#7e22ce" floodOpacity="0.5"/>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="shortName" stroke="#666" tick={{fill: '#888', fontSize: 11}} axisLine={false} tickLine={false} interval={0} />
                <YAxis stroke="#666" tick={{fill: '#888', fontSize: 10}} allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip 
                    contentStyle={{backgroundColor: '#0a0a0a', borderColor: '#a855f7', borderRadius: '8px', fontSize: '12px', boxShadow: '0 10px 25px rgba(168,85,247,0.2)'}} 
                    itemStyle={{color: '#e879f9', fontWeight: 'bold'}} 
                    cursor={{fill: '#ffffff0a'}}
                    labelFormatter={(label: any, payload: any) => {
                      if (payload && payload.length > 0) {
                        return payload[0].payload.name;
                      }
                      return label;
                    }}
                  />                
                  <Bar dataKey="count" fill="url(#colorVehicle)" radius={[6, 6, 0, 0]} filter="url(#shadowPurple)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="relative group bg-gray-900/85 border border-gray-700/50 p-3 md:p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col transition-all duration-500 hover:border-cyan-500/30 hover:shadow-cyan-500/10 anim-fade-in-up" style={{ animationDelay: '380ms' }}>
          <h3 className="text-cyan-400 font-bold mb-2 text-[13px] tracking-widest flex items-center gap-2 shrink-0 drop-shadow-md"><Shield size={18} className="anim-float"/> สถิติภารกิจแต่ละสังกัด</h3>
          <div className="flex-1 min-h-0 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartDataAffiliation} 
                layout="vertical"
                margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="#666" tick={{fill: '#888', fontSize: 10}} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#e5e7eb" tick={{fill: '#e5e7eb', fontSize: 11, fontWeight: 'bold'}} axisLine={false} tickLine={false} width={110} />
                <Tooltip 
                  cursor={{fill: '#ffffff0a'}}
                  contentStyle={{backgroundColor: '#0a0a0a', borderColor: '#06b6d4', borderRadius: '8px', fontSize: '12px', boxShadow: '0 10px 25px rgba(6,182,212,0.2)'}} 
                  itemStyle={{ fontWeight: 'bold', color: '#fff' }} 
                  formatter={(value: any) => [`${value} ภารกิจ`, 'จำนวน']}
                />
                <Bar dataKey="count" barSize={8} radius={[0, 10, 10, 0]}>
                  {chartDataAffiliation.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.fill} 
                      style={{ filter: `drop-shadow(0px 0px 8px ${entry.fill})` }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      
      {/* Top 10 Lists (Flex-[1.2] เพื่อให้สมมาตรและมีพื้นที่บรรทัดมากขึ้น) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 flex-[1.2] min-h-0 lists-grid-container">
        
        <div className={`relative group bg-gray-900/85 border border-purple-900/30 p-3 md:p-4 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.4)] flex flex-col transition-all hover:border-purple-500/40 hover:shadow-[0_10px_30px_rgba(168,85,247,0.15)] anim-fade-in-up ${isExporting ? 'h-auto' : 'flex-1 min-h-0'}`} style={{ animationDelay: '460ms' }}>
          <h3 className="text-purple-400 font-bold mb-2 text-[13px] tracking-widest flex items-center gap-2 shrink-0 drop-shadow-md"><Trophy size={16} className="text-yellow-500 anim-pulse-glow" /> TOP 10 VEHICLES</h3>
          <ul className={`space-y-1.5 pb-1 custom-scrollbar pr-1 flex-1 ${isExporting ? 'overflow-visible' : 'overflow-y-auto min-h-0'}`}>
            {topVehicles.length === 0 && <li className="text-gray-500 text-xs text-center py-4">NO DATA</li>}
            {topVehicles.map((v: any, i: number) => (
              <li key={i} className="flex justify-between items-center bg-gray-800/85 py-1.5 px-2.5 rounded-xl border border-purple-500/10 hover:border-purple-400/50 hover:bg-purple-900/20 transition-all duration-300 hover:scale-[1.02] hover:translate-x-1 shadow-sm anim-fade-in-left" style={{ animationDelay: `${600 + i * 50}ms` }}>
                <span className="text-gray-200 font-bold text-[13px] flex items-center gap-2.5"><span className={`text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shrink-0 shadow-inner ${i === 0 ? 'bg-linear-to-br from-yellow-300 to-yellow-600 text-black shadow-yellow-500/50' : i === 1 ? 'bg-linear-to-br from-gray-200 to-gray-500 text-black' : i === 2 ? 'bg-linear-to-br from-orange-300 to-orange-600 text-black' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>{i + 1}</span>{v.name.split(' ')[1] || v.name}</span><span className="text-purple-300 font-mono text-[11px] bg-purple-900/50 border border-purple-500/30 px-2 py-0.5 rounded-md shrink-0 shadow-inner">{v.count} งาน</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className={`relative group bg-gray-900/85 border border-cyan-900/30 p-3 md:p-4 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.4)] flex flex-col transition-all hover:border-cyan-500/40 hover:shadow-[0_10px_30px_rgba(6,182,212,0.15)] anim-fade-in-up ${isExporting ? 'h-auto' : 'flex-1 min-h-0'}`} style={{ animationDelay: '520ms' }}>
          <h3 className="text-cyan-400 font-bold mb-2 text-[13px] tracking-widest flex items-center gap-2 shrink-0 drop-shadow-md"><Map size={16} className="text-cyan-500 anim-pulse-glow" /> TOP 10 LOCATIONS</h3>
          <ul className={`space-y-1.5 pb-1 custom-scrollbar pr-1 flex-1 ${isExporting ? 'overflow-visible' : 'overflow-y-auto min-h-0'}`}>
            {topProvinces.length === 0 && <li className="text-gray-500 text-xs text-center py-4">NO DATA</li>}
            {topProvinces.map((p: any, i: number) => (
              <li key={i} className="flex justify-between items-center bg-gray-800/85 py-1.5 px-2.5 rounded-xl border border-cyan-500/10 hover:border-cyan-400/50 hover:bg-cyan-900/20 transition-all duration-300 hover:scale-[1.02] hover:translate-x-1 shadow-sm anim-fade-in-left" style={{ animationDelay: `${640 + i * 50}ms` }}>
                <span className="text-gray-200 font-bold text-[13px] flex items-center gap-2.5"><span className="text-cyan-400 font-black text-[11px] font-mono shrink-0 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">{i + 1}.</span> <span className="truncate max-w-32.5">{p.name}</span></span><span className="text-cyan-300 font-mono text-[11px] bg-cyan-900/50 border border-cyan-500/30 px-2 py-0.5 rounded-md shrink-0 shadow-inner">{p.count} ครั้ง</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={`relative group bg-gray-900/85 border border-red-900/30 p-3 md:p-4 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.4)] flex flex-col transition-all hover:border-red-500/40 hover:shadow-[0_10px_30px_rgba(239,68,68,0.15)] anim-fade-in-up ${isExporting ? 'h-auto' : 'flex-1 min-h-0'}`} style={{ animationDelay: '580ms' }}>
          <h3 className="text-red-400 font-bold mb-2 text-[13px] tracking-widest flex items-center gap-2 shrink-0 drop-shadow-md"><AlertTriangle size={16} className="text-red-500 anim-pulse-glow" /> TOP 10 INCIDENTS</h3>
          <ul className={`space-y-1.5 pb-1 custom-scrollbar pr-1 flex-1 ${isExporting ? 'overflow-visible' : 'overflow-y-auto min-h-0'}`}>
            {topIncidents.length === 0 && <li className="text-gray-500 text-xs text-center py-4">NO DATA</li>}
            {topIncidents.map((incident: any, i: number) => (<li key={i}
                  onClick={() => setSelectedIncident(incident.name)}
                  style={{ animationDelay: `${680 + i * 50}ms` }}
                  className="flex justify-between items-center bg-gray-800/85 py-1.5 px-2.5 rounded-xl border border-red-500/10 hover:border-red-400/50 hover:bg-red-900/40 transition-all duration-300 hover:scale-[1.02] hover:translate-x-1 shadow-sm gap-2 cursor-pointer anim-fade-in-left">                <div className="flex items-start gap-2 overflow-hidden"><span className="text-red-500 font-black text-[11px] font-mono mt-0.5 shrink-0 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]">-</span><span className="text-gray-200 text-[12px] font-medium line-clamp-2 leading-snug" title={incident.name}>{incident.name}</span></div><span className="text-red-300 font-mono text-[11px] bg-red-900/50 border border-red-500/30 px-2 py-0.5 rounded-md shrink-0 shadow-inner">{incident.count} เคส</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <IncidentModal 
        isOpen={selectedIncident !== null} 
        onClose={() => setSelectedIncident(null)} 
        incidentName={selectedIncident} 
        missions={
          selectedIncident 
            ? filteredMissions.filter(m => {
                let report = String(m.incident_report || "").trim();
                if (report === "" || report === "-" || report === "ปกติ" || report.includes("เหตุการณ์ปกติ")) { 
                  report = "เหตุการณ์ปกติ / ไม่มีเหตุ"; 
                }
                return report === selectedIncident;
              })
            : []
        } 
      />
    </div>
  );
}