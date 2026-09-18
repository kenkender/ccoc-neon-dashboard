"use client";

import React, { useState } from "react";
import {
  List,
  Calendar,
  Filter,
  Truck,
  RefreshCw,
  Printer,
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock,
} from "lucide-react";

interface MobileMissionLogsViewProps {
  isDarkMode: boolean;
  filteredLogs: any[];
  onSelectMission: (mission: any) => void;
  onRefresh: () => void;
  onOpenPdf: () => void;
  logFilterStartDate: string;
  setLogFilterStartDate: (val: string) => void;
  logFilterEndDate: string;
  setLogFilterEndDate: (val: string) => void;
  logFilterAffiliation: string;
  setLogFilterAffiliation: (val: string) => void;
  pdfTypeFilter: string;
  setPdfTypeFilter: (val: string) => void;
  formatRecordedDate: (ts: string) => string;
  getAffiliationColor: (aff: string, isDark: boolean) => string;
}

export default function MobileMissionLogsView({
  isDarkMode,
  filteredLogs,
  onSelectMission,
  onRefresh,
  onOpenPdf,
  logFilterStartDate,
  setLogFilterStartDate,
  logFilterEndDate,
  setLogFilterEndDate,
  logFilterAffiliation,
  setLogFilterAffiliation,
  pdfTypeFilter,
  setPdfTypeFilter,
  formatRecordedDate,
  getAffiliationColor,
}: MobileMissionLogsViewProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <div className="w-full space-y-3 pb-24 px-1">
      {/* Header Bar */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <List className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-sm bg-gradient-to-r from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">
              รายการบันทึกภารกิจ
            </h2>
            <span className="text-[10px] text-slate-400 font-mono">
              พบทั้งหมด {filteredLogs.length} ภารกิจ
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-slate-800 text-cyan-400 border border-slate-700 active:scale-95 transition-all"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenPdf}
            className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 active:scale-95 transition-all"
            title="พิมพ์ PDF"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3">
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="w-full flex items-center justify-between text-xs font-bold text-cyan-400"
        >
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>กรองตามวันที่ / สังกัด / ประเภทรถ</span>
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
                  value={logFilterStartDate}
                  onChange={(e) => setLogFilterStartDate(e.target.value)}
                  className="w-full bg-slate-950 text-white p-2 rounded-xl border border-slate-800"
                  style={{ colorScheme: "dark" }}
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400">วันที่สิ้นสุด</label>
                <input
                  type="date"
                  value={logFilterEndDate}
                  onChange={(e) => setLogFilterEndDate(e.target.value)}
                  className="w-full bg-slate-950 text-white p-2 rounded-xl border border-slate-800"
                  style={{ colorScheme: "dark" }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400">สังกัด</label>
                <select
                  value={logFilterAffiliation}
                  onChange={(e) => setLogFilterAffiliation(e.target.value)}
                  className="w-full bg-slate-950 text-white p-2 rounded-xl border border-slate-800"
                >
                  <option value="ALL">ทุกสังกัด</option>
                  <option value="บช.ทท.">บช.ทท.</option>
                  <option value="บก.ทท.1">บก.ทท.1</option>
                  <option value="บก.ทท.2">บก.ทท.2</option>
                  <option value="บก.ทท.3">บก.ทท.3</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400">ประเภทรถ</label>
                <select
                  value={pdfTypeFilter}
                  onChange={(e) => setPdfTypeFilter(e.target.value)}
                  className="w-full bg-slate-950 text-white p-2 rounded-xl border border-slate-800"
                >
                  <option value="ALL">ทุกประเภทรถ</option>
                  <option value="CCOC Mobile">CCOC Mobile</option>
                  <option value="UAV Mobile">UAV Mobile</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mission Cards List */}
      <div className="space-y-2.5">
        {filteredLogs.map((mission: any, index: number) => {
          const isUav =
            String(mission.vehicle_type || "").toLowerCase().includes("uav") ||
            String(mission.vehicle_id || "").toLowerCase().includes("uav") ||
            Boolean(mission.drone_id);

          return (
            <div
              key={index}
              onClick={() => onSelectMission(mission)}
              className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 active:scale-[0.98] transition-all cursor-pointer flex flex-col justify-between space-y-2 shadow-md"
            >
              <div className="flex items-start justify-between space-x-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1.5 mb-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        isUav
                          ? "bg-cyan-950/80 text-cyan-300 border-cyan-800"
                          : "bg-fuchsia-950/80 text-fuchsia-300 border-fuchsia-800"
                      }`}
                    >
                      {isUav ? "UAV Mobile" : "CCOC Mobile"}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${getAffiliationColor(
                        mission.affiliation,
                        isDarkMode
                      )}`}
                    >
                      {mission.affiliation || "-"}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-100 line-clamp-2 leading-snug">
                    {mission.mission_name || "ไม่ระบุชื่อภารกิจ"}
                  </h3>
                </div>

                <span className="text-[11px] font-mono text-cyan-400 font-bold bg-cyan-950/60 px-2 py-1 rounded-lg border border-cyan-800/50 shrink-0">
                  {mission.vehicle_id?.toUpperCase()}
                </span>
              </div>

              {/* Location & Date Details */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60 pt-2 font-mono">
                <div className="flex items-center space-x-1 truncate">
                  <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span className="truncate">{mission.province || mission.location || "-"}</span>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{formatRecordedDate(mission.timestamp)}</span>
                </div>
              </div>
            </div>
          );
        })}

        {filteredLogs.length === 0 && (
          <div className="text-center py-12 text-slate-500 font-mono text-xs bg-slate-900/50 rounded-2xl border border-slate-800">
            ไม่พบข้อมูลภารกิจตามตัวกรองที่เลือก
          </div>
        )}
      </div>
    </div>
  );
}
