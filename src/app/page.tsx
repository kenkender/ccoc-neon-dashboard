"use client";

import { useEffect, useState } from "react";
import { PenTool, List, LineChart, X, MapPin, Users, Calendar, Car, Edit3, Save, LogOut, Shield, Filter, UserCircle, FileSpreadsheet, Printer, Sun, Moon, Trash2, RefreshCw } from "lucide-react";
import DashboardView from "./components/DashboardView";
import LoginView from "./components/LoginView"; 


const VEHICLE_NAMES: Record<string, string> = {
  "stc01": "1. stc01 บช.ทท.", "stc02": "2. stc02 ภูเก็ต", "stc03": "3. stc03 อยุธยา",
  "stc04": "4. stc04 ชลบุรี", "stc05": "5. stc05 โคราช", "stc06": "6. stc06 เชียงใหม่",
  "stc07": "7. stc07 พิษณุโลก", "stc08": "8. stc08 หัวหิน", "stc09": "9. stc09 สนามศุภชลาศัย",
  "stc10": "10. stc10 หาดใหญ่", "uav mobile": "11. UAV Mobile", "UAV Mobile": "11. UAV Mobile"
};

const getAffiliationColor = (affiliation: string, isDark: boolean) => {
  switch (affiliation) {
    case "บช.ทท.": return isDark ? "text-fuchsia-400 bg-fuchsia-900/20 border-fuchsia-500/40" : "text-fuchsia-700 bg-fuchsia-100 border-fuchsia-300";
    case "บก.ทท.1": return isDark ? "text-cyan-400 bg-cyan-900/20 border-cyan-500/40" : "text-cyan-700 bg-cyan-100 border-cyan-300";
    case "บก.ทท.2": return isDark ? "text-green-400 bg-green-900/20 border-green-500/40" : "text-green-700 bg-green-100 border-green-300";
    case "บก.ทท.3": return isDark ? "text-orange-400 bg-orange-900/20 border-orange-500/40" : "text-orange-700 bg-orange-100 border-orange-300";
    default: return isDark ? "text-gray-400 bg-gray-900/20 border-gray-500/40" : "text-gray-600 bg-gray-200 border-gray-300";
  }
};

