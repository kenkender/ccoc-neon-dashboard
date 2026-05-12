"use client";

import { X, MapPin, Shield, AlertTriangle, Activity } from "lucide-react";

export default function IncidentModal({ isOpen, onClose, incidentName, missions }: any) {
  if (!isOpen) return null;

  return (
    // 🟢 พื้นหลังสีดำโปร่งแสง (Backdrop)
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      
      {/* 🟢 ตัวกล่อง Popup สไตล์ Cyberpunk ขอบเรืองแสงสีแดง */}
      <div className="bg-[#0a0a0a] border border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.2)] rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* 🟢 Header ของ Popup */}
        <div className="flex justify-between items-center p-5 border-b border-red-900/50 bg-red-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-900/50 rounded-lg text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] anim-pulse-glow"><AlertTriangle size={24} /></div>
            <div>
              <h3 className="text-xl font-bold text-red-400 drop-shadow-md">รายละเอียดเหตุการณ์</h3>
              <p className="text-sm font-mono text-gray-400 mt-0.5">เหตุการณ์: <span className="text-red-300 font-bold">{incidentName}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-gray-500 hover:text-red-400 hover:bg-red-900/30 transition-all active:scale-90">
            <X size={24} />
          </button>
        </div>

        {/* 🟢 Body: รายการภารกิจ */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 bg-linear-to-b from-gray-900/50 to-black">
          <div className="space-y-3">
            {missions.length === 0 ? (
              <p className="text-center text-gray-500 font-mono py-10">NO DATA FOUND</p>
            ) : (
              missions.map((mission: any, idx: number) => (
                <div key={idx} style={{ animationDelay: `${idx * 40}ms` }} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-gray-900/60 border border-gray-800 hover:border-red-500/30 p-4 rounded-xl transition-all duration-300 hover:bg-gray-800 hover:translate-x-1 group anim-fade-in-up">
                  
                  {/* ลำดับ & สังกัด */}
                  <div className="md:col-span-3 flex items-center gap-3">
                    <span className="text-gray-600 font-mono text-xs">{String(idx + 1).padStart(2, '0')}</span>
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded border bg-gray-950 text-cyan-400 border-cyan-900/50 group-hover:border-cyan-500/50 transition-colors flex items-center gap-1">
                      <Shield size={12} /> {mission.affiliation || "ไม่ระบุ"}
                    </span>
                  </div>

                  {/* ชื่อภารกิจ */}
                  <div className="md:col-span-5">
                    <p className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors flex items-start gap-2">
                      <Activity size={16} className="text-purple-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{mission.mission_name || "ไม่ระบุชื่อภารกิจ"}</span>
                    </p>
                  </div>

                  {/* จังหวัด / พิกัด */}
                  <div className="md:col-span-4 flex items-center gap-2 text-gray-400 group-hover:text-gray-300">
                    <MapPin size={16} className="text-green-500 shrink-0" />
                    <span className="text-xs truncate">{mission.province || "ไม่ระบุพิกัด"}</span>
                  </div>

                </div>
              ))
            )}
          </div>
        </div>
        
        {/* 🟢 Footer */}
        <div className="p-4 border-t border-red-900/50 bg-black/50 flex justify-between items-center text-xs font-mono text-gray-500">
          <span>CCOC MOBILE SYSTEM</span>
          <span>รวมทั้งหมด <strong className="text-red-400 text-sm">{missions.length}</strong> รายการ</span>
        </div>
        
      </div>
    </div>
  );
}