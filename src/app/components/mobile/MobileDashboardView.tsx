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
} from "recharts";
import IncidentModal from "../IncidentModal";
import { VEHICLE_AFFILIATIONS } from "../../data/users";

const VEHICLE_NAMES: Record<string, string> = {
  stc01: "1. stc01 บช.ทท.",
  stc02: "2. stc02 ภูเก็ต",
  stc03: "3. stc03 อยุธยา",
  stc04: "4. stc04 ชลบุรี",
  stc05: "5. stc05 โคราช",
  stc06: "6. stc06 เชียงใหม่",
  stc07: "7. stc07 พิษณุโลก",
  stc08: "8. stc08 หัวหิน",
  stc09: "9. stc09 สนามศุภ",
  stc10: "10. stc10 หาดใหญ่",
  "uav mobile": "11. UAV Mobile",
  "UAV Mobile": "11. UAV Mobile",
};

const AFFILIATION_COLORS: Record<string, { fill: string }> = {
  "บช.ทท.": { fill: "#d946ef" },
  "บก.ทท.1": { fill: "#06b6d4" },
  "บก.ทท.2": { fill: "#22c55e" },
  "บก.ทท.3": { fill: "#ea580c" },
};

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

  const normalizeAffiliation = (raw: string): string => {
    const s = (raw || "").trim();
    if (!s || s === "-") return "ไม่ระบุสังกัด";
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
      passAffiliation = normalizeAffiliation(String(m.affiliation || "")) === filterAffiliation;
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

  const vehicleStats = filteredMissions.reduce((acc: any, m: any) => {
    const v = String(m.vehicle_id || "Unknown").toLowerCase();
    acc[v] = (acc[v] || 0) + 1;
    return acc;
  }, {});

  const chartDataVehicle = Object.keys(vehicleStats).map((key) => {
    const aff = VEHICLE_AFFILIATIONS[key.toLowerCase()] || "บช.ทท.";
    const colorInfo = AFFILIATION_COLORS[aff] || { fill: "#c084fc" };
    return {
      name: VEHICLE_NAMES[key] || key.toUpperCase(),
      shortName: key.toUpperCase(),
      count: vehicleStats[key],
      fill: colorInfo.fill,
    };
  });

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

      {/* Mobile Vehicle Bar Chart */}
      <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl">
        <h3 className="text-xs font-bold text-cyan-400 mb-3 flex items-center space-x-2">
          <Car className="w-4 h-4" />
          <span>สถิติการปฏิบัติงานตามคัน</span>
        </h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartDataVehicle} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="shortName" stroke="#64748b" tick={{ fontSize: 9 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 9 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#090d16",
                  borderColor: "#06b6d4",
                  borderRadius: "12px",
                  fontSize: "11px",
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {chartDataVehicle.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top 5 Locations & Incidents Mobile Lists */}
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