export default function Home() {
  const [currentUser, setCurrentUser] = useState<any>(null); 
  const [usersList, setUsersList] = useState<any[]>([]); 
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false); // 🟢 State ควบคุมหน้าจอโหลดตอนลบ
  const [activeMenu, setActiveMenu] = useState(1);
  const [selectedMission, setSelectedMission] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const [logFilterAffiliation, setLogFilterAffiliation] = useState("ALL");
  const [logFilterStartDate, setLogFilterStartDate] = useState("");
  const [logFilterEndDate, setLogFilterEndDate] = useState("");

  const [formData, setFormData] = useState({
    affiliation: "", unit_name: "", vehicle_id: "", mission_name: "", province: "", start_date: "", end_date: "", total_days: "", distance_km: "", people_per_day: "", people_total: "", incident_report: "", remark: ""
  });

  // ⚠️ วาง URL ของ Apps Script ตรงนี้ครับ ⚠️
  const API_URL = "https://script.google.com/macros/s/AKfycbwsLqrtjt9fU7P5XOERxEqrM5QAW8MKPrsPw_F5A40LfrvtLYgkY3UnKEDH3db6C8HK/exec";

  const fetchData = async () => {
    try {
      const response = await fetch(API_URL);
      const result = await response.json();
      
      const cleanedMissions = (result.data?.missions || []).map((m: any) => {
        let vId = String(m.vehicle_id || "").trim().toLowerCase();
        let uName = String(m.unit_name || "").trim().toLowerCase();
        let affil = String(m.affiliation || "").trim();

        if (vId.includes("uav")) { vId = "UAV Mobile"; if (!affil) affil = "บช.ทท."; } 
        else if (vId.includes("อยุธยา") || uName.includes("อยุธยา")) { vId = "stc03"; if (!affil) affil = "บก.ทท.1"; } 
        else if (vId.includes("สนามศุภ") || uName.includes("สนามศุภ")) { vId = "stc09"; if (!affil) affil = "บก.ทท.1"; } 
        else if (vId.includes("ฝอ.6") || uName.includes("ฝอ.6") || vId === "stc01") { vId = "stc01"; if (!affil) affil = "บช.ทท."; } 
        else { vId = String(m.vehicle_id || "").trim(); }
        
        return { ...m, vehicle_id: vId, affiliation: affil };
      });

      setData({ missions: cleanedMissions });
      setUsersList(result.data?.users || []); 
      setLoading(false);
    } catch (error) { console.error("Error fetching data:", error); setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const calculateTotals = (start: string, end: string, people: string) => {
    if (start && end) {
      const diffDays = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (diffDays > 0) return { total_days: diffDays.toString(), people_total: people ? (diffDays * Number(people)).toString() : "0" };
    } return null;
  };

  useEffect(() => {
    const calc = calculateTotals(formData.start_date, formData.end_date, formData.people_per_day);
    if (calc) setFormData(prev => ({ ...prev, ...calc }));
  }, [formData.start_date, formData.end_date, formData.people_per_day]);

  const handleSubmit = async (e: any, action: "add" | "edit" = "add") => {
    e.preventDefault(); setIsSubmitting(true);
    let payloadData = { ...formData };
    if (currentUser.role === "user") {
      payloadData.affiliation = currentUser.affiliation;
      payloadData.vehicle_id = currentUser.vehicle_id;
    }
    const payload = { 
      action: action, 
      timestamp: action === "edit" ? selectedMission.timestamp : new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Bangkok' }), 
      data: payloadData 
    };
    try {
      await fetch(API_URL, { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "text/plain;charset=utf-8" }, mode: "no-cors" });
      alert(action === "add" ? "✅ ข้อมูลถูกส่งเข้าระบบ Google Sheet เรียบร้อย!" : "✅ อัปเดตข้อมูลสำเร็จ!");
      let resetForm = { affiliation: "", unit_name: "", vehicle_id: "", mission_name: "", province: "", start_date: "", end_date: "", total_days: "", distance_km: "", people_per_day: "", people_total: "", incident_report: "", remark: ""};
      if (currentUser.role === "user") { resetForm.affiliation = currentUser.affiliation; resetForm.vehicle_id = currentUser.vehicle_id; }
      setFormData(resetForm);
      if (action === "edit") { setIsEditing(false); setSelectedMission(null); } else { setActiveMenu(2); }
      setLoading(true); fetchData(); 
    } catch (error) { alert("❌ เกิดข้อผิดพลาดในการส่งข้อมูล"); }
    setIsSubmitting(false);
  };

  const handleChange = (e: any) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };

  const handleEditClick = () => {
    const formatDate = (dateStr: string) => dateStr ? new Date(dateStr).toISOString().split('T')[0] : "";
    setFormData({
      affiliation: selectedMission.affiliation || "", unit_name: selectedMission.unit_name, vehicle_id: selectedMission.vehicle_id, mission_name: selectedMission.mission_name, province: selectedMission.province, start_date: formatDate(selectedMission.start_date), end_date: formatDate(selectedMission.end_date), total_days: selectedMission.total_days, distance_km: selectedMission.distance_km, people_per_day: selectedMission.people_per_day, people_total: selectedMission.people_total, incident_report: selectedMission.incident_report, remark: selectedMission.remark
    });
    setIsEditing(true);
  };

  // 🟢 ฟังก์ชันสำหรับปุ่มลบข้อมูล
  const handleDelete = async () => {
    const confirmDelete = window.confirm("⚠️ คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้?\n(การลบจะไม่สามารถกู้คืนได้)");
    if (!confirmDelete) return;

    setIsDeleting(true); // 🟢 เปิดหน้าจอ Loading สีแดง
    
    // ส่ง action: "delete" และแนบ timestamp ไปเป็น ID อ้างอิง
    const payload = { 
      action: "delete", 
      timestamp: selectedMission.timestamp 
    };

    try {
      await fetch(API_URL, { 
        method: "POST", 
        body: JSON.stringify(payload),
        headers: { "Content-Type": "text/plain;charset=utf-8" }, // 🟢 เพิ่มบรรทัดนี้ เพื่อบอกยานแม่ว่านี่คือชุดข้อมูล JSON
        mode: "no-cors" 
      });
      
      // (ลบ alert ออกได้เลย เพราะเดี๋ยว UI จะแสดงให้เห็นเองว่าโหลดเสร็จแล้วหน้าต่างจะปิดไป)
      setSelectedMission(null); // ปิดหน้าต่าง Popup
      setLoading(true); 
      fetchData(); // โหลดข้อมูลมาแสดงใหม่
    } catch (error) { 
      alert("❌ เกิดข้อผิดพลาดในการลบข้อมูล"); 
    }
    
    setIsDeleting(false); // 🟢 ปิดหน้าจอ Loading (ถ้าลบพังก็จะได้ปิดทิ้ง)
  };

  const allowedMissions = data?.missions || [];

  const filteredLogs = allowedMissions.filter((m: any) => {
    let passAffil = logFilterAffiliation === "ALL" || String(m.affiliation || "").trim() === logFilterAffiliation;
    let passDate = true;
    if (m.start_date) {
      const mDate = new Date(m.start_date);
      const mDateStr = `${mDate.getFullYear()}-${String(mDate.getMonth() + 1).padStart(2, '0')}-${String(mDate.getDate()).padStart(2, '0')}`;
      if (logFilterStartDate) passDate = mDateStr >= logFilterStartDate;
      if (passDate && logFilterEndDate) passDate = mDateStr <= logFilterEndDate;
    } else if (logFilterStartDate || logFilterEndDate) {
      passDate = false; 
    }
    return passAffil && passDate;
  }).reverse();

  const getDateRangeText = () => {
    if (!logFilterStartDate && !logFilterEndDate) return "ทั้งหมด";
    const sDate = logFilterStartDate ? new Date(logFilterStartDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : "เริ่มต้น";
    const eDate = logFilterEndDate ? new Date(logFilterEndDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : "ปัจจุบัน";
    return `วันที่ ${sDate} ถึง ${eDate}`;
  };

  const handleExportExcel = () => {
    const sortedLogs = [...filteredLogs].sort((a, b) => {
      const affA = String(a.affiliation || "").trim(); const affB = String(b.affiliation || "").trim();
      if (affA < affB) return -1; if (affA > affB) return 1; return new Date(a.start_date || 0).getTime() - new Date(b.start_date || 0).getTime();
    });
    const csvRows = [];
    csvRows.push(`ผลการปฏิบัติการใช้งานรถปฏิบัติการเคลื่อนที่ CCOC Mobile และ UAV Mobile (ประจำห้วง: ${getDateRangeText()}),,,,,,,,,,`);
    csvRows.push(",,,,,,,,,,");
    csvRows.push("ลำดับ,หน่วย,ชื่อภารกิจ/จังหวัด,วัน เดือน ปี จัดงาน,,,ระยะทางที่ตั้งรถ ถึง จุดจัดงาน (กม.),จำนวนผู้ร่วมงาน,,เหตุการณ์สำคัญที่รับแจ้งในงาน,หมายเหตุ");
    csvRows.push(",,,เริ่มวันที่,ถึงวันที่,รวม/วัน,,ต่อวัน(คน),ตลอดงาน(คน),,");
    let currentAffiliation = ""; let rowIndex = 1;
    sortedLogs.forEach((m: any) => {
      const aff = String(m.affiliation || "ไม่ระบุสังกัด").trim();
      if (aff !== currentAffiliation) { csvRows.push(`,${aff},,,,,,,,,`); currentAffiliation = aff; rowIndex = 1; }
      const unitName = `"${m.unit_name || "-"} (${VEHICLE_NAMES[m.vehicle_id] || m.vehicle_id})"`;
      const missionAndProv = `${m.mission_name || "-"}<br/><b>${m.province || "-"}</b>`;
      const sDate = m.start_date ? new Date(m.start_date).toLocaleDateString('th-TH') : "-";
      const eDate = m.end_date ? new Date(m.end_date).toLocaleDateString('th-TH') : "-";
      const totalDays = `"${m.total_days || "0"} วัน"`; const dist = `"${m.distance_km || "0"} กม."`;
      const pplDay = m.people_per_day || "0"; const pplTotal = m.people_total || "0";
      const incident = `"${m.incident_report || "-"}"`; const remark = `"${m.remark || "-"}"`;
      csvRows.push(`${rowIndex++},${unitName},${missionAndProv},${sDate},${eDate},${totalDays},${dist},${pplDay},${pplTotal},${incident},${remark}`);
    });
    const csvContent = "\uFEFF" + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const link = document.createElement("a");
    link.href = url; link.download = `รายงานสถิติ_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank'); if (!printWindow) return;
    const sortedLogs = [...filteredLogs].sort((a, b) => {
      // 🟢 ตั้งค่า Weight ให้ บช.ทท. ขึ้นอันดับ 1 ในไฟล์ PDF
      const order: Record<string, number> = { "ฝ่ายอำนวยการ 6.": 1,"บช.ทท.": 1, "บก.ทท.1": 2, "บก.ทท.2": 3, "บก.ทท.3": 4 };
      const affA = String(a.affiliation || "").trim(); const affB = String(b.affiliation || "").trim();
      const weightA = order[affA] || 99; const weightB = order[affB] || 99;
      if (weightA !== weightB) return weightA - weightB;
      return new Date(a.start_date || 0).getTime() - new Date(b.start_date || 0).getTime();
    });
    let html = `<html><head><title>รายงานสถิติ</title><style>@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;700&display=swap'); body { font-family: 'Sarabun', sans-serif; padding: 20px; color: #000; font-size: 11px; } h2 { text-align: center; margin-bottom: 5px; font-size: 16px; } p { text-align: center; margin-top: 0; margin-bottom: 10px; } .header-meta { text-align: center; font-size: 12px; margin-bottom: 20px; color: #333; } table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #000; padding: 6px; text-align: left; vertical-align: top; } th { background-color: #f0f0f0; text-align: center; } .text-center { text-align: center; } .text-right { text-align: right; } .bg-group { background-color: #e5e7eb; font-weight: bold; text-align: left !important; } @media print { @page { size: landscape; margin: 10mm; } body { -webkit-print-color-adjust: exact; } }</style></head><body><h2>ผลการปฏิบัติการใช้งานรถปฏิบัติการเคลื่อนที่ CCOC Mobile และ UAV Mobile</h2><p style="font-size: 14px; margin-bottom: 15px;"><strong>ประจำห้วงเวลา:</strong> ${getDateRangeText()}</p><div class="header-meta"><strong>ผู้พิมพ์รายงาน:</strong> ${currentUser.role === 'admin' ? 'Master Admin' : currentUser.affiliation} | <strong>วันที่พิมพ์:</strong> ${new Date().toLocaleString('th-TH')}</div><table><thead><tr><th rowspan="2" width="4%">ลำดับ</th><th rowspan="2" width="15%">หน่วย</th><th rowspan="2" width="20%">ชื่อภารกิจ / จังหวัด</th><th colspan="3">วัน เดือน ปี จัดงาน</th><th rowspan="2" width="8%">ระยะทางจากที่ตั้ง<br/>ถึงจุดจัดงาน (กม.)</th><th colspan="2">จำนวนผู้ร่วมงาน</th><th rowspan="2" width="15%">เหตุการณ์สำคัญที่รับแจ้ง</th><th rowspan="2" width="10%">หมายเหตุ</th></tr><tr><th width="6%">เริ่มวันที่</th><th width="6%">ถึงวันที่</th><th width="5%">รวม/วัน</th><th width="5%">ต่อวัน</th><th width="6%">ตลอดงาน</th></tr></thead><tbody>`;
    let currentAffiliation = ""; let rowIndex = 1;
    sortedLogs.forEach((m: any) => {
      const aff = String(m.affiliation || "ไม่ระบุสังกัด").trim();
      if (aff !== currentAffiliation) { html += `<tr><td colspan="11" class="bg-group">${aff}</td></tr>`; currentAffiliation = aff; rowIndex = 1; }
      const unitName = `${m.unit_name || "-"}<br/><small>${VEHICLE_NAMES[m.vehicle_id] || m.vehicle_id}</small>`;
      const missionAndProv = `${m.mission_name || "-"}<br/><b>${m.province || "-"}</b>`;
      const sDate = m.start_date ? new Date(m.start_date).toLocaleDateString('th-TH', {day:'2-digit', month:'short', year:'2-digit'}) : "-";
      const eDate = m.end_date ? new Date(m.end_date).toLocaleDateString('th-TH', {day:'2-digit', month:'short', year:'2-digit'}) : "-";
      html += `<tr><td class="text-center">${rowIndex++}</td><td>${unitName}</td><td>${missionAndProv}</td><td class="text-center">${sDate}</td><td class="text-center">${eDate}</td><td class="text-center">${m.total_days || 0}</td><td class="text-center">${m.distance_km || 0}</td><td class="text-right">${Number(m.people_per_day || 0).toLocaleString()}</td><td class="text-right">${Number(m.people_total || 0).toLocaleString()}</td><td>${m.incident_report || "-"}</td><td>${m.remark || "-"}</td></tr>`;
    });

    // เพิ่มแถวสรุปผลยอดรวม
    const totalMissions = sortedLogs.length;
    const totalDistance = sortedLogs.reduce((sum, m) => sum + Number(m.distance_km || 0), 0);
    const totalPeoplePerDay = sortedLogs.reduce((sum, m) => sum + Number(m.people_per_day || 0), 0);
    const totalPeopleAll = sortedLogs.reduce((sum, m) => sum + Number(m.people_total || 0), 0);

    html += `
        <tr style="background-color: #d1d5db; font-weight: bold; font-size: 12px;">
          <td colspan="6" class="text-right">รวมสถิติในห้วงเวลานี้ทั้งหมด ${totalMissions.toLocaleString()} ภารกิจ :</td>
          <td class="text-center">${totalDistance.toLocaleString()}</td>
          <td class="text-right">${totalPeoplePerDay.toLocaleString()}</td>
          <td class="text-right">${totalPeopleAll.toLocaleString()}</td>
          <td colspan="2"></td>
        </tr>
      </tbody>
    </table>
    </body>
    </html>
    `;
    
    printWindow.document.write(html); printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  const neonCSS = `
    @keyframes neon-sweep {
      0% { transform: translateX(-150%) skewX(-20deg); }
      100% { transform: translateX(250%) skewX(-20deg); }
    }
    .neon-btn { position: relative; overflow: hidden; }
    .neon-btn::after {
      content: ''; position: absolute; top: 0; left: 0; width: 30%; height: 100%;
      background: linear-gradient(to right, transparent, rgba(255,255,255,0.4), transparent);
      animation: neon-sweep 2.5s infinite;
    }
  `;

  if (!currentUser) {
    return (
      // 🟢 1. เปลี่ยนกล่องนอกสุดให้เต็มจอและมีfallbackสีดำ
      <div className={`min-h-screen font-sans transition-colors duration-500 bg-[#050505] relative overflow-hidden`}>
        {/* 🟢 2. เพิ่มกล่องสำหรับวางรูปภาพแบคกราวด์ */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-60"
          style={{ 
            backgroundImage: `url('/login-bg.jpg')`, // ใส่ชื่อไฟล์รูปภาพของเคนตรงนี้ครับ
            filter: 'blur(5px) scale(1.05)' // ปรับเบลอเล็กน้อยเพื่อให้ตัวอักษรดูชัดขึ้นครับ
          }}
        />
        
        {/* 🟢 3. เพิ่มเลเยอร์สี overlay เพื่อให้ธีมนีออนดูโดดเด่นขึ้น */}
        <div className="absolute inset-0 z-0 bg-gray-950/70 backdrop-blur-sm" />

        {/* 🟢 4. เนื้อหาหลัก (loading และ LoginView) ต้องมี z-10 เพื่อให้อยู่ด้านบน */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen">
          {loading ? (
            <div className="flex flex-col items-center justify-center space-y-4">
               <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(34,211,238,0.3)]"></div>
               <p className="text-cyan-400 font-mono tracking-widest animate-pulse drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">กำลังเชื่อมต่อกับเซิฟเวอร์ รอสักครู่นะ!!...</p>
            </div>
          ) : (
            <LoginView usersList={usersList} onLogin={(user) => {
              setCurrentUser(user);
              if (user.role === "user") { setFormData(prev => ({ ...prev, affiliation: user.affiliation, vehicle_id: user.vehicle_id })); }
              
              // 🟢 สายลับทำงาน: แอบส่ง Log ไปที่ยานแม่แบบเงียบๆ (Background Task)
              fetch(API_URL, { 
                method: "POST", 
                body: JSON.stringify({ 
                  action: "login", 
                  timestamp: new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Bangkok' }), // 🟢 บังคับใช้เวลาประเทศไทย (UTC+7)
                  data: { username: user.username, affiliation: user.affiliation, role: user.role } 
                }), 
                mode: "no-cors" 
              });
            }} />
          )}
        </div>
      </div>
    );
  }

  return (
    // 🟢 1. เปลี่ยนกล่องนอกสุดให้เรียงแนวตั้งบนมือถือ (เพิ่ม flex-col md:flex-row และ w-full)
    <div className={`flex flex-col md:flex-row w-full min-h-screen font-sans transition-colors duration-500 ${isDarkMode ? 'bg-[#050505] text-gray-200' : 'bg-gray-100 text-gray-900'}`}>
      <style dangerouslySetInnerHTML={{ __html: neonCSS }} /> 
      
      {/* 🟢 2. แถบเมนูด้านบนสำหรับมือถือ (แสดงเฉพาะจอมือถือ) */}
      <div className={`md:hidden w-full flex items-center justify-between p-4 border-b shadow-md z-20 shrink-0 ${isDarkMode ? 'bg-gray-950 border-cyan-900' : 'bg-white border-cyan-200'}`}>
        <div className="text-xl font-black text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-fuchsia-500 tracking-widest">CCOC MOBILE</div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className={`p-2 rounded-lg border transition-colors ${isDarkMode ? 'bg-gray-900 border-gray-700 text-cyan-400' : 'bg-gray-100 border-gray-300 text-cyan-600'}`}>
          {isMobileMenuOpen ? <X size={24} /> : <List size={24} />}
        </button>
      </div>

      {/* 🟢 3. SIDEBAR (ซ่อนเวลากดดูบนมือถือ) */}
      <div className={`${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex w-full md:w-72 flex-col shadow-[10px_0_30px_rgba(6,182,212,0.05)] z-10 shrink-0 transition-colors duration-500 border-b md:border-b-0 md:border-r ${isDarkMode ? 'bg-gray-950 border-cyan-900' : 'bg-white border-cyan-200'}`}>
        <div className={`p-6 border-b flex flex-col items-center justify-center relative transition-colors ${isDarkMode ? 'border-cyan-900/50' : 'border-cyan-100'}`}>
          <div className={`absolute top-4 right-4 text-[10px] font-bold px-2 py-1 rounded ${currentUser.role === 'admin' ? 'bg-red-900/30 text-red-500 border border-red-500/30' : 'bg-cyan-900/30 text-cyan-500 border border-cyan-500/30'}`}>
            {currentUser.role === 'admin' ? 'ADMIN' : 'USER'}
          </div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-fuchsia-500 tracking-widest drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] mt-2 anim-fade-in-down">CCOC</h1>
          <p className="text-xs text-cyan-500 font-mono tracking-widest mt-1 text-center anim-fade-in" style={{ animationDelay: '120ms' }}>ระบบบันทึกข้อมูลภารกิจรถปฏิบัติการเคลื่อนที่ CCOC Mobile</p>
        </div>
        
        <div className="flex flex-col p-4 gap-3 mt-4">
          <button onClick={() => { setActiveMenu(1); setIsMobileMenuOpen(false); }} style={{ animationDelay: '100ms' }} className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-300 font-bold active:scale-95 hover:translate-x-1 hover:shadow-[0_0_15px_rgba(217,70,239,0.3)] anim-fade-in-left ${activeMenu === 1 ? `neon-btn text-fuchsia-500 border shadow-[0_0_15px_rgba(217,70,239,0.2)] ${isDarkMode ? 'bg-fuchsia-900/40 border-fuchsia-500/50' : 'bg-fuchsia-100 border-fuchsia-300'}` : `hover:text-fuchsia-400 ${isDarkMode ? 'hover:bg-gray-900 text-gray-500' : 'hover:bg-gray-50 text-gray-500'}`}`}><PenTool size={20} /> <span>1. บันทึกภารกิจรถโมบาย</span></button>
          <button onClick={() => { setActiveMenu(2); setIsMobileMenuOpen(false); }} style={{ animationDelay: '180ms' }} className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-300 font-bold active:scale-95 hover:translate-x-1 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] anim-fade-in-left ${activeMenu === 2 ? `neon-btn text-cyan-500 border shadow-[0_0_15px_rgba(34,211,238,0.2)] ${isDarkMode ? 'bg-cyan-900/40 border-cyan-500/50' : 'bg-cyan-100 border-cyan-300'}` : `hover:text-cyan-400 ${isDarkMode ? 'hover:bg-gray-900 text-gray-500' : 'hover:bg-gray-50 text-gray-500'}`}`}><List size={20} /> <span>2. รายการสถิติข้อมูลภารกิจ</span></button>
          <button onClick={() => { setActiveMenu(3); setIsMobileMenuOpen(false); }} style={{ animationDelay: '260ms' }} className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-300 font-bold active:scale-95 hover:translate-x-1 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] anim-fade-in-left ${activeMenu === 3 ? `neon-btn text-yellow-500 border shadow-[0_0_15px_rgba(168,85,247,0.2)] ${isDarkMode ? 'bg-purple-900/40 border-purple-500/50' : 'bg-purple-100 border-purple-300'}` : `hover:text-purple-400 ${isDarkMode ? 'hover:bg-gray-900 text-gray-500' : 'hover:bg-gray-50 text-gray-500'}`}`}><LineChart size={20} /> <span>3. แดชบอร์ดวิเคราะห์สถิติ</span></button>

          <button 
            onClick={() => setIsDarkMode(!isDarkMode)} 
            className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-300 font-bold active:scale-95 mt-2 ${
              isDarkMode 
                ? 'hover:bg-gray-900 text-yellow-500 bg-gray-900/30 border border-gray-800' 
                : 'hover:bg-gray-200 text-indigo-600 bg-gray-100 border border-gray-300'
            }`}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />} 
            <span>{isDarkMode ? 'สลับเป็นธีมสว่าง' : 'สลับเป็นธีมมืด'}</span>
          </button>
        </div>
        
        <div className={`mt-auto p-4 border-t flex flex-col gap-3 transition-colors ${isDarkMode ? 'border-cyan-900/50 bg-gray-900/30' : 'border-cyan-100 bg-gray-50'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full border flex items-center justify-center ${isDarkMode ? 'bg-cyan-900/50 border-cyan-500/30 text-cyan-400' : 'bg-cyan-100 border-cyan-300 text-cyan-600'}`}><UserCircle size={20}/></div>
            <div className="flex-1 overflow-hidden">
              <p className={`text-sm font-bold truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{currentUser.role === 'admin' ? 'Master Admin' : VEHICLE_NAMES[currentUser.username] || currentUser.username}</p>
              <p className={`text-[10px] font-mono truncate ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>{currentUser.affiliation}</p>
            </div>
          </div>
          <button onClick={() => { setCurrentUser(null); setActiveMenu(1); setIsMobileMenuOpen(false); }} className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg border transition-all active:scale-95 text-xs font-bold tracking-wider ${isDarkMode ? 'bg-red-950/30 text-red-400 hover:bg-red-900 hover:text-white border-red-900/50' : 'bg-red-50 text-red-600 hover:bg-red-500 hover:text-white border-red-200'}`}>
            <LogOut size={14} /> LOGOUT
          </button>
        </div>
      </div>

      {/* 🟢 4. พื้นที่แสดงฟอร์มหลัก (ลด Padding ไม่ให้ล้นจอมือถือ) */}
      <div className="flex-1 w-full p-4 md:p-10 h-full md:h-screen overflow-y-auto relative isolate" onClick={() => setIsMobileMenuOpen(false)}>
        {/* 🟢 ภาพแบคกราวด์ (ปรับ opacity ความสว่างได้ตามใจชอบ ตรงคำว่า opacity-15) */}
        <div className="fixed inset-0 md:left-72 -z-10 bg-cover bg-center bg-no-repeat opacity-15 pointer-events-none" style={{ backgroundImage: `url('/login-bg.jpg')` }} />
        {/* 🟢 MENU 1: ฟอร์มเพิ่มข้อมูล */}
        {activeMenu === 1 && (
          <div className={`w-full max-w-6xl mx-auto border p-4 md:p-8 rounded-2xl transition-colors duration-500 anim-fade-in-up ${isDarkMode ? 'border-fuchsia-500/50 bg-fuchsia-950/10 shadow-[0_0_30px_rgba(217,70,239,0.1)]' : 'border-fuchsia-200 bg-white shadow-xl'}`}>
             <h2 className={`text-3xl font-bold mb-6 flex items-center gap-3 border-b pb-4 ${isDarkMode ? 'text-cyan-400 border-fuchsia-900/50' : 'text-fuchsia-600 border-fuchsia-100'}`}><PenTool className="anim-float" /> บันทึกภารกิจใหม่ (DATA ENTRY)</h2>
             <form onSubmit={(e) => handleSubmit(e, "add")} className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className={`text-sm font-mono ${isDarkMode ? 'text-fuchsia-300' : 'text-fuchsia-700 font-bold'}`}>สังกัดของรถโมบาย (Affiliation)</label>
                <select required disabled={currentUser.role === "user"} name="affiliation" value={formData.affiliation} onChange={handleChange} className={`p-3 border rounded-lg focus:outline-none disabled:opacity-50 transition-colors ${isDarkMode ? 'bg-black/50 border-fuchsia-500/30 text-white focus:border-fuchsia-400' : 'bg-white border-gray-300 text-black focus:border-fuchsia-500'}`}>
                  <option value="" disabled>-- โปรดเลือกสังกัดท่าน --</option><option value="บช.ทท.">1. กองบัญชาการตำรวจท่องเที่ยว (บช.ทท.)</option><option value="บก.ทท.1">2. กองบังคับการตำรวจท่องเที่ยว 1</option><option value="บก.ทท.2">3. กองบังคับการตำรวจท่องเที่ยว 2</option><option value="บก.ทท.3">4. กองบังคับการตำรวจท่องเที่ยว 3</option>
                </select>
              </div>
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className={`text-sm font-mono ${isDarkMode ? 'text-fuchsia-300' : 'text-fuchsia-700 font-bold'}`}>ใส่รหัสรถโมบายในสังกัดท่าน</label>
                <select required disabled={currentUser.role === "user"} name="vehicle_id" value={formData.vehicle_id} onChange={handleChange} className={`p-3 border rounded-lg focus:outline-none disabled:opacity-50 transition-colors ${isDarkMode ? 'bg-black/50 border-fuchsia-500/30 text-white focus:border-fuchsia-400' : 'bg-white border-gray-300 text-black focus:border-fuchsia-500'}`}>
                  <option value="" disabled>-- เลือกรหัสรถ --</option><option value="stc01">1. stc01 บช.ทท.</option><option value="stc02">2. stc02 ภูเก็ต</option><option value="stc03">3. stc03 อยุธยา</option><option value="stc04">4. stc04 ชลบุรี</option><option value="stc05">5. stc05 โคราช</option><option value="stc06">6. stc06 เชียงใหม่</option><option value="stc07">7. stc07 พิษณุโลก</option><option value="stc08">8. stc08 หัวหิน</option><option value="stc09">9. stc09 สนามศุภชลาศัย</option><option value="stc10">10. stc10 หาดใหญ่</option><option value="UAV Mobile">11. UAV Mobile</option>
                </select>
              </div>
              <div className="flex flex-col gap-1"><label className={`text-sm font-mono ${isDarkMode ? 'text-fuchsia-300' : 'text-fuchsia-700 font-bold'}`}>1. หน่วยที่ออกภารกิจ</label><input required type="text" name="unit_name" value={formData.unit_name} onChange={handleChange} placeholder="เช่น ฝอ.6 บก.อก.บช.ทท." className={`p-3 border rounded-lg focus:outline-none transition-colors ${isDarkMode ? 'bg-black/50 border-fuchsia-500/30 text-white focus:border-fuchsia-400' : 'bg-white border-gray-300 text-black focus:border-fuchsia-500'}`} /></div>
              {/* 🟢 ย้ายจังหวัดมาอยู่หลังชื่อภารกิจเรียบร้อยครับ */}
              <div className="flex flex-col gap-1 md:col-span-2"><label className={`text-sm font-mono ${isDarkMode ? 'text-fuchsia-300' : 'text-fuchsia-700 font-bold'}`}>2. ชื่อภารกิจ</label><input required type="text" name="mission_name" value={formData.mission_name} onChange={handleChange} placeholder="ระบุชื่อภารกิจ..." className={`p-3 border rounded-lg focus:outline-none transition-colors ${isDarkMode ? 'bg-black/50 border-fuchsia-500/30 text-white focus:border-fuchsia-400' : 'bg-white border-gray-300 text-black focus:border-fuchsia-500'}`} /></div>
              <div className="flex flex-col gap-1"><label className={`text-sm font-mono ${isDarkMode ? 'text-fuchsia-300' : 'text-fuchsia-700 font-bold'}`}>พิกัด/จังหวัด ที่ออกปฏิบัติภารกิจ</label><input required type="text" name="province" value={formData.province} onChange={handleChange} placeholder="เช่น สวนเบญ จ.กรุงเทพมหานคร" className={`p-3 border rounded-lg focus:outline-none transition-colors ${isDarkMode ? 'bg-black/50 border-fuchsia-500/30 text-white focus:border-fuchsia-400' : 'bg-white border-gray-300 text-black focus:border-fuchsia-500'}`} /></div>
              <div className="flex flex-col gap-1"><label className={`text-sm font-mono ${isDarkMode ? 'text-fuchsia-300' : 'text-fuchsia-700 font-bold'}`}>3. วันที่เริ่มภารกิจ</label><input required type="date" name="start_date" value={formData.start_date} onChange={handleChange} className={`p-3 border rounded-lg focus:outline-none transition-colors ${isDarkMode ? 'bg-black/50 border-fuchsia-500/30 text-white focus:border-fuchsia-400' : 'bg-white border-gray-300 text-black focus:border-fuchsia-500'}`} style={{colorScheme: isDarkMode ? "dark" : "light"}} /></div>
              <div className="flex flex-col gap-1"><label className={`text-sm font-mono ${isDarkMode ? 'text-fuchsia-300' : 'text-fuchsia-700 font-bold'}`}>3. วันที่สิ้นสุดภารกิจ</label><input required type="date" name="end_date" value={formData.end_date} onChange={handleChange} className={`p-3 border rounded-lg focus:outline-none transition-colors ${isDarkMode ? 'bg-black/50 border-fuchsia-500/30 text-white focus:border-fuchsia-400' : 'bg-white border-gray-300 text-black focus:border-fuchsia-500'}`} style={{colorScheme: isDarkMode ? "dark" : "light"}} /></div>
              <div className="flex flex-col gap-1"><label className={`text-sm font-mono font-bold ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>รวมระยะเวลา (วัน)</label><input readOnly type="text" name="total_days" value={formData.total_days} placeholder="ระบบคำนวณอัตโนมัติ" className={`p-3 border rounded-lg focus:outline-none cursor-not-allowed font-bold ${isDarkMode ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300' : 'bg-cyan-50 border-cyan-300 text-cyan-800'}`} /></div>
              <div className="flex flex-col gap-1"><label className={`text-sm font-mono ${isDarkMode ? 'text-fuchsia-300' : 'text-fuchsia-700 font-bold'}`}>4. ระยะทางจากที่ตั้งรถไปจุดจัดงาน</label><input type="number" name="distance_km" value={formData.distance_km} onChange={handleChange} placeholder="ระบุระยะทาง (กม.)" className={`p-3 border rounded-lg focus:outline-none transition-colors ${isDarkMode ? 'bg-black/50 border-fuchsia-500/30 text-white focus:border-fuchsia-400' : 'bg-white border-gray-300 text-black focus:border-fuchsia-500'}`} /></div>
              <div className="flex flex-col gap-1"><label className={`text-sm font-mono ${isDarkMode ? 'text-fuchsia-300' : 'text-fuchsia-700 font-bold'}`}>5. จำนวนผู้เข้าร่วมงานโดยประมาณ(ต่อวัน)</label><input type="number" name="people_per_day" value={formData.people_per_day} onChange={handleChange} placeholder="รวมจำนวนคน(โดยประมาณ)" className={`p-3 border rounded-lg focus:outline-none transition-colors ${isDarkMode ? 'bg-black/50 border-fuchsia-500/30 text-white focus:border-fuchsia-400' : 'bg-white border-gray-300 text-black focus:border-fuchsia-500'}`} /></div>
              <div className="flex flex-col gap-1"><label className={`text-sm font-mono font-bold ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>รวมจำนวนผู้เข้าร่วมงานทั้งหมด</label><input readOnly type="text" name="people_total" value={formData.people_total} placeholder="ระบบคำนวณอัตโนมัติ" className={`p-3 border rounded-lg focus:outline-none cursor-not-allowed font-bold ${isDarkMode ? 'bg-green-950/40 border-green-500/50 text-green-400' : 'bg-green-50 border-green-300 text-green-700'}`} /></div>
              <div className="flex flex-col gap-1 md:col-span-2"><label className={`text-sm font-mono ${isDarkMode ? 'text-fuchsia-300' : 'text-fuchsia-700 font-bold'}`}>6. เหตุสำคัญ / รับแจ้ง</label><input type="text" name="incident_report" value={formData.incident_report} onChange={handleChange} placeholder="เช่น เหตุการณ์ปกติ, รับแจ้งเด็กพลัดหลง, นักท่องเที่ยวสอบถามข้อมูล..." className={`p-3 border rounded-lg focus:outline-none transition-colors ${isDarkMode ? 'bg-black/50 border-fuchsia-500/30 text-white focus:border-fuchsia-400' : 'bg-white border-gray-300 text-black focus:border-fuchsia-500'}`} /></div>
              <div className="flex flex-col gap-1 md:col-span-4"><label className={`text-sm font-mono ${isDarkMode ? 'text-fuchsia-300' : 'text-fuchsia-700 font-bold'}`}>7. หมายเหตุ</label><textarea rows={3} name="remark" value={formData.remark} onChange={handleChange} placeholder="ระบุเพิ่มเติม(ถ้ามี)...กล้อง ai รถโมบายแจ้งเตือนตรวจจับใบหน้าตรวจสอบแล้วถูกต้อง 1 ราย/ไม่ถูกต้อง 1 ราย" className={`p-3 border rounded-lg focus:outline-none transition-colors resize-y ${isDarkMode ? 'bg-black/50 border-fuchsia-500/30 text-white focus:border-fuchsia-400' : 'bg-white border-gray-300 text-black focus:border-fuchsia-500'}`} />
              </div><div className="md:col-span-4 mt-6 flex justify-end">
                <button disabled={isSubmitting} type="submit" className="neon-btn active:scale-95 px-10 py-4 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(217,70,239,0.5)] transition-all"> 
                  {isSubmitting ? "กำลังส่งเข้าฐานข้อมูล..." : "บันทึกเข้าฐานข้อมูล"} 
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 🟢 MENU 2: รายการภารกิจ */}
        {activeMenu === 2 && (
          <div className="w-full max-w-[96%] mx-auto h-[85vh] flex flex-col pt-10 lg:pt-0 anim-fade-in">
            <div className={`flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b pb-4 shrink-0 transition-colors anim-fade-in-down ${isDarkMode ? 'border-cyan-900/50' : 'border-cyan-200'}`}>
              <h2 className={`text-3xl font-bold flex items-center gap-3 ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}><List className="anim-float" /> รายการสถิติข้อมูลภารกิจ</h2>
              
              <div className="flex flex-wrap items-center gap-2 mt-4 md:mt-0">
                {/* 🟢 ปุ่มรีเฟรชข้อมูล (หน้ารายการ) */}
                <button onClick={() => { setLoading(true); fetchData(); }} className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg transition-all active:scale-95 border ${isDarkMode ? 'bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border-blue-500/50 shadow-[0_0_10px_rgba(37,99,235,0.2)]' : 'bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white border-blue-300'}`}>
                  <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> รีเฟรชข้อมูล
                </button>
                <button onClick={handleExportExcel} className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg transition-all active:scale-95 border ${isDarkMode ? 'bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.2)]' : 'bg-green-50 hover:bg-green-600 text-green-600 hover:text-white border-green-300'}`}>
                  <FileSpreadsheet size={14} /> EXCEL
                </button>
                <button onClick={handleExportPDF} className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg transition-all active:scale-95 border ${isDarkMode ? 'bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border-red-300'}`}>
                  <Printer size={14} /> ดึงไฟล์ออกเป็นตาราง PDF
                </button>

                <div className={`flex items-center gap-2 p-2 rounded-lg border ml-2 transition-colors ${isDarkMode ? 'bg-gray-900/50 border-cyan-900/50' : 'bg-white border-cyan-200 shadow-sm'}`}>
                  <Calendar className={isDarkMode ? "text-cyan-500" : "text-cyan-600"} size={16} />
                  <input type="date" value={logFilterStartDate} onChange={(e) => setLogFilterStartDate(e.target.value)} className={`text-xs p-1.5 rounded border focus:outline-none transition-colors ${isDarkMode ? 'bg-black text-gray-300 border-gray-800 focus:border-cyan-500' : 'bg-gray-50 text-gray-900 border-gray-300 focus:border-cyan-500'}`} style={{colorScheme: isDarkMode ? "dark" : "light"}} />
                  <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>-</span>
                  <input type="date" value={logFilterEndDate} onChange={(e) => setLogFilterEndDate(e.target.value)} className={`text-xs p-1.5 rounded border focus:outline-none transition-colors ${isDarkMode ? 'bg-black text-gray-300 border-gray-800 focus:border-cyan-500' : 'bg-gray-50 text-gray-900 border-gray-300 focus:border-cyan-500'}`} style={{colorScheme: isDarkMode ? "dark" : "light"}} />
                </div>

                <div className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${isDarkMode ? 'bg-gray-900/50 border-cyan-900/50' : 'bg-white border-cyan-200 shadow-sm'}`}>
                  <Filter className={isDarkMode ? "text-cyan-500" : "text-cyan-600"} size={16} />
                  <select value={logFilterAffiliation} onChange={(e) => setLogFilterAffiliation(e.target.value)} className={`text-xs font-bold p-1.5 rounded border focus:outline-none transition-colors ${isDarkMode ? 'bg-black text-orange-400 border-orange-800' : 'bg-gray-50 text-orange-600 border-orange-200'}`}>
                    <option value="ALL">ทุกสังกัด</option><option value="บช.ทท.">บช.ทท.</option><option value="บก.ทท.1">บก.ทท.1</option><option value="บก.ทท.2">บก.ทท.2</option><option value="บก.ทท.3">บก.ทท.3</option>
                  </select>
                </div>
              </div>
            </div>

            {loading ? ( <div className="flex justify-center items-center h-40"><p className="text-cyan-300 font-mono animate-pulse text-lg">&gt; รอสักครู่...กำลังดึงฐานข้อมูลอยู่จ้า!!</p></div> ) : (
              <div className={`border rounded-2xl overflow-hidden flex flex-col flex-1 min-h-0 transition-colors ${isDarkMode ? 'bg-gray-900/50 border-cyan-900/50 shadow-[0_0_20px_rgba(6,182,212,0.05)]' : 'bg-white border-gray-200 shadow-lg'}`}>
                {/* 🟢 เพิ่มการห่อหุ้มตารางให้เลื่อนซ้ายขวาได้ */}
                <div className="overflow-x-auto flex-1 flex flex-col min-h-0 w-full custom-scrollbar">
                  <div className="min-w-200 flex flex-col flex-1 min-h-0">
                    <div className={`grid grid-cols-12 gap-4 p-4 border-b text-sm tracking-wider shrink-0 pr-6 transition-colors ${isDarkMode ? 'bg-cyan-950/40 border-cyan-800/50 text-cyan-300 font-bold' : 'bg-gray-100 border-gray-200 text-gray-700 font-bold'}`}>
                      <div className="col-span-1 text-center">ลำดับ.</div><div className="col-span-4">MISSION NAME / ชื่อภารกิจ</div><div className="col-span-2 text-center">หน่วยงานที่ออกภารกิจ</div><div className="col-span-2">พิกัด / จังหวัดที่ปฏิบัติภารกิจ</div><div className="col-span-3 text-right">DATE RECORDED</div>
                    </div>
                    <div className={`divide-y overflow-y-auto flex-1 custom-scrollbar transition-colors ${isDarkMode ? 'divide-cyan-900/30' : 'divide-gray-100'}`}>
                      {filteredLogs.map((mission: any, index: number) => (
                        <div key={index} onClick={() => { setSelectedMission(mission); setIsEditing(false); }} style={{ animationDelay: `${Math.min(index, 15) * 30}ms` }} className={`grid grid-cols-12 gap-4 p-4 items-center cursor-pointer transition-all duration-200 group anim-fade-in-up ${isDarkMode ? 'hover:bg-cyan-900/20 hover:translate-x-1' : 'hover:bg-gray-50 hover:translate-x-1'}`}>
                          <div className={`col-span-1 text-center font-mono transition-colors ${isDarkMode ? 'text-gray-500 group-hover:text-cyan-400' : 'text-gray-400 group-hover:text-cyan-600'}`}>{(index + 1).toString().padStart(3, '0')}</div>
                          <div className={`col-span-4 font-bold truncate pr-4 transition-colors ${isDarkMode ? 'text-gray-200 group-hover:text-white' : 'text-gray-800 group-hover:text-black'}`}>{mission.mission_name || "ไม่ระบุชื่อภารกิจ"}</div>
                          <div className="col-span-2 text-center"><span className={`text-xs font-mono px-2 py-1 rounded border inline-block ${getAffiliationColor(mission.affiliation, isDarkMode)}`}>{mission.affiliation || "-"}</span></div>
                          <div className={`col-span-2 truncate pr-2 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{mission.province}</div>
                          <div className={`col-span-3 text-right font-mono text-xs transition-colors ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{mission.timestamp ? new Date(mission.timestamp).toLocaleString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-'}</div>
                        </div>
                      ))}
                      {filteredLogs.length === 0 && <div className="text-center py-10"><p className={isDarkMode ? 'text-gray-500 font-mono' : 'text-gray-400 font-mono'}>NO DATA FOUND FOR THIS PERIOD</p></div>}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 🟢 MENU 3: Dashboard - ส่ง fetchData ไปให้ปุ่มรีเฟรชข้างในด้วย */}
        {activeMenu === 3 && ( 
          loading ? 
          <div className="flex justify-center items-center h-40"><p className="text-purple-300 font-mono animate-pulse text-lg">&gt; Loading Dashboard...</p></div> : 
          <div className={isDarkMode ? "" : "bg-[#1a1d2b] p-6 rounded-3xl shadow-2xl border border-gray-300"}><DashboardView missions={allowedMissions} refreshData={fetchData} /> </div> )}
          </div>

      {/* POPUP MODAL (รายละเอียด / แก้ไข) */}
      {selectedMission && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          {/* 🟢 หน้าจอ Loading ตอนกดลบข้อมูล (Full Screen Overlay สีแดง) */}
          {isDeleting && (
            <div className="absolute inset-0 z-100 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-200">
              <div className="w-20 h-20 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin shadow-[0_0_30px_rgba(239,68,68,0.6)] mb-6"></div>
              <h2 className="text-3xl font-black text-red-500 tracking-[0.2em] drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] mb-2">DELETING</h2>
              <p className="text-red-400/80 font-mono text-sm tracking-widest animate-pulse">กำลังลบข้อมูล...ห้ามปิดหน้าจอ</p>
            </div>
          )}
          <div className={`border shadow-[0_0_40px_rgba(6,182,212,0.3)] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200 transition-colors ${isDarkMode ? 'bg-[#0a0a0a] border-cyan-500' : 'bg-white border-gray-300'}`}>
            <div className={`flex justify-between items-center p-6 border-b sticky top-0 z-10 backdrop-blur-md transition-colors ${isDarkMode ? 'border-cyan-900/50 bg-cyan-950/30' : 'border-gray-200 bg-white/90'}`}>
              <h3 className={`text-2xl font-bold flex items-center gap-2 ${isEditing ? (isDarkMode ? 'text-yellow-300' : 'text-yellow-600') : (isDarkMode ? 'text-cyan-300' : 'text-cyan-700')}`}>{isEditing ? <Edit3 className="text-yellow-400 anim-pulse-glow" /> : <List className="text-cyan-500 anim-pulse-glow" />} {isEditing ? "EDIT MISSION DATA" : "MISSION DETAILS"}</h3>
              <div className="flex items-center gap-3">
                {!isEditing && (currentUser.role === "admin" || String(selectedMission.vehicle_id) === String(currentUser.vehicle_id)) && ( 
                  <>
                    <button onClick={handleEditClick} className="flex items-center gap-2 px-4 py-2 bg-yellow-600/20 text-yellow-400 border border-yellow-500/50 rounded-lg hover:bg-yellow-600 hover:text-white transition-all active:scale-95">
                      <Edit3 size={18} /> แก้ไขข้อมูล
                    </button> 
                    <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 bg-red-900/40 text-red-400 border border-red-500/50 rounded-lg hover:bg-red-600 hover:text-white transition-all active:scale-95">
                      <Trash2 size={18} /> ลบรายการนี้
                    </button>
                  </>
                )}
                <button onClick={() => setSelectedMission(null)} className={`transition-colors p-2 rounded-full active:scale-90 ${isDarkMode ? 'text-gray-400 hover:text-red-400 bg-gray-900 hover:bg-red-900/30' : 'text-gray-500 hover:text-red-600 bg-gray-100 hover:bg-red-50'}`}><X size={24} /></button>
              </div>
            </div>
            
            <div className="p-8">
              {!isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div><p className={`text-xs font-bold tracking-widest mb-1 ${isDarkMode ? 'text-cyan-600' : 'text-gray-500'}`}>ชื่อภารกิจ</p><p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedMission.mission_name}</p></div>
                    <div className="flex items-center gap-3"><div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-900 text-cyan-500' : 'bg-cyan-50 text-cyan-600'}`}><MapPin /></div><div><p className={`text-xs font-bold tracking-widest mb-1 ${isDarkMode ? 'text-cyan-600' : 'text-gray-500'}`}>พิกัด / จังหวัด</p><p className={`text-lg ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{selectedMission.province}</p></div></div>
                    <div className="flex items-center gap-3"><div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-900 text-fuchsia-500' : 'bg-fuchsia-50 text-fuchsia-600'}`}><Shield /></div><div><p className={`text-xs font-bold tracking-widest mb-1 ${isDarkMode ? 'text-cyan-600' : 'text-gray-500'}`}>สังกัด / รหัสรถโมบาย</p><p className={`flex items-center gap-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}><span className={`text-xs font-mono px-2 py-0.5 rounded border inline-block ${getAffiliationColor(selectedMission.affiliation, isDarkMode)}`}>{selectedMission.affiliation || "ไม่ระบุสังกัด"}</span><span className={`font-mono border px-2 py-0.5 rounded ${isDarkMode ? 'text-fuchsia-400 border-fuchsia-500/30 bg-fuchsia-500/10' : 'text-fuchsia-700 border-fuchsia-300 bg-fuchsia-50'}`}>{VEHICLE_NAMES[selectedMission.vehicle_id] || selectedMission.vehicle_id}</span></p></div></div>
                  </div>
                  <div className="space-y-6">
                    <div className="flex items-center gap-3"><div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-900 text-yellow-500' : 'bg-yellow-50 text-yellow-600'}`}><Calendar /></div><div><p className={`text-xs font-bold tracking-widest mb-1 ${isDarkMode ? 'text-cyan-600' : 'text-gray-500'}`}>ห้วงเวลาการปฏิบัติการ</p><p className={isDarkMode ? 'text-gray-200' : 'text-gray-800'}>{selectedMission.start_date ? new Date(selectedMission.start_date).toLocaleDateString('th-TH') : '-'} <span className="mx-2 text-gray-500">to</span> {selectedMission.end_date ? new Date(selectedMission.end_date).toLocaleDateString('th-TH') : '-'}</p><p className={`text-sm mt-1 font-bold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>Total: {selectedMission.total_days} Days</p></div></div>
                    <div className="flex items-center gap-3"><div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-900 text-green-500' : 'bg-green-50 text-green-600'}`}><Users /></div><div><p className={`text-xs font-bold tracking-widest mb-1 ${isDarkMode ? 'text-cyan-600' : 'text-gray-500'}`}>จำนวนผู้เข้าร่วมงานโดยประมาณ</p><p className={`text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{Number(selectedMission.people_total).toLocaleString()} <span className="text-sm font-normal text-gray-400">คน</span></p></div></div>
                  </div>
                  <div className={`md:col-span-2 border-t pt-6 mt-2 grid grid-cols-2 gap-4 ${isDarkMode ? 'border-cyan-900/30' : 'border-gray-200'}`}>
                    <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-50 border-gray-200'}`}><p className={`text-xs font-bold tracking-widest mb-2 ${isDarkMode ? 'text-cyan-600' : 'text-gray-500'}`}>INCIDENT REPORT</p><p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{selectedMission.incident_report || "-"}</p></div>
                    <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-50 border-gray-200'}`}><p className={`text-xs font-bold tracking-widest mb-2 ${isDarkMode ? 'text-cyan-600' : 'text-gray-500'}`}>REMARK / DISTANCE</p><p className={`text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{selectedMission.remark || "-"}</p><p className={`text-sm font-mono mt-2 ${isDarkMode ? 'text-cyan-500' : 'text-cyan-600'}`}>Distance: {selectedMission.distance_km} km</p></div>
                  </div>
                </div>
              ) : (
                <form onSubmit={(e) => handleSubmit(e, "edit")} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1 md:col-span-2"><label className={`text-xs font-mono font-bold ${isDarkMode ? 'text-yellow-400' : 'text-gray-700'}`}>สังกัดของรถโมบาย (Affiliation)</label>
                    <select required disabled={currentUser.role === "user"} name="affiliation" value={formData.affiliation} onChange={handleChange} className={`p-2 border rounded focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${isDarkMode ? 'bg-black/50 border-yellow-500/30 text-white focus:border-yellow-400' : 'bg-white border-gray-300 text-black focus:border-yellow-500'}`}>
                      <option value="" disabled>-- โปรดเลือกสังกัด --</option><option value="บช.ทท.">1. กองบัญชาการตำรวจท่องเที่ยว (บช.ทท.)</option><option value="บก.ทท.1">2. กองบังคับการตำรวจท่องเที่ยว 1</option><option value="บก.ทท.2">3. กองบังคับการตำรวจท่องเที่ยว 2</option><option value="บก.ทท.3">4. กองบังคับการตำรวจท่องเที่ยว 3</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1"><label className={`text-xs font-mono font-bold ${isDarkMode ? 'text-yellow-400' : 'text-gray-700'}`}>1. หน่วยที่ออกภารกิจ</label><input required type="text" name="unit_name" value={formData.unit_name} onChange={handleChange} className={`p-2 border rounded focus:outline-none ${isDarkMode ? 'bg-black/50 border-yellow-500/30 text-white focus:border-yellow-400' : 'bg-white border-gray-300 text-black focus:border-yellow-500'}`} /></div>
                  <div className="flex flex-col gap-1">
                    <label className={`text-xs font-mono font-bold ${isDarkMode ? 'text-yellow-400' : 'text-gray-700'}`}>รหัสรถโมบายในสังกัดท่าน</label>
                    <select disabled name="vehicle_id" value={formData.vehicle_id} className={`p-2 border rounded focus:outline-none cursor-not-allowed ${isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-500' : 'bg-gray-100 border-gray-300 text-gray-500'}`}>
                      <option value="stc01">1. stc01 บช.ทท.</option><option value="stc02">2. stc02 ภูเก็ต</option><option value="stc03">3. stc03 อยุธยา</option><option value="stc04">4. stc04 ชลบุรี</option><option value="stc05">5. stc05 โคราช</option><option value="stc06">6. stc06 เชียงใหม่</option><option value="stc07">7. stc07 พิษณุโลก</option><option value="stc08">8. stc08 หัวหิน</option><option value="stc09">9. stc09 สนามศุภชลาศัย</option><option value="stc10">10. stc10 หาดใหญ่</option><option value="UAV Mobile">11. UAV Mobile</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1 md:col-span-2"><label className={`text-xs font-mono font-bold ${isDarkMode ? 'text-yellow-400' : 'text-gray-700'}`}>2. ชื่อภารกิจ</label><input required type="text" name="mission_name" value={formData.mission_name} onChange={handleChange} className={`p-2 border rounded focus:outline-none ${isDarkMode ? 'bg-black/50 border-yellow-500/30 text-white focus:border-yellow-400' : 'bg-white border-gray-300 text-black focus:border-yellow-500'}`} /></div>
                  <div className="flex flex-col gap-1"><label className={`text-xs font-mono font-bold ${isDarkMode ? 'text-yellow-400' : 'text-gray-700'}`}>จังหวัด/พิกัดที่ออกภารกิจ</label><input required type="text" name="province" value={formData.province} onChange={handleChange} className={`p-2 border rounded focus:outline-none ${isDarkMode ? 'bg-black/50 border-yellow-500/30 text-white focus:border-yellow-400' : 'bg-white border-gray-300 text-black focus:border-yellow-500'}`} /></div>
                  <div className="flex flex-col gap-1"><label className={`text-xs font-mono font-bold ${isDarkMode ? 'text-yellow-400' : 'text-gray-700'}`}>4. ระยะทางจากที่ตั้งรถไปจุดจัดงาน (กม.)</label><input type="number" name="distance_km" value={formData.distance_km} onChange={handleChange} className={`p-2 border rounded focus:outline-none ${isDarkMode ? 'bg-black/50 border-yellow-500/30 text-white focus:border-yellow-400' : 'bg-white border-gray-300 text-black focus:border-yellow-500'}`} /></div>
                  <div className="flex flex-col gap-1"><label className={`text-xs font-mono font-bold ${isDarkMode ? 'text-yellow-400' : 'text-gray-700'}`}>3. วันที่เริ่มภารกิจ</label><input required type="date" name="start_date" value={formData.start_date} onChange={handleChange} className={`p-2 border rounded focus:outline-none ${isDarkMode ? 'bg-black/50 border-yellow-500/30 text-white' : 'bg-white border-gray-300 text-black'}`} style={{colorScheme: isDarkMode ? "dark" : "light"}}/></div>
                  <div className="flex flex-col gap-1"><label className={`text-xs font-mono font-bold ${isDarkMode ? 'text-yellow-400' : 'text-gray-700'}`}>3. วันที่สิ้นสุดภารกิจ</label><input required type="date" name="end_date" value={formData.end_date} onChange={handleChange} className={`p-2 border rounded focus:outline-none ${isDarkMode ? 'bg-black/50 border-yellow-500/30 text-white' : 'bg-white border-gray-300 text-black'}`} style={{colorScheme: isDarkMode ? "dark" : "light"}}/></div>
                  <div className="flex flex-col gap-1"><label className={`text-xs font-mono font-bold ${isDarkMode ? 'text-yellow-400' : 'text-gray-700'}`}>5. จำนวนผู้เข้าร่วมงานโดยประมาณ</label><input type="number" name="people_per_day" value={formData.people_per_day} onChange={handleChange} className={`p-2 border rounded focus:outline-none ${isDarkMode ? 'bg-black/50 border-yellow-500/30 text-white focus:border-yellow-400' : 'bg-white border-gray-300 text-black focus:border-yellow-500'}`} /></div>
                  <div className="flex flex-col gap-1"><label className={`text-xs font-mono font-bold ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>รวมจำนวนผู้เข้าร่วมงานทั้งหมด</label><input readOnly type="text" name="people_total" value={formData.people_total} className={`p-2 border rounded font-bold focus:outline-none cursor-not-allowed ${isDarkMode ? 'bg-gray-900 border-gray-700 text-green-500' : 'bg-gray-100 border-gray-300 text-green-600'}`} /></div>
                  <div className="flex flex-col gap-1 md:col-span-2"><label className={`text-xs font-mono font-bold ${isDarkMode ? 'text-yellow-400' : 'text-gray-700'}`}>6. เหตุสำคัญ / รับแจ้ง</label><input type="text" name="incident_report" value={formData.incident_report} onChange={handleChange} className={`p-2 border rounded focus:outline-none ${isDarkMode ? 'bg-black/50 border-yellow-500/30 text-white focus:border-yellow-400' : 'bg-white border-gray-300 text-black focus:border-yellow-500'}`} /></div>
                  <div className="flex flex-col gap-1 md:col-span-2"><label className={`text-xs font-mono font-bold ${isDarkMode ? 'text-yellow-400' : 'text-gray-700'}`}>7. หมายเหตุ</label><input type="text" name="remark" value={formData.remark} onChange={handleChange} className={`p-2 border rounded focus:outline-none ${isDarkMode ? 'bg-black/50 border-yellow-500/30 text-white focus:border-yellow-400' : 'bg-white border-gray-300 text-black focus:border-yellow-500'}`} /></div>
                  <div className={`md:col-span-2 mt-4 flex justify-end gap-3 border-t pt-4 ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                    <button type="button" onClick={() => setIsEditing(false)} className={`px-6 py-2 border rounded transition-all active:scale-95 ${isDarkMode ? 'border-gray-600 text-gray-400 hover:bg-gray-800' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}>ยกเลิก</button>
                    <button disabled={isSubmitting} type="submit" className="neon-btn active:scale-95 px-6 py-2 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded shadow-[0_0_15px_rgba(202,138,4,0.4)] transition-all flex items-center gap-2"><Save size={18} /> {isSubmitting ? "SAVING..." : "UPDATE DATA"}</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}