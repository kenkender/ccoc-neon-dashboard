"use client";

import React, { useState } from "react";
import {
  Activity,
  Filter,
  List,
  MapPin,
  Users,
  Car,
  Trophy,
  AlertTriangle,
  Map,
  RefreshCw,
  Shield,
  ChevronDown,
  ChevronUp,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import IncidentModal from "../IncidentModal";
import { VEHICLE_AFFILIATIONS } from "../../data/users";

const VEHICLE_NAMES: Record<string, string> = {
  stc01: "stc01 บช.ทท.",
  stc02: "stc02 ภูเก็ต",
  stc03: "stc03 อยุธยา",
  stc04: "stc04 ชลบุรี",
  stc05: "stc05 โคราช",
  stc06: "stc06 เชียงใหม่",
  stc07: "stc07 พิษณุโลก",
  stc08: "stc08 หัวหิน",
  stc09: "stc09 สนามศุภ",
  stc10: "stc10 หาดใหญ่",
  "uav mobile": "UAV Mobile",
  "UAV Mobile": "UAV Mobile",
};

const AFFILIATION_COLORS: Record<string, { fill: string }> = {
  "บช.ทท.": { fill: "#d946ef" },
  "บก.ทท.1": { fill: "#06b6d4" },
  "บก.ทท.2": { fill: "#22c55e" },
  "บก.ทท.3": { fill: "#ea580c" },
};

const DONUT_COLORS = ["#d946ef", "#06b6d4", "#22c55e", "#ea580c", "#c084fc", "#f59e0b"];

// ─── Custom 3D Bar Shape for Mobile Horizontal Chart ───────────────────────
const Bar3DHorizontal = (props: any) => {
  const { x, y, width, height, fill } = props;
  if (!fill || !width || !height || width <= 0 || height <= 0) return null;
  const dep = Math.min(height * 0.8, 10);
  const dw  = dep * 0.6;
  const r   = Math.min(Math.floor(height / 2), 5);
  return (
    <g style={{ filter: `drop-shadow(0 2px 6px ${fill}55)` }}>
      {/* Top face */}
      <path
        d={`M ${x} ${y} L ${x + dw} ${y - dep} L ${x + width + dw} ${y - dep} L ${x + width} ${y} Z`}
        fill={fill} fillOpacity={0.75}
      />
      {/* Right side face */}
      <path
        d={`M ${x + width} ${y} L ${x + width + dw} ${y - dep} L ${x + width + dw} ${y + height - dep} L ${x + width} ${y + height} Z`}
        fill={fill} fillOpacity={0.35}
      />
      {/* Front face */}
      <rect x={x} y={y} width={width} height={height} fill={fill} rx={r} />
      {/* Highlight shine */}
      <rect x={x + 2} y={y + 1} width={Math.max(width - 6, 0)} height={Math.max(height - 2, 1)} fill="white" fillOpacity={0.12} rx={r} />
    </g>
  );
};

// Custom Tooltip สำหรับ Horizontal Bar Chart
const HBarTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div
        style={{
          backgroundColor: "#090d16",
          border: "1px solid #06b6d4",
          borderRadius: "10px",
          padding: "8px 12px",
          fontSize: "11px",
          color: "#e2e8f0",
        }}
      >
        <p style={{ fontWeight: "bold", marginBottom: 2 }}>{d.fullName}</p>
        <p style={{ color: d.fill }}>ภารกิจ: {d.count} ครั้ง</p>
      </div>
    );
  }
  return null;
};

// Custom Tooltip สำหรับ Donut Chart
const DonutTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: "#090d16",
          border: "1px solid #6366f1",
          borderRadius: "10px",
          padding: "8px 12px",
          fontSize: "11px",
          color: "#e2e8f0",
        }}
      >
        <p style={{ fontWeight: "bold", color: payload[0].payload.fill }}>
          {payload[0].name}
        </p>
        <p>ภารกิจ: {payload[0].value} ครั้ง</p>
      </div>
    );
  }
  return null;
};

// Custom Label ตรงกลาง Donut
const DonutCenterLabel = ({ cx, cy, total }: { cx: number; cy: number; total: number }) => (
  <>
    <text x={cx} y={cy - 8} textAnchor="middle" fill="#94a3b8" fontSize={10}>
      ทั้งหมด
    </text>
    <text x={cx} y={cy + 10} textAnchor="middle" fill="#e2e8f0" fontSize={18} fontWeight="bold">
      {total}
    </text>
    <text x={cx} y={cy + 24} textAnchor="middle" fill="#64748b" fontSize={9}>
      ภารกิจ
    </text>
  </>
);

export default function MobileDashboardView({
  missions,
  refreshData,
}: {
  missions: any[];
  refreshData?: any;
}) {
  const [selectedType, setSelectedType] = useState<"NONE" | "CCOC" | "UAV" | "ALL">("ALL");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterVehicle, setFilterVehicle] = useState("ALL");
  const [filterAffiliation, setFilterAffiliation] = useState("ALL");
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const normalizeAffiliation = (raw: string, vehicleId?: string, unitName?: string): string => {
    let s = (raw || "").trim();

    if (!s || s === "-" || s === "ไม่ระบุ" || s === "ไม่ระบุสังกัด") {
      const cleanKey = String(vehicleId || "").trim().toLowerCase();
      if (cleanKey && VEHICLE_AFFILIATIONS[cleanKey]) {
        s = VEHICLE_AFFILIATIONS[cleanKey];
      } else {
        const textToSearch = `${vehicleId || ""} ${unitName || ""}`;
        if (textToSearch.includes("บก.ทท.1")) s = "บก.ทท.1";
        else if (textToSearch.includes("บก.ทท.2")) s = "บก.ทท.2";
        else if (textToSearch.includes("บก.ทท.3")) s = "บก.ทท.3";
        else if (textToSearch.includes("บช.ทท.")) s = "บช.ทท.";
      }
    }

    if (!s || s === "-" || s === "ไม่ระบุ" || s === "ไม่ระบุสังกัด") return "ไม่ระบุสังกัด";

    if (
      s === "ฝ่ายอำนวยการ 6" ||
      s === "ฝอ.6" ||
      s.includes("ฝ่ายอำนวยการ 6") ||
      s.includes("บก.อก.บช.ทท")
    )
      return "บช.ทท.";
    return s;
  };

  const typeFilteredMissions = missions.filter((m: any) => {
    if (selectedType === "ALL") return true;
    const uname = String(m.vehicle_id || "").trim().toLowerCase();
    const vtype = String(m.vehicle_type || "").toLowerCase();
    if (selectedType === "CCOC") return uname.startsWith("stc") || vtype === "ccoc mobile";
    if (selectedType === "UAV")
      return uname.startsWith("uav") || uname === "uav mobile" || vtype === "uav mobile";
    return true;
  });

  const filteredMissions = typeFilteredMissions.filter((m: any) => {
    let passDate = true;
    let passVehicle = true;
    let passAffiliation = true;
    if (m.start_date) {
      const mDate = new Date(m.start_date);
      const mDateStr = `${mDate.getFullYear()}-${String(mDate.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(mDate.getDate()).padStart(2, "0")}`;
      if (filterStartDate) passDate = mDateStr >= filterStartDate;
      if (passDate && filterEndDate) passDate = mDateStr <= filterEndDate;
    }
    if (filterVehicle !== "ALL")
      passVehicle = String(m.vehicle_id).trim().toLowerCase() === filterVehicle.toLowerCase();
    if (filterAffiliation !== "ALL")
      passAffiliation = normalizeAffiliation(String(m.affiliation || ""), m.vehicle_id, m.unit_name) === filterAffiliation;
    return passDate && passVehicle && passAffiliation;
  });

  const kpiTotalMissions = filteredMissions.length;
  const kpiTotalDistance = filteredMissions.reduce(
    (sum: number, m: any) => sum + Number(m.distance_km || 0),
    0
  );
  const kpiTotalPeople = filteredMissions.reduce(
    (sum: number, m: any) => sum + Number(m.people_total || 0),
    0
  );

  // ── Vehicle stats → Horizontal Bar Chart data ────────────────────────────
  const vehicleStats = filteredMissions.reduce((acc: any, m: any) => {
    const v = String(m.vehicle_id || "Unknown").toLowerCase();
    acc[v] = (acc[v] || 0) + 1;
    return acc;
  }, {});

  // เรียงจากมากไปน้อย สำหรับ Horizontal Bar Chart
  const chartDataVehicle = Object.keys(vehicleStats)
    .map((key) => {
      const aff = VEHICLE_AFFILIATIONS[key.toLowerCase()] || "บช.ทท.";
      const colorInfo = AFFILIATION_COLORS[aff] || { fill: "#c084fc" };
      return {
        fullName: VEHICLE_NAMES[key] || key.toUpperCase(),
        name: key.toUpperCase(),
        count: vehicleStats[key],
        fill: colorInfo.fill,
      };
    })
    .sort((a, b) => b.count - a.count);

  // ── Affiliation stats → Donut Chart data ─────────────────────────────────
  const affiliationStats = filteredMissions.reduce((acc: any, m: any) => {
    const aff = normalizeAffiliation(String(m.affiliation || ""), m.vehicle_id, m.unit_name);
    acc[aff] = (acc[aff] || 0) + 1;
    return acc;
  }, {});

  const donutData = Object.keys(affiliationStats).map((key, i) => ({
    name: key,
    value: affiliationStats[key],
    fill: AFFILIATION_COLORS[key]?.fill || DONUT_COLORS[i % DONUT_COLORS.length],
  }));

  // dynamic chart height for horizontal bar chart based on number of vehicles
  const hBarHeight = Math.max(160, chartDataVehicle.length * 34);

  // ── Province & Incident stats ─────────────────────────────────────────────
  const provinceStats = filteredMissions.reduce((acc: any, m: any) => {
    const p = m.province || "ไม่ระบุ";
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {});
  const topProvinces = Object.keys(provinceStats)
    .map((key) => ({ name: key, count: provinceStats[key] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const incidentStats = filteredMissions.reduce((acc: any, m: any) => {
    let report = String(m.incident_report || "").trim();
    if (report === "" || report === "-" || report.includes("ปกติ")) {
      report = "ปกติ / ไม่มีเหตุ";
    }
    acc[report] = (acc[report] || 0) + 1;
    return acc;
  }, {});
  const topIncidents = Object.keys(incidentStats)
    .map((key) => ({ name: key, count: incidentStats[key] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="w-full space-y-4 pb-20">
      {/* Category Tabs */}
      <div className="flex rounded-2xl bg-slate-900/90 p-1 border border-slate-800 shadow-md">
        {(["ALL", "CCOC", "UAV"] as const).map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all ${
              selectedType === type
                ? "bg-gradient-to-r from-cyan-500 to-fuchsia-600 text-white shadow-lg shadow-cyan-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {type === "ALL" ? "รวมทั้งหมด" : type === "CCOC" ? "CCOC Mobile" : "UAV Mobile"}
          </button>
        ))}
      </div>

      {/* Filter Toggle */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3">
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="w-full flex items-center justify-between text-xs font-bold text-cyan-400"
        >
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>ตัวกรองข้อมูลภารกิจ</span>
          </div>
          {isFilterOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {isFilterOpen && (
          <div className="mt-3 pt-3 border-t border-slate-800 space-y-2.5 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400">วันที่เริ่มต้น</label>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="w-full bg-slate-950 text-white p-2 rounded-xl border border-slate-800"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400">วันที่สิ้นสุด</label>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="w-full bg-slate-950 text-white p-2 rounded-xl border border-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400">สังกัดหน่วยงาน</label>
              <select
                value={filterAffiliation}
                onChange={(e) => setFilterAffiliation(e.target.value)}
                className="w-full bg-slate-950 text-white p-2 rounded-xl border border-slate-800"
              >
                <option value="ALL">ทุกสังกัด</option>
                <option value="บช.ทท.">บช.ทท.</option>
                <option value="บก.ทท.1">บก.ทท.1</option>
                <option value="บก.ทท.2">บก.ทท.2</option>
                <option value="บก.ทท.3">บก.ทท.3</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* KPI Mobile Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-slate-900/90 border border-fuchsia-500/30 p-2.5 rounded-2xl flex flex-col justify-between">
          <List className="w-4 h-4 text-fuchsia-400 mb-1" />
          <span className="text-[10px] text-slate-400 font-medium">ภารกิจรวม</span>
          <span className="text-lg font-black text-fuchsia-300">{kpiTotalMissions}</span>
        </div>

        <div className="bg-slate-900/90 border border-cyan-500/30 p-2.5 rounded-2xl flex flex-col justify-between">
          <MapPin className="w-4 h-4 text-cyan-400 mb-1" />
          <span className="text-[10px] text-slate-400 font-medium">ระยะทาง(กม.)</span>
          <span className="text-lg font-black text-cyan-300">
            {kpiTotalDistance.toLocaleString()}
          </span>
        </div>

        <div className="bg-slate-900/90 border border-emerald-500/30 p-2.5 rounded-2xl flex flex-col justify-between">
          <Users className="w-4 h-4 text-emerald-400 mb-1" />
          <span className="text-[10px] text-slate-400 font-medium">คนในงาน</span>
          <span className="text-lg font-black text-emerald-300">
            {kpiTotalPeople.toLocaleString()}
          </span>
        </div>
      </div>

      {/* ─── แนวทางที่ 1: Horizontal Bar Chart (สถิติตามคัน) ─────────────── */}
      <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl">
        <h3 className="text-xs font-bold text-cyan-400 mb-3 flex items-center space-x-2">
          <Car className="w-4 h-4" />
          <span>สถิติการปฏิบัติงานตามคัน</span>
        </h3>

        {chartDataVehicle.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-slate-500 text-xs">
            ไม่มีข้อมูล
          </div>
        ) : (
          <div style={{ height: hBarHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={chartDataVehicle}
                margin={{ top: 4, right: 40, left: 4, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#475569"
                  tick={{ fontSize: 9, fill: "#64748b" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#475569"
                  tick={{ fontSize: 9, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  width={62}
                />
                <Tooltip content={<HBarTooltip />} cursor={{ fill: "rgba(6,182,212,0.06)" }} />
                <Bar dataKey="count" shape={(p: any) => <Bar3DHorizontal {...p} />} barSize={18} label={{ position: "right", fontSize: 9, fill: "#94a3b8" }}>
                  {chartDataVehicle.map((entry, index) => (
                    <Cell key={`hbar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ─── แนวทางที่ 2: Donut Chart (สัดส่วนตามสังกัด) ────────────────── */}
      <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl">
        <h3 className="text-xs font-bold text-fuchsia-400 mb-3 flex items-center space-x-2">
          <PieChartIcon className="w-4 h-4" />
          <span>สัดส่วนภารกิจตามสังกัด</span>
        </h3>

        {donutData.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-slate-500 text-xs">
            ไม่มีข้อมูล
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div style={{ width: "100%", height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`donut-${index}`} fill={entry.fill} />
                    ))}
                    {/* Center label via SVG overlay */}
                  </Pie>
                  <Tooltip content={<DonutTooltip />} />
                  <text
                    x="50%"
                    y="42%"
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize={10}
                    dominantBaseline="middle"
                  >
                    ทั้งหมด
                  </text>
                  <text
                    x="50%"
                    y="52%"
                    textAnchor="middle"
                    fill="#e2e8f0"
                    fontSize={20}
                    fontWeight="bold"
                    dominantBaseline="middle"
                  >
                    {kpiTotalMissions}
                  </text>
                  <text
                    x="50%"
                    y="62%"
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize={9}
                    dominantBaseline="middle"
                  >
                    ภารกิจ
                  </text>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend สังกัด */}
            <div className="w-full grid grid-cols-2 gap-1.5 mt-1">
              {donutData.map((item, i) => {
                const pct = kpiTotalMissions > 0
                  ? Math.round((item.value / kpiTotalMissions) * 100)
                  : 0;
                return (
                  <div
                    key={i}
                    className="flex items-center space-x-2 bg-slate-950/70 border border-slate-800 rounded-xl px-2.5 py-2"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.fill, boxShadow: `0 0 6px ${item.fill}` }}
                    />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-200 truncate">{item.name}</p>
                      <p className="text-[10px] font-mono" style={{ color: item.fill }}>
                        {item.value} ครั้ง ({pct}%)
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ─── Top 5 Locations & Incidents (คงเดิม) ───────────────────────── */}
      <div className="grid grid-cols-1 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl">
          <h3 className="text-xs font-bold text-cyan-400 mb-2.5 flex items-center space-x-2">
            <Map className="w-4 h-4" />
            <span>Top 5 พื้นที่ปฏิบัติงานสูงสุด</span>
          </h3>
          <div className="space-y-1.5">
            {topProvinces.map((p, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800/80 text-xs"
              >
                <span className="font-semibold text-slate-200">
                  {i + 1}. {p.name}
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {p.count} ครั้ง
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl">
          <h3 className="text-xs font-bold text-rose-400 mb-2.5 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Top 5 รายงานเหตุการณ์</span>
          </h3>
          <div className="space-y-1.5">
            {topIncidents.map((incident, i) => (
              <div
                key={i}
                onClick={() => setSelectedIncident(incident.name)}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800/80 text-xs active:bg-slate-800 cursor-pointer"
              >
                <span className="font-medium text-slate-300 truncate max-w-[200px]">
                  {incident.name}
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 shrink-0">
                  {incident.count} เคส
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <IncidentModal
        isOpen={selectedIncident !== null}
        onClose={() => setSelectedIncident(null)}
        incidentName={selectedIncident}
        missions={
          selectedIncident
            ? filteredMissions.filter((m) => {
                let report = String(m.incident_report || "").trim();
                if (report === "" || report === "-" || report.includes("ปกติ")) {
                  report = "ปกติ / ไม่มีเหตุ";
                }
                return report === selectedIncident;
              })
            : []
        }
      />
    </div>
  );
}
