"use client";

import { useState } from "react";
import { Lock, User, ShieldAlert, Fingerprint } from "lucide-react";

export default function LoginView({ onLogin, usersList }: { onLogin: (user: any) => void, usersList: any[] }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
 
  // 🟢 ประกาศเวลาความเร็วของไฟวิ่ง (วินาที)
  const [animationTime] = useState(5);

  // 🟢 แอนิเมชันสำหรับเส้นไฟ SVG ให้วิ่งไปตามเส้นรอบรูป
  const neonChaseAnimation = `
    @keyframes border-chase {
      100% { stroke-dashoffset: -3000; }
    }
    .svg-border-chase {
      stroke-dasharray: 400 2600; /* ความยาวเส้นไฟ 400, ระยะห่าง 2600 */
      animation: border-chase ${animationTime}s linear infinite;
    }
  `;

  const handleLogin = (e: any) => {
    e.preventDefault();
    setError("");

    // 1. ตรวจสอบ Master Admin (Hardcode ไว้ให้เผื่อฉุกเฉิน)
    if (username === "admin" && password === "11551155") {
      onLogin({ role: "admin", username: "admin", affiliation: "ALL", vehicle_id: "ALL" });
      return;
    }

    // 2. ตรวจสอบ User จากฐานข้อมูล Google Sheets
    const foundUser = usersList.find((u: any) => String(u.username).trim() === username.trim() && String(u.password).trim() === password.trim());
    
    if (foundUser) {
      // ดึง affiliation (สังกัด) จากคอลัมน์ unit_name และกำหนดสิทธิ์เป็น user
      onLogin({ 
        role: "user", 
        username: foundUser.username, 
        affiliation: foundUser.unit_name, 
        vehicle_id: foundUser.username // ใช้ username เป็นรหัสรถ
      });
    } else {
      setError("ACCESS DENIED: รหัสประจำตัว หรือ รหัสผ่าน ไม่ถูกต้อง");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden font-sans">

      {/* 🟢 แทรก Style แอนิเมชัน */}
      <style>{neonChaseAnimation}</style>
      
      {/* 🟢 กล่องหลัก (ลด Border ของเดิมให้บางลง เพื่อให้ไฟนีออนเด่นขึ้น) */}
      <div className="relative w-full max-w-md bg-gray-950/80 backdrop-blur-xl border border-cyan-900/20 p-10 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.15)] z-10 anim-pop-in">
        
        {/* 🟢 SVG วาดเส้นไฟวิ่งรอบกรอบแบบแนบสนิท */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" xmlns="http://www.w3.org/2000/svg">
          <defs>
            {/* ไล่สีจากฟ้าไปม่วง */}
            <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="50%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
            {/* เอฟเฟกต์ Glow เรืองแสง */}
            <filter id="neonGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <rect
            x="0" y="0" width="100%" height="100%" rx="24" /* rx="24" คือความโค้งที่พอดีกับ rounded-3xl */
            fill="none"
            stroke="url(#neonGradient)"
            strokeWidth="3"
            className="svg-border-chase"
            filter="url(#neonGlow)"
          />
        </svg>
        
        {/* 🟢 คอนเทนต์หลัก ต้องใช้ relative z-10 เพื่อให้อยู่เหนือไฟวิ่ง */}
        <div className="relative z-10">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-gray-900 border border-cyan-500/50 rounded-2xl flex items-center justify-center text-cyan-400 mb-4 shadow-[0_0_20px_rgba(34,211,238,0.2)] anim-float">
              <Fingerprint size={32} />
            </div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-fuchsia-500 tracking-widest text-center">CCOC</h1>
            <p className="text-gray-500 text-xs font-mono tracking-[0.3em] mt-2">SECURE LOGIN SYSTEM</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2 anim-fade-in-up" style={{ animationDelay: '120ms' }}>
              <label className="text-cyan-400 text-xs font-bold tracking-widest pl-1 drop-shadow-[0_0_6px_rgba(34,211,238,0.5)]">USERNAME / รหัสประจำรถ</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input required type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="เช่น stc01" className="w-full bg-black/50 border border-gray-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all" />
              </div>
            </div>

            <div className="space-y-2 anim-fade-in-up" style={{ animationDelay: '200ms' }}>
              <label className="text-fuchsia-400 text-xs font-bold tracking-widest pl-1 drop-shadow-[0_0_6px_rgba(217,70,239,0.5)]">PASSWORD / รหัสผ่าน</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-black/50 border border-gray-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all" />
              </div>
            </div>

            {error && (
              <div className="bg-red-950/30 border border-red-900/50 p-3 rounded-lg flex items-center gap-3 text-red-400 text-sm">
                <ShieldAlert size={18} className="shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <button type="submit" className="w-full py-4 bg-linear-to-r from-cyan-600 to-fuchsia-600 hover:from-cyan-500 hover:to-fuchsia-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(217,70,239,0.5)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 mt-4 tracking-wider active:scale-95 anim-fade-in-up" style={{ animationDelay: '280ms' }}>
              AUTHORIZE ACCESS
            </button>
          </form>
          
          <div className="mt-8 text-center border-t border-gray-800/50 pt-6">
            <p className="text-gray-600 text-[10px] font-mono">AUTHORIZED PERSONNEL ONLY. SYSTEM MONITORED.</p>
          </div>
        </div>

      </div>
    </div>
  );
}