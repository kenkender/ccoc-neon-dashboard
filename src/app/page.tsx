"use client";

import { useEffect, useState } from "react";
import { PenTool, List, LineChart, X, MapPin, Users, Calendar, Car, Edit3, Save, LogOut, Shield, Filter, UserCircle, FileSpreadsheet, Printer, Sun, Moon, Trash2, RefreshCw, History, Clock } from "lucide-react";
import DashboardView from "./components/DashboardView";
import LoginView from "./components/LoginView"; 
import ThailandMap from "./components/ThailandMap";

const VEHICLE_NAMES: Record<string, string> = {
  "stc01": "1. stc01 บช.ทท.", "stc02": "2. stc02 ภูเก็ต", "stc03": "3. stc03 อยุธยา",
  "stc04": "4. stc04 ชลบุรี", "stc05": "5. stc05 โคราช", "stc06": "6. stc06 เชียงใหม่",
  "stc07": "7. stc07 พิษณุโลก", "stc08": "8. stc08 หัวหิน", "stc09": "9. stc09 สนามศุภชลาศัย",
  "stc10": "10. stc10 หาดใหญ่", "uav mobile": "11. UAV Mobile", "UAV Mobile": "11. UAV Mobile"
};

const getAffiliationColor = (affiliation: string, isDark: boolean) => {
  switch (affiliation) {
    case "บช.ทท.": return isDark ? "text-fuchsia-400 bg-fuchsia-900/20 border-fuchsia-500/40" : "text-fuchsia-700 bg-fuchsia-100 border-fuchsia-300";
    case "ฝ่ายอำนวยการ 6": case "ฝ่ายอำนวยการ 6.":return isDark ? "text-red-500 bg-red-900/20 border-red-500/40" : "text-red-700 bg-red-100 border-red-300";
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeMenu, setActiveMenu] = useState(1);
  const [selectedMission, setSelectedMission] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false); 
  const [showMapOverlay, setShowMapOverlay] = useState(true);

  const VEHICLE_AFFILIATIONS: Record<string, string> = {
    "stc01": "บช.ทท.",
    "stc02": "บก.ทท.3",
    "stc03": "บก.ทท.1",
    "stc04": "บก.ทท.1",
    "stc05": "บก.ทท.2",
    "stc06": "บก.ทท.2",
    "stc07": "บก.ทท.2",
    "stc08": "บก.ทท.3",
    "stc09": "บก.ทท.1",
    "stc10": "บก.ทท.3",
    "UAV Mobile": "บช.ทท.",
  };
  
  const [logFilterAffiliation, setLogFilterAffiliation] = useState("ALL");
  const [logFilterStartDate, setLogFilterStartDate] = useState("");
  const [logFilterEndDate, setLogFilterEndDate] = useState("");
  const [loginLogs, setLoginLogs] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    affiliation: "", unit_name: "", vehicle_id: "", mission_name: "", province: "", start_date: "", end_date: "", total_days: "", distance_km: "", people_per_day: "", people_total: "", incident_report: "", remark: ""
  });

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
      // 🔍 Debug: แสดงชื่อ key ทั้งหมดที่ API ส่งกลับมา เพื่อตรวจสอบชื่อที่ถูกต้อง
      console.log("📦 API result.data keys:", result.data ? Object.keys(result.data) : "result.data is null/undefined");
      console.log("📋 login_logs:", result.data?.login_logs);
      console.log("📋 log:", result.data?.log);
      console.log("📋 logs:", result.data?.logs);
      console.log("📋 loginLogs:", result.data?.loginLogs);
      console.log("📋 login_history:", result.data?.login_history);
      const fetchedLogs = result.data?.login_logs || result.data?.log || result.data?.logs || result.data?.loginLogs || result.data?.login_history || [];
      console.log("✅ fetchedLogs ที่ได้:", fetchedLogs);
      setLoginLogs(fetchedLogs);
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
    if (e && e.preventDefault) e.preventDefault(); setIsSubmitting(true);
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
      if (action === "edit") { setIsEditing(false); setSelectedMission(null); } else { setActiveMenu(2); setShowMapOverlay(true); }
      setLoading(true); fetchData(); 
    } catch (error) { alert("❌ เกิดข้อผิดพลาดในการส่งข้อมูล"); }
    setIsSubmitting(false);
    setShowConfirmModal(false);
  };

  const handleChange = (e: any) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };

  const handleEditClick = () => {
    const formatDate = (dateStr: string) => dateStr ? new Date(dateStr).toISOString().split('T')[0] : "";
    setFormData({
      affiliation: selectedMission.affiliation || "", unit_name: selectedMission.unit_name, vehicle_id: selectedMission.vehicle_id, mission_name: selectedMission.mission_name, province: selectedMission.province, start_date: formatDate(selectedMission.start_date), end_date: formatDate(selectedMission.end_date), total_days: selectedMission.total_days, distance_km: selectedMission.distance_km, people_per_day: selectedMission.people_per_day, people_total: selectedMission.people_total, incident_report: selectedMission.incident_report, remark: selectedMission.remark
    });
    setIsEditing(true);
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm("⚠️ คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้?\n(การลบจะไม่สามารถกู้คืนได้)");
    if (!confirmDelete) return;
    setIsDeleting(true); 
    const payload = { action: "delete", timestamp: selectedMission.timestamp };
    try {
      await fetch(API_URL, { 
        method: "POST", 
        body: JSON.stringify(payload),
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        mode: "no-cors" 
      });
      setSelectedMission(null); 
      setLoading(true); 
      fetchData(); 
    } catch (error) { 
      alert("❌ เกิดข้อผิดพลาดในการลบข้อมูล"); 
    }
    setIsDeleting(false); 
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
    const toThaiNumber = (text: any) => {
      if (text === null || text === undefined) return "";
      const arabic = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
      const thai = ["๐", "๑", "๒", "๓", "๔", "๕", "๖", "๗", "๘", "๙"];
      let str = String(text);
      for (let i = 0; i < 10; i++) {
        str = str.split(arabic[i]).join(thai[i]);
      }
      return str;
    };
    const sortedLogs = [...filteredLogs].sort((a, b) => {
      const order: Record<string, number> = { 
        "ฝ่ายอำนวยการ 6": 1, "ฝ่ายอำนวยการ 6.": 1, "บช.ทท.": 2, "บก.ทท.1": 3, "บก.ทท.2": 4, "บก.ทท.3": 5 
      };
      const affA = String(a.affiliation || "").trim(); const affB = String(b.affiliation || "").trim();
      const weightA = order[affA] || 99; const weightB = order[affB] || 99;
      if (weightA !== weightB) return weightA - weightB;
      return new Date(a.start_date || 0).getTime() - new Date(b.start_date || 0).getTime();
    });

    let html = `<html><head><title>รายงานสถิติ</title><style>@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;700&display=swap'); body { font-family: 'Sarabun', sans-serif; padding: 20px; color: #000; font-size: 11px; } h2 { text-align: center; margin-bottom: 5px; font-size: 16px; } p { text-align: center; margin-top: 0; margin-bottom: 10px; } .header-meta { text-align: center; font-size: 12px; margin-bottom: 20px; color: #333; } table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #000; padding: 6px; text-align: left; vertical-align: top; } th { background-color: #f0f0f0; text-align: center; } .text-center { text-align: center; } .text-right { text-align: right; } .bg-group { background-color: #e5e7eb; font-weight: bold; text-align: left !important; } @media print { @page { size: landscape; margin: 10mm; } body { -webkit-print-color-adjust: exact; } }</style></head><body><h2>ผลการปฏิบัติการใช้งานรถปฏิบัติการเคลื่อนที่ CCOC Mobile และ UAV Mobile</h2><p style="font-size: 14px; margin-bottom: 15px;"><strong>ประจำห้วงเวลา:</strong> ${toThaiNumber(getDateRangeText())}</p><div class="header-meta"><strong>ผู้พิมพ์รายงาน:</strong> ${toThaiNumber(currentUser.role === 'admin' ? 'Master Admin' : currentUser.affiliation)} | <strong>วันที่พิมพ์:</strong> ${toThaiNumber(new Date().toLocaleString('th-TH'))}</div><table><thead><tr><th rowspan="2" width="4%">ลำดับ</th><th rowspan="2" width="15%">หน่วย</th><th rowspan="2" width="20%">ชื่อภารกิจ / จังหวัด</th><th colspan="3">วัน เดือน ปี จัดงาน</th><th rowspan="2" width="8%">ระยะทางที่ตั้งรถ ถึง จุดจัดงาน<br/>ไป-กลับ(กม.)</th><th colspan="2">จำนวนผู้ร่วมงาน</th><th rowspan="2" width="15%">เหตุการณ์สำคัญที่รับแจ้ง</th><th rowspan="2" width="10%">หมายเหตุ</th></tr><tr><th width="6%">เริ่มวันที่</th><th width="6%">ถึงวันที่</th><th width="5%">รวม/วัน</th><th width="5%">ต่อวัน</th><th width="6%">ตลอดงาน</th></tr></thead><tbody>`;
    
    let currentAffiliation = ""; let rowIndex = 1;
    sortedLogs.forEach((m: any) => {
      const aff = String(m.affiliation || "ไม่ระบุสังกัด").trim();
      if (aff !== currentAffiliation) { html += `<tr><td colspan="11" class="bg-group">${toThaiNumber(aff)}</td></tr>`; currentAffiliation = aff; rowIndex = 1; }
      
      const unitName = `${m.unit_name || "-"}<br/><small>${VEHICLE_NAMES[m.vehicle_id] || m.vehicle_id}</small>`;
      const missionAndProv = `${m.mission_name || "-"}<br/><b>${m.province || "-"}</b>`;
      const sDate = m.start_date ? new Date(m.start_date).toLocaleDateString('th-TH', {day:'2-digit', month:'short', year:'2-digit'}) : "-";
      const eDate = m.end_date ? new Date(m.end_date).toLocaleDateString('th-TH', {day:'2-digit', month:'short', year:'2-digit'}) : "-";
      
      html += `<tr><td class="text-center">${toThaiNumber(rowIndex++)}</td><td>${toThaiNumber(unitName)}</td><td>${toThaiNumber(missionAndProv)}</td><td class="text-center">${toThaiNumber(sDate)}</td><td class="text-center">${toThaiNumber(eDate)}</td><td class="text-center">${toThaiNumber(m.total_days || 0)}</td><td class="text-center">${toThaiNumber(m.distance_km || 0)}</td><td class="text-right">${toThaiNumber(Number(m.people_per_day || 0).toLocaleString())}</td><td class="text-right">${toThaiNumber(Number(m.people_total || 0).toLocaleString())}</td><td>${toThaiNumber(m.incident_report || "-")}</td><td>${toThaiNumber(m.remark || "-")}</td></tr>`;
    });

    const totalMissions = sortedLogs.length;
    const totalDistance = sortedLogs.reduce((sum, m) => sum + Number(m.distance_km || 0), 0);
    const totalPeoplePerDay = sortedLogs.reduce((sum, m) => sum + Number(m.people_per_day || 0), 0);
    const totalPeopleAll = sortedLogs.reduce((sum, m) => sum + Number(m.people_total || 0), 0);

    html += `
        <tr style="background-color: #d1d5db; font-weight: bold; font-size: 12px;">
          <td colspan="6" class="text-right">รวมสถิติในห้วงเวลานี้ทั้งหมด ${toThaiNumber(totalMissions.toLocaleString())} ภารกิจ :</td>
          <td class="text-center">${toThaiNumber(totalDistance.toLocaleString())}</td>
          <td class="text-right">${toThaiNumber(totalPeoplePerDay.toLocaleString())}</td>
          <td class="text-right">${toThaiNumber(totalPeopleAll.toLocaleString())}</td>
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

  const realistic3DUICSS = `
    /* พื้นหลังแบบไล่ระดับความลึก (Depth Screen) */
    .bg-depth-dark { background: radial-gradient(circle at 50% -20%, #1e293b 0%, #020617 80%); }
    .bg-depth-light { background: radial-gradient(circle at 50% -20%, #f1f5f9 0%, #cbd5e1 100%); }
    
    /* 1. แผงควบคุม 3 มิติ (3D Glass Plate) - มีสันขอบชัดเจน มิติเงาลอยตัว */
    .plate-3d-dark {
      background: linear-gradient(145deg, rgba(30,41,59,0.88), rgba(2,6,23,0.97));
      backdrop-filter: blur(4px);
      border-top: 1px solid rgba(255,255,255,0.15);
      border-left: 1px solid rgba(255,255,255,0.1);
      border-bottom: 2px solid rgba(0,0,0,0.8);
      border-right: 2px solid rgba(0,0,0,0.8);
      /* แก้บรรทัดนี้: ลดตัวเลข 20px 25px 40px ลง เพื่อให้เงาบางลง */
      box-shadow: 10px 10px 20px rgba(0,0,0,0.4), inset 1px 1px 2px rgba(255,255,255,0.1);
    }
    .plate-3d-light {
      background: linear-gradient(145deg, rgba(255,255,255,0.94), rgba(241,245,249,0.97));
      backdrop-filter: blur(4px);
      border-top: 2px solid #ffffff;
      border-left: 2px solid #ffffff;
      border-bottom: 2px solid #cbd5e1;
      border-right: 2px solid #cbd5e1;
      box-shadow: 15px 20px 35px rgba(0,0,0,0.1), inset 2px 2px 5px #ffffff;
    }

    /* 2. ปุ่มกด 3 มิติ (Extruded Button) - นูนลอยและกดแล้วจม */
    .btn-3d {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      transform-style: preserve-3d;
      position: relative;
    }
    .btn-3d:active {
      transform: translateY(4px) scale(0.98);
    }
    
    /* สไตล์ปุ่มเมนู (Menu Button) */
    .btn-menu-dark {
      background: linear-gradient(145deg, #1e293b, #0f172a);
      border: 1px solid rgba(255,255,255,0.05);
      box-shadow: 5px 5px 10px #060913, -3px -3px 8px #182541;
    }
    .btn-menu-dark:hover {
      box-shadow: 5px 5px 10px #060913, -3px -3px 8px #182541, 0 0 20px rgba(34,211,238,0.3);
      border: 1px solid rgba(34,211,238,0.5);
    }
    .btn-menu-dark:active {
      box-shadow: inset 5px 5px 10px #060913, inset -3px -3px 8px #182541;
      border: 1px solid transparent;
    }
    
    .btn-menu-light {
      background: linear-gradient(145deg, #ffffff, #e2e8f0);
      border: 1px solid #ffffff;
      box-shadow: 5px 5px 10px #cbd5e1, -5px -5px 10px #ffffff;
    }
    .btn-menu-light:hover {
      box-shadow: 5px 5px 10px #cbd5e1, -5px -5px 10px #ffffff, 0 0 20px rgba(34,211,238,0.4);
      border: 1px solid rgba(34,211,238,0.6);
    }
    .btn-menu-light:active {
      box-shadow: inset 5px 5px 10px #cbd5e1, inset -5px -5px 10px #ffffff;
      border: 1px solid transparent;
    }

    /* สไตล์ปุ่มเมนูที่กำลังเลือกอยู่ (Active Menu) */
    .menu-active-dark {
      background: #0f172a;
      box-shadow: inset 4px 4px 8px #060913, inset -4px -4px 8px #182541, 0 0 15px rgba(217,70,239,0.3);
      border: 1px solid rgba(217,70,239,0.5);
      transform: translateY(2px);
    }
    .menu-active-light {
      background: #e2e8f0;
      box-shadow: inset 4px 4px 8px #cbd5e1, inset -4px -4px 8px #ffffff;
      border: 1px solid rgba(217,70,239,0.5);
      transform: translateY(2px);
    }

    /* 3. ช่องกรอกข้อมูล 3 มิติ (Inset Screen) */
    .input-3d-dark {
      background: #020617;
      box-shadow: inset 5px 5px 10px #01030b, inset -5px -5px 10px #030923;
      border: 1px solid rgba(0,0,0,0.8);
      transition: all 0.3s ease;
    }
    .input-3d-dark:hover {
      box-shadow: inset 5px 5px 10px #01030b, inset -5px -5px 10px #030923, 0 0 12px rgba(217,70,239,0.25);
      border: 1px solid rgba(217,70,239,0.4);
    }
    .input-3d-dark:focus {
      box-shadow: inset 5px 5px 10px #01030b, inset -5px -5px 10px #030923, 0 0 20px rgba(34,211,238,0.5);
      border: 1px solid rgba(34,211,238,0.6);
    }
    
    .input-3d-light {
      background: #f8fafc;
      box-shadow: inset 3px 3px 6px #cbd5e1, inset -3px -3px 6px #ffffff;
      border: 1px solid transparent;
      transition: all 0.3s ease;
    }
    .input-3d-light:hover {
      box-shadow: inset 3px 3px 6px #cbd5e1, inset -3px -3px 6px #ffffff, 0 0 12px rgba(34,211,238,0.3);
      border: 1px solid rgba(34,211,238,0.4);
    }
    .input-3d-light:focus {
      box-shadow: inset 3px 3px 6px #cbd5e1, inset -3px -3px 6px #ffffff, 0 0 15px rgba(34,211,238,0.5);
      border: 1px solid rgba(34,211,238,0.5);
    }

    /* 4. ปุ่ม Submit นีออน (Primary 3D Button) */
    .btn-primary-3d {
      background: linear-gradient(145deg, #d946ef, #a21caf);
      border-top: 1px solid rgba(255,255,255,0.4);
      border-left: 1px solid rgba(255,255,255,0.4);
      box-shadow: 6px 6px 15px rgba(0,0,0,0.5), -2px -2px 8px rgba(217,70,239,0.3), 0 0 15px rgba(217,70,239,0.4);
      color: white;
    }
    .btn-primary-3d:hover {
      box-shadow: 6px 6px 20px rgba(0,0,0,0.6), -2px -2px 10px rgba(217,70,239,0.5), 0 0 30px rgba(217,70,239,0.8);
      filter: brightness(1.15);
    }
    .btn-primary-3d:active {
      box-shadow: inset 5px 5px 15px #701a75, inset -5px -5px 15px #f0abfc;
      border: none;
    }

    /* สไตล์ช่องตาราง (Card Item) */
    .list-item-3d-dark {
      background: linear-gradient(145deg, #1e293b, #0f172a);
      box-shadow: 3px 3px 6px #060913, -3px -3px 6px #182541;
      border: 1px solid rgba(255,255,255,0.05);
      transition: all 0.3s ease;
    }
    .list-item-3d-dark:hover {
      box-shadow: 5px 5px 15px #060913, -5px -5px 15px #182541, 0 0 25px rgba(6, 182, 212, 0.25);
      border: 1px solid rgba(6, 182, 212, 0.5);
      transform: translateY(-2px);
    }
    .list-item-3d-dark:active { box-shadow: inset 2px 2px 4px #060913; transform: translateY(2px); }
    /* 🟢 เพิ่มส่วนนี้เข้าไปที่ท้ายสุดของ realistic3DUICSS เพื่อซ่อน Scrollbar */
    .custom-scrollbar::-webkit-scrollbar {
      display: none; /* สำหรับ Chrome, Safari, Edge */
    }
    .custom-scrollbar {
      -ms-overflow-style: none;  /* สำหรับ IE */
      scrollbar-width: none;  /* สำหรับ Firefox */
    }
  `;

  if (!currentUser) {
  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 relative flex items-center justify-center ${isDarkMode ? 'bg-depth-dark' : 'bg-depth-light'}`}>
      <style dangerouslySetInnerHTML={{ __html: realistic3DUICSS }} /> 
      
      {/* แก้ไขบรรทัดนี้: ปรับ p-10 เป็น p-6 เพื่อลดระยะห่างรอบกล่อง และใช้ h-fit เพื่อล็อคความสูงให้พอดีกับเนื้อหา */}
      <div className={`relative z-10 py-4 px-8 rounded-[30px] w-full max-w-md h-fit ${isDarkMode ? 'plate-3d-dark' : 'plate-3d-light'}`}>
        {loading ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-10">
             <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(34,211,238,0.3)]"></div>
             <p className="text-cyan-400 font-mono tracking-widest animate-pulse drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">กำลังเชื่อมต่อกับเซิฟเวอร์...</p>
          </div>
        ) : (
          <LoginView 
            usersList={usersList} 
            onLogin={(user) => {
              setCurrentUser(user);
              setShowMapOverlay(true);
              if (user.role === "user") { 
                setFormData(prev => ({ ...prev, affiliation: user.affiliation, vehicle_id: user.vehicle_id })); 
              }
              
              // 1. สร้าง Object สำหรับ Log ใหม่
              const currentTimestamp = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Bangkok' });
              const newLog = {
                username: user.username,
                affiliation: user.affiliation,
                role: user.role,
                timestamp: currentTimestamp
              };

              // 2. อัปเดต UI ทันที (Optimistic Update) โดยเอา Log ใหม่ต่อท้าย Array เดิม
              setLoginLogs(prev => [...prev, newLog]);

              // 3. ยิงข้อมูลไปบันทึกหลังบ้านแบบ Fire-and-Forget
              fetch(API_URL, { 
                method: "POST", 
                body: JSON.stringify({ 
                  action: "login", 
                  timestamp: currentTimestamp, 
                  data: { username: user.username, affiliation: user.affiliation, role: user.role } 
                }), 
                mode: "no-cors" 
              }).catch(err => console.error("Login log tracking failed", err));
            }} />
        )}
      </div>
    </div>
  );
}

  return (
    <div className={`flex flex-col md:flex-row w-full min-h-screen font-sans transition-colors duration-500 relative overflow-hidden ${isDarkMode ? 'bg-depth-dark text-gray-200' : 'bg-depth-light text-gray-800'}`}>
      <style dangerouslySetInnerHTML={{ __html: realistic3DUICSS }} /> 

      {/* แถบ Mobile (ด้านบน) */}
      <div className={`md:hidden w-full flex items-center justify-between p-4 z-20 shrink-0 ${isDarkMode ? 'plate-3d-dark border-b-0' : 'plate-3d-light border-b-0'}`}>
        <div className="text-xl font-black text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-fuchsia-500 tracking-widest">CCOC MOBILE</div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className={`p-2 rounded-xl btn-3d ${isDarkMode ? 'btn-menu-dark text-cyan-400' : 'btn-menu-light text-cyan-600'}`}>
          {isMobileMenuOpen ? <X size={24} /> : <List size={24} />}
        </button>
      </div>

      {/* แถบ Sidebar (แผงควบคุม 3D ด้านซ้าย) */}
      <div className={`${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex w-full md:w-72 flex-col z-20 shrink-0 transition-colors duration-500 md:m-4 md:rounded-3xl ${isDarkMode ? 'plate-3d-dark' : 'plate-3d-light'}`}>
        <div className="p-6 border-b border-white/5 flex flex-col items-center justify-center relative">
          <div className={`absolute top-4 right-4 text-[10px] font-bold px-2 py-1 rounded shadow-inner ${currentUser.role === 'admin' ? 'bg-red-900/30 text-red-500 border border-red-500/30' : 'bg-cyan-900/30 text-cyan-500 border border-cyan-500/30'}`}>
            {currentUser.role === 'admin' ? 'ADMIN' : 'USER'}
          </div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-fuchsia-500 tracking-widest drop-shadow-[0_2px_5px_rgba(0,0,0,0.8)] mt-2 anim-fade-in-down">CCOC</h1>
          <p className="text-xs text-cyan-500 font-mono tracking-widest mt-1 text-center anim-fade-in" style={{ animationDelay: '120ms' }}>ระบบบันทึกข้อมูลภารกิจรถปฏิบัติการเคลื่อนที่ CCOC Mobile</p>
        </div>
        
        <div className="flex flex-col p-4 gap-4 mt-2">
          {/* ปุ่มเมนูที่ปรับปรุงเป็น 3D */}
          <button onClick={() => { setActiveMenu(1); setShowMapOverlay(true); setIsMobileMenuOpen(false); }} style={{ animationDelay: '100ms' }} className={`flex items-center gap-3 p-4 rounded-xl font-bold btn-3d anim-fade-in-left ${activeMenu === 1 ? (isDarkMode ? 'menu-active-dark text-fuchsia-400' : 'menu-active-light text-fuchsia-600') : (isDarkMode ? 'btn-menu-dark text-gray-400' : 'btn-menu-light text-gray-600')}`}>
            <PenTool size={20} /> <span>1. บันทึกภารกิจรถโมบาย</span>
          </button>
          <button onClick={() => { setActiveMenu(2); setIsMobileMenuOpen(false); }} style={{ animationDelay: '180ms' }} className={`flex items-center gap-3 p-4 rounded-xl font-bold btn-3d anim-fade-in-left ${activeMenu === 2 ? (isDarkMode ? 'menu-active-dark text-cyan-400' : 'menu-active-light text-cyan-600') : (isDarkMode ? 'btn-menu-dark text-gray-400' : 'btn-menu-light text-gray-600')}`}>
            <List size={20} /> <span>2. รายการบันทึกภารกิจ</span>
          </button>
          <button onClick={() => { setActiveMenu(3); setIsMobileMenuOpen(false); }} style={{ animationDelay: '260ms' }} className={`flex items-center gap-3 p-4 rounded-xl font-bold btn-3d anim-fade-in-left ${activeMenu === 3 ? (isDarkMode ? 'menu-active-dark text-yellow-400' : 'menu-active-light text-purple-600') : (isDarkMode ? 'btn-menu-dark text-gray-400' : 'btn-menu-light text-gray-600')}`}>
            <LineChart size={20} /> <span>3. แดชบอร์ดวิเคราะห์สถิติ</span>
          </button>

          {/* เมนูที่ 4: ประวัติการเข้าใช้งาน (เฉพาะ Admin) */}
          {currentUser?.role === "admin" && (
            <button onClick={() => { setActiveMenu(4); setIsMobileMenuOpen(false); }} style={{ animationDelay: '340ms' }} className={`flex items-center gap-3 p-4 rounded-xl font-bold btn-3d anim-fade-in-left ${activeMenu === 4 ? (isDarkMode ? 'menu-active-dark text-green-400' : 'menu-active-light text-green-600') : (isDarkMode ? 'btn-menu-dark text-gray-400' : 'btn-menu-light text-gray-600')}`}>
              <History size={20} /> <span>4. ประวัติการเข้าใช้งาน</span>
            </button>
          )}

          {/* ปุ่มสลับธีม 3D */}
          <button onClick={() => setIsDarkMode(!isDarkMode)} className={`flex items-center gap-3 p-4 rounded-xl font-bold btn-3d mt-4 ${isDarkMode ? 'btn-menu-dark text-yellow-500' : 'btn-menu-light text-indigo-600'}`}>
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />} <span>{isDarkMode ? 'สลับเป็นธีมสว่าง' : 'สลับเป็นธีมมืด'}</span>
          </button>
        </div>
        
        <div className="mt-auto p-4 border-t border-white/5 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full btn-3d flex items-center justify-center ${isDarkMode ? 'btn-menu-dark text-cyan-400' : 'btn-menu-light text-cyan-600'}`}><UserCircle size={20}/></div>
            <div className="flex-1 overflow-hidden">
              <p className={`text-sm font-bold truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{currentUser.role === 'admin' ? 'Master Admin' : VEHICLE_NAMES[currentUser.username] || currentUser.username}</p>
              <p className={`text-[10px] font-mono truncate ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>{currentUser.affiliation}</p>
            </div>
          </div>
          <button onClick={() => { setCurrentUser(null); setActiveMenu(1); setIsMobileMenuOpen(false); }} className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold tracking-wider btn-3d ${isDarkMode ? 'btn-menu-dark text-red-400' : 'btn-menu-light text-red-500'}`}>
            <LogOut size={16} /> LOGOUT
          </button>
        </div>
      </div>

      {/* พื้นที่แสดงผลหลัก (Main Content) */}
      <div className="flex-1 w-full p-4 md:p-6 h-full md:h-screen overflow-y-auto relative z-10" onClick={() => { if(isMobileMenuOpen) setIsMobileMenuOpen(false); }}>
        
        {/* หน้า 1: ฟอร์มบันทึกข้อมูล (อัปเดต Layout เป็น 2 คอลัมน์) */}
        {activeMenu === 1 && (
          showMapOverlay ? (
            <div className="w-full max-w-8xl mx-auto anim-fade-in">
              <ThailandMap 
                currentUser={currentUser} 
                missions={data?.missions || []} 
                isDarkMode={isDarkMode}
                onSelectVehicle={(vehicleId) => {
                  setFormData(prev => ({
                    ...prev,
                    vehicle_id: vehicleId,
                    affiliation: VEHICLE_AFFILIATIONS[vehicleId] || prev.affiliation
                  }));
                  setShowMapOverlay(false);
                }}
              />
            </div>
          ) : (
            <div className="w-full max-w-8xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-7 h-[84vh] anim-fade-in">
              
              {/* ฝั่งซ้าย: ฟอร์มบันทึกข้อมูล (ขยายเป็น 3 คอลัมน์) */}
              <div className={`lg:col-span-3 p-6 md:p-8 rounded-3xl overflow-y-auto custom-scrollbar ${isDarkMode ? 'plate-3d-dark' : 'plate-3d-light'}`}>
                 <h2 className={`text-3xl font-bold mb-8 flex items-center justify-between pb-4 border-b border-white/10 ${isDarkMode ? 'text-fuchsia-400' : 'text-fuchsia-600'}`}>
                   <div className="flex items-center gap-3">
                     <div className={`p-3 rounded-xl btn-3d ${isDarkMode ? 'btn-menu-dark text-fuchsia-400' : 'btn-menu-light text-fuchsia-600'}`}><PenTool size={24} /></div> 
                     <span>บันทึกภารกิจใหม่ ({formData.vehicle_id.toUpperCase()})</span>
                   </div>
                   
                   <button 
                     type="button" 
                     onClick={() => setShowMapOverlay(true)} 
                     className={`text-sm font-bold px-4 py-2.5 rounded-xl btn-3d flex items-center gap-2 ${isDarkMode ? 'btn-menu-dark text-cyan-400' : 'btn-menu-light text-cyan-600'}`}
                   >
                     <MapPin size={16} /> กลับหน้าแผนที่
                   </button>
                 </h2>
             
             <form onSubmit={(e) => { e.preventDefault(); setShowConfirmModal(true); }} className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className={`text-sm font-mono font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>สังกัดของรถโมบาย (Affiliation)</label>
                <select required disabled={currentUser.role === "user"} name="affiliation" value={formData.affiliation} onChange={handleChange} className={`p-4 rounded-xl focus:outline-none disabled:opacity-50 transition-all cursor-pointer ${isDarkMode ? 'input-3d-dark text-white' : 'input-3d-light text-black'}`}>
                  <option value="" disabled>-- โปรดเลือกสังกัดท่าน --</option><option value="บช.ทท.">1. กองบัญชาการตำรวจท่องเที่ยว (บช.ทท.)</option><option value="บก.ทท.1">2. กองบังคับการตำรวจท่องเที่ยว 1</option><option value="บก.ทท.2">3. กองบังคับการตำรวจท่องเที่ยว 2</option><option value="บก.ทท.3">4. กองบังคับการตำรวจท่องเที่ยว 3</option>
                </select>
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <label className={`text-sm font-mono font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>ใส่รหัสรถโมบายในสังกัดท่าน</label>
                <select required disabled={currentUser.role === "user"} name="vehicle_id" value={formData.vehicle_id} onChange={handleChange} className={`p-4 rounded-xl focus:outline-none disabled:opacity-50 transition-all cursor-pointer ${isDarkMode ? 'input-3d-dark text-white' : 'input-3d-light text-black'}`}>
                  <option value="" disabled>-- เลือกรหัสรถ --</option><option value="stc01">1. stc01 บช.ทท.</option><option value="stc02">2. stc02 ภูเก็ต</option><option value="stc03">3. stc03 อยุธยา</option><option value="stc04">4. stc04 ชลบุรี</option><option value="stc05">5. stc05 โคราช</option><option value="stc06">6. stc06 เชียงใหม่</option><option value="stc07">7. stc07 พิษณุโลก</option><option value="stc08">8. stc08 หัวหิน</option><option value="stc09">9. stc09 สนามศุภชลาศัย</option><option value="stc10">10. stc10 หาดใหญ่</option><option value="UAV Mobile">11. UAV Mobile</option>
                </select>
              </div>

              <div className="flex flex-col gap-2 md:col-span-1">
                <label className={`text-sm font-mono font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>1. หน่วยที่ออกภารกิจ</label>
                <input required type="text" name="unit_name" value={formData.unit_name} onChange={handleChange} placeholder="เช่น ฝอ.6 บก.อก.บช.ทท." className={`p-4 rounded-xl focus:outline-none transition-all ${isDarkMode ? 'input-3d-dark text-white' : 'input-3d-light text-black'}`} />
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <label className={`text-sm font-mono font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>2. ชื่อภารกิจ</label>
                <input required type="text" name="mission_name" value={formData.mission_name} onChange={handleChange} placeholder="ระบุชื่อภารกิจ..." className={`p-4 rounded-xl focus:outline-none transition-all ${isDarkMode ? 'input-3d-dark text-white' : 'input-3d-light text-black'}`} />
              </div>

              <div className="flex flex-col gap-2 md:col-span-1">
                <label className={`text-sm font-mono font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>พิกัด/จังหวัด</label>
                <input required type="text" name="province" value={formData.province} onChange={handleChange} placeholder="เช่น สวนเบญ จ.กทม." className={`p-4 rounded-xl focus:outline-none transition-all ${isDarkMode ? 'input-3d-dark text-white' : 'input-3d-light text-black'}`} />
              </div>

              <div className="flex flex-col justify-end gap-2 md:col-span-1">
                <label className={`text-sm font-mono font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>3. วันที่เริ่มภารกิจ</label>
                <input required type="date" name="start_date" value={formData.start_date} onChange={handleChange} className={`p-4 rounded-xl focus:outline-none transition-all cursor-pointer ${isDarkMode ? 'input-3d-dark text-white' : 'input-3d-light text-black'}`} style={{colorScheme: isDarkMode ? "dark" : "light"}} />
              </div>

              <div className="flex flex-col justify-end gap-2 md:col-span-1">
                <label className={`text-sm font-mono font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>4. วันที่สิ้นสุดภารกิจ</label>
                <input required type="date" name="end_date" value={formData.end_date} onChange={handleChange} className={`p-4 rounded-xl focus:outline-none transition-all cursor-pointer ${isDarkMode ? 'input-3d-dark text-white' : 'input-3d-light text-black'}`} style={{colorScheme: isDarkMode ? "dark" : "light"}} />
              </div>

              <div className="flex flex-col justify-end gap-2 md:col-span-1">
                <label className={`text-sm font-mono font-bold ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>รวมระยะเวลา (วัน)</label>
                <input readOnly type="text" name="total_days" value={formData.total_days} placeholder="คำนวณอัตโนมัติ" className={`p-4 rounded-xl focus:outline-none cursor-not-allowed font-bold ${isDarkMode ? 'input-3d-dark text-cyan-400' : 'input-3d-light text-cyan-600'}`} />
              </div>

              <div className="flex flex-col justify-end gap-2 md:col-span-1">
                <label className={`text-sm font-mono font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>5. ระยะทาง (ไป-กลับ กม.)</label>
                <input type="number" name="distance_km" value={formData.distance_km} onChange={handleChange} placeholder="ระบุระยะทาง" className={`p-4 rounded-xl focus:outline-none transition-all ${isDarkMode ? 'input-3d-dark text-white' : 'input-3d-light text-black'}`} />
              </div>

              <div className="flex flex-col gap-2 md:col-span-1">
                <label className={`text-sm font-mono font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>6. จำนวนคน (ต่อวัน)</label>
                <input type="number" name="people_per_day" value={formData.people_per_day} onChange={handleChange} placeholder="จำนวนคนโดยประมาณ" className={`p-4 rounded-xl focus:outline-none transition-all ${isDarkMode ? 'input-3d-dark text-white' : 'input-3d-light text-black'}`} />
              </div>

              <div className="flex flex-col gap-2 md:col-span-1">
                <label className={`text-sm font-mono font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>รวมผู้ร่วมงานทั้งหมด</label>
                <input readOnly type="text" name="people_total" value={formData.people_total} placeholder="คำนวณอัตโนมัติ" className={`p-4 rounded-xl focus:outline-none cursor-not-allowed font-bold ${isDarkMode ? 'input-3d-dark text-green-400' : 'input-3d-light text-green-600'}`} />
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <label className={`text-sm font-mono font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>7. เหตุสำคัญ / รับแจ้ง</label>
                <input type="text" name="incident_report" value={formData.incident_report} onChange={handleChange} placeholder="เช่น เหตุการณ์ปกติ, รับแจ้งเด็กพลัดหลง..." className={`p-4 rounded-xl focus:outline-none transition-all ${isDarkMode ? 'input-3d-dark text-white' : 'input-3d-light text-black'}`} />
              </div>

              <div className="flex flex-col gap-2 md:col-span-4">
                <label className={`text-sm font-mono font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>8. หมายเหตุ</label>
                <textarea rows={3} name="remark" value={formData.remark} onChange={handleChange} placeholder="ระบุเพิ่มเติม (ถ้ามี)..." className={`p-4 rounded-xl focus:outline-none transition-all resize-y ${isDarkMode ? 'input-3d-dark text-white' : 'input-3d-light text-black'}`} />
              </div>

              <div className="md:col-span-4 mt-8 flex justify-center">
                <button disabled={isSubmitting} type="submit" className="btn-3d btn-primary-3d px-12 py-5 rounded-2xl font-bold text-lg tracking-wide w-full md:w-auto"> 
                  {isSubmitting ? "กำลังส่งเข้าฐานข้อมูล..." : "บันทึกเข้าฐานข้อมูล"} 
                </button>
              </div>
            </form>
          </div>
          {/* ฝั่งขวา: กรอบ Log (ใส่เอฟเฟกต์เลื่อนเข้าและเด้งขึ้น) */}
          <div className={`lg:col-span-1 flex flex-col p-6 rounded-3xl h-215 anim-fade-in-right ${isDarkMode ? 'plate-3d-dark' : 'plate-3d-light'}`}>
            <h3 className={`text-xl font-bold mb-6 flex items-center gap-2 ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
              <Shield size={20} /> ผู้เข้าใช้งานล่าสุด (log)
            </h3>
            
            {/* ส่วนเนื้อหาภายในที่เลื่อนได้ */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-3">
              {/* 🟢 3. เปลี่ยนจาก usersList เป็น loginLogs */}
              {loginLogs.slice().reverse().map((log: any, index: number) => {
                const displayName = VEHICLE_NAMES[log.username] || log.username;
                
                // แปลงรูปแบบเวลาให้สวยงาม เช่น "2 มิ.ย. 2026, 11:11"
                const formattedTime = log.timestamp 
                  ? new Date(log.timestamp).toLocaleString('th-TH', { 
                      day: '2-digit', month: 'short', year: 'numeric', 
                      hour: '2-digit', minute: '2-digit' 
                    }) 
                  : "ไม่ระบุเวลา";

                return (
                  <div 
                    key={index} 
                    style={{ animationDelay: `${index * 50}ms` }} 
                    className={`p-4 rounded-xl btn-3d anim-fade-in-up ${isDarkMode ? 'list-item-3d-dark' : 'btn-menu-light'}`}
                  >
                    <p className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{displayName}</p>
                    <p className={`text-[11px] font-mono mt-1 ${isDarkMode ? 'text-cyan-500' : 'text-cyan-700'}`}>{log.affiliation}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Calendar size={10} className={isDarkMode ? 'text-gray-600' : 'text-gray-400'} />
                      {/* แสดงเวลาที่จัดฟอร์แมตแล้ว */}
                      <p className={`text-[10px] ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{formattedTime}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          </div>
          )
         )}

        {/* หน้า 2: ตารางรายการ */}
        {activeMenu === 2 && (
          <div className={`w-full max-w-[96%] mx-auto h-[84vh] flex flex-col p-6 rounded-3xl anim-fade-in ${isDarkMode ? 'plate-3d-dark' : 'plate-3d-light'}`}>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 pb-6 border-b border-white/10 shrink-0 anim-fade-in-down">
              <h2 className={`text-3xl font-bold flex items-center gap-3 ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
                <div className={`p-3 rounded-xl btn-3d ${isDarkMode ? 'btn-menu-dark text-cyan-400' : 'btn-menu-light text-cyan-600'}`}><List size={24} /></div>
                รายการบันทึกข้อมูล
              </h2>
              
              <div className="flex flex-wrap items-center gap-3 mt-4 lg:mt-0">
                <button onClick={() => { setLoading(true); fetchData(); }} className={`flex items-center gap-2 text-sm font-bold px-4 py-3 rounded-xl btn-3d ${isDarkMode ? 'btn-menu-dark text-blue-400' : 'btn-menu-light text-blue-600'}`}>
                  <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> รีเฟรชข้อมูล
                </button>
                <button onClick={handleExportPDF} className={`flex items-center gap-2 text-sm font-bold px-4 py-3 rounded-xl btn-3d ${isDarkMode ? 'btn-menu-dark text-red-400' : 'btn-menu-light text-red-600'}`}>
                  <Printer size={16} /> ดึงไฟล์ PDF
                </button>

                <div 
                  onClick={(e) => e.stopPropagation()} 
                  className={`flex items-center gap-3 p-3 px-5 rounded-xl ml-2 transition-all cursor-pointer hover:brightness-110 ${isDarkMode ? 'input-3d-dark' : 'input-3d-light'}`}
                >
                  <Calendar className={isDarkMode ? "text-cyan-500" : "text-cyan-600"} size={18} />
                  <input type="date" value={logFilterStartDate} onChange={(e) => setLogFilterStartDate(e.target.value)} className="bg-transparent text-sm focus:outline-none cursor-pointer w-full h-full" style={{colorScheme: isDarkMode ? "dark" : "light"}} />
                  <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>-</span>
                  <input type="date" value={logFilterEndDate} onChange={(e) => setLogFilterEndDate(e.target.value)} className="bg-transparent text-sm focus:outline-none cursor-pointer w-full h-full" style={{colorScheme: isDarkMode ? "dark" : "light"}} />
                </div>

                <div 
                  onClick={(e) => e.stopPropagation()} 
                  className={`flex items-center gap-3 p-3 px-5 rounded-xl transition-all cursor-pointer hover:brightness-110 ${isDarkMode ? 'input-3d-dark' : 'input-3d-light'}`}
                >
                  <Filter className={isDarkMode ? "text-orange-500" : "text-orange-600"} size={18} />
                  <select value={logFilterAffiliation} onChange={(e) => setLogFilterAffiliation(e.target.value)} className={`bg-transparent text-sm font-bold focus:outline-none cursor-pointer w-full h-full ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                    <option value="ALL">ทุกสังกัด</option><option value="บช.ทท.">บช.ทท.</option><option value="บก.ทท.1">บก.ทท.1</option><option value="บก.ทท.2">บก.ทท.2</option><option value="บก.ทท.3">บก.ทท.3</option>
                  </select>
                </div>
              </div>
            </div>

            {loading ? ( <div className="flex justify-center items-center h-40"><p className="text-cyan-400 font-mono animate-pulse text-lg">&gt; กำลังดึงฐานข้อมูลอยู่จ้า!!</p></div> ) : (
              <div className={`rounded-2xl overflow-hidden flex flex-col flex-1 min-h-0 ${isDarkMode ? 'input-3d-dark' : 'input-3d-light'}`}>
                <div className="overflow-x-auto flex-1 flex flex-col min-h-0 w-full custom-scrollbar p-2">
                  <div className="min-w-200 flex flex-col flex-1 min-h-0">
                    
                    <div className={`grid grid-cols-12 gap-4 p-4 rounded-xl mb-2 text-sm tracking-wider shrink-0 font-bold ${isDarkMode ? 'btn-menu-dark text-cyan-400' : 'btn-menu-light text-cyan-700'}`}>
                      <div className="col-span-1 text-center">ลำดับ.</div><div className="col-span-4">MISSION NAME / ชื่อภารกิจ</div><div className="col-span-2 text-center">หน่วยงานที่ออกภารกิจ</div><div className="col-span-2">พิกัด / จังหวัด</div><div className="col-span-3 text-right">DATE RECORDED</div>
                    </div>
                    
                    <div className="overflow-y-auto flex-1 custom-scrollbar space-y-2 pr-2">
                      {filteredLogs.map((mission: any, index: number) => (
                        <div key={index} onClick={() => { setSelectedMission(mission); setIsEditing(false); }} style={{ animationDelay: `${Math.min(index, 15) * 30}ms` }} className={`grid grid-cols-12 gap-4 p-4 rounded-xl items-center cursor-pointer btn-3d anim-fade-in-up ${isDarkMode ? 'list-item-3d-dark' : 'btn-menu-light hover:brightness-95'}`}>
                          <div className={`col-span-1 text-center font-mono ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{(index + 1).toString().padStart(3, '0')}</div>
                          <div className={`col-span-4 font-bold truncate pr-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{mission.mission_name || "ไม่ระบุชื่อภารกิจ"}</div>
                          <div className="col-span-2 text-center"><span className={`text-xs font-mono px-3 py-1.5 rounded-lg shadow-inner ${getAffiliationColor(mission.affiliation, isDarkMode)}`}>{mission.affiliation || "-"}</span></div>
                          <div className={`col-span-2 truncate pr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{mission.province}</div>
                          <div className={`col-span-3 text-right font-mono text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>{mission.timestamp ? new Date(mission.timestamp).toLocaleString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-'}</div>
                        </div>
                      ))}
                      {filteredLogs.length === 0 && <div className="text-center py-10"><p className={isDarkMode ? 'text-gray-500 font-mono' : 'text-gray-400 font-mono'}>NO DATA FOUND</p></div>}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* หน้า 3: กราฟ (ดึง Component เดิมมาครอบกรอบ 3D) */}
        {activeMenu === 3 && ( 
          loading ? 
          <div className="flex justify-center items-center h-40"><p className="text-purple-400 font-mono animate-pulse text-lg">&gt; Loading Dashboard...</p></div> : 
          <div className={`p-9 md:p-4 rounded-[30px] anim-fade-in-up h-[94vh] flex flex-col overflow-hidden ${isDarkMode ? 'plate-3d-dark' : 'plate-3d-light'}`}>
            <DashboardView missions={allowedMissions} refreshData={fetchData} /> 
          </div> 
        )}

        {/* หน้า 4: ประวัติการเข้าใช้งาน (Admin เท่านั้น) */}
        {activeMenu === 4 && currentUser?.role === "admin" && (
          <div className={`w-full max-w-[96%] mx-auto h-[84vh] flex flex-col p-6 rounded-3xl anim-fade-in ${isDarkMode ? 'plate-3d-dark' : 'plate-3d-light'}`}>
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 pb-6 border-b border-white/10 shrink-0 anim-fade-in-down">
              <h2 className={`text-3xl font-bold flex items-center gap-3 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                <div className={`p-3 rounded-xl btn-3d ${isDarkMode ? 'btn-menu-dark text-green-400' : 'btn-menu-light text-green-600'}`}><History size={24} /></div>
                ประวัติการเข้าใช้งานระบบ
              </h2>
              <div className="flex items-center gap-3 mt-4 lg:mt-0">
                <span className={`text-sm font-mono px-4 py-2 rounded-xl ${isDarkMode ? 'input-3d-dark text-green-400' : 'input-3d-light text-green-600'}`}>
                  พบ {loginLogs.length} รายการ
                </span>
                <button onClick={() => { setLoading(true); fetchData(); }} className={`flex items-center gap-2 text-sm font-bold px-4 py-3 rounded-xl btn-3d ${isDarkMode ? 'btn-menu-dark text-blue-400' : 'btn-menu-light text-blue-600'}`}>
                  <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> รีเฟรช
                </button>
              </div>
            </div>

            {/* Debug Banner: แสดงเมื่อยังไม่มีข้อมูล */}
            {loginLogs.length === 0 && !loading && (
              <div className={`mb-4 p-4 rounded-xl border shrink-0 ${isDarkMode ? 'border-yellow-500/30 bg-yellow-900/10 text-yellow-400' : 'border-yellow-400/50 bg-yellow-50 text-yellow-700'}`}>
                <p className="font-bold text-sm">⚠️ ไม่พบข้อมูล Login Log</p>
                <p className="text-xs mt-1 font-mono">กรุณาเปิด Browser DevTools (F12) → Console เพื่อดูว่า API ส่ง key ชื่ออะไรกลับมา แล้วแจ้งให้ผู้พัฒนาทราบ</p>
              </div>
            )}

            {/* ตาราง Login Log */}
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <p className={`font-mono animate-pulse text-lg ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>&gt; กำลังดึงข้อมูล...</p>
              </div>
            ) : (
              <div className={`rounded-2xl overflow-hidden flex flex-col flex-1 min-h-0 ${isDarkMode ? 'input-3d-dark' : 'input-3d-light'}`}>
                <div className="overflow-x-auto flex-1 flex flex-col min-h-0 w-full custom-scrollbar p-2">
                  <div className="min-w-[600px] flex flex-col flex-1 min-h-0">
                    {/* Header ตาราง */}
                    <div className={`grid grid-cols-12 gap-4 p-4 rounded-xl mb-2 text-sm tracking-wider shrink-0 font-bold ${isDarkMode ? 'btn-menu-dark text-green-400' : 'btn-menu-light text-green-700'}`}>
                      <div className="col-span-1 text-center">#</div>
                      <div className="col-span-3">USERNAME / รหัสรถ</div>
                      <div className="col-span-3 text-center">สังกัด</div>
                      <div className="col-span-2 text-center">ROLE</div>
                      <div className="col-span-3 text-right">วันเวลาเข้าใช้งาน</div>
                    </div>
                    {/* รายการ */}
                    <div className="overflow-y-auto flex-1 custom-scrollbar space-y-2 pr-2">
                      {loginLogs.slice().reverse().map((log: any, index: number) => {
                        const displayName = VEHICLE_NAMES[log.username] || log.username;
                        const formattedTime = log.timestamp
                          ? new Date(log.timestamp).toLocaleString('th-TH', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
                          : "ไม่ระบุเวลา";
                        const isAdmin = log.role === "admin";
                        return (
                          <div key={index} style={{ animationDelay: `${Math.min(index, 20) * 25}ms` }} className={`grid grid-cols-12 gap-4 p-4 rounded-xl items-center anim-fade-in-up ${isDarkMode ? 'list-item-3d-dark' : 'btn-menu-light'}`}>
                            <div className={`col-span-1 text-center font-mono text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{(loginLogs.length - index).toString().padStart(3, '0')}</div>
                            <div className={`col-span-3 font-bold text-sm truncate ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                              <span className="font-mono">{displayName}</span>
                            </div>
                            <div className="col-span-3 text-center">
                              <span className={`text-xs font-mono px-3 py-1.5 rounded-lg shadow-inner ${getAffiliationColor(log.affiliation, isDarkMode)}`}>
                                {log.affiliation || "-"}
                              </span>
                            </div>
                            <div className="col-span-2 text-center">
                              <span className={`text-[11px] font-bold px-3 py-1 rounded-lg ${isAdmin ? (isDarkMode ? 'bg-red-900/30 text-red-400 border border-red-500/30' : 'bg-red-100 text-red-700 border border-red-300') : (isDarkMode ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-500/30' : 'bg-cyan-100 text-cyan-700 border border-cyan-300')}`}>
                                {isAdmin ? "ADMIN" : "USER"}
                              </span>
                            </div>
                            <div className={`col-span-3 text-right font-mono text-xs flex items-center justify-end gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              <Clock size={10} />
                              <span>{formattedTime}</span>
                            </div>
                          </div>
                        );
                      })}
                      {loginLogs.length === 0 && (
                        <div className="text-center py-16">
                          <History size={48} className={`mx-auto mb-4 opacity-20 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                          <p className={`font-mono ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>NO LOGIN HISTORY FOUND</p>
                          <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>กรุณาตรวจสอบ Google Apps Script ว่า return key ชื่อ "login_logs" หรือไม่</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Popup กดยืนยัน (Confirm Modal) หรือดูรายละเอียด (Details Modal) */}
      {(selectedMission || showConfirmModal) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[4px] z-50 flex items-center justify-center p-4">
          
          {isDeleting && (
            <div className="absolute inset-0 z-100 bg-black/80 backdrop-blur-[4px] flex flex-col items-center justify-center">
              <div className="w-20 h-20 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin shadow-[0_0_30px_rgba(239,68,68,0.6)] mb-6"></div>
              <h2 className="text-3xl font-black text-red-500 tracking-[0.2em] drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] mb-2">DELETING</h2>
            </div>
          )}
          
          <div className={`w-full ${showConfirmModal ? 'max-w-lg' : 'max-w-4xl'} max-h-[90vh] overflow-y-auto rounded-3xl p-8 transform scale-100 anim-pop-in ${isDarkMode ? 'plate-3d-dark' : 'plate-3d-light'}`}>
            
            {showConfirmModal ? (
              // --- หน้าจอยืนยันการบันทึก ---
              <div className="text-center">
                <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 btn-3d ${isDarkMode ? 'btn-menu-dark text-fuchsia-400' : 'btn-menu-light text-fuchsia-600'}`}>
                  <Save size={32} />
                </div>
                <h3 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-fuchsia-400' : 'text-fuchsia-600'}`}>
                  ยืนยันการบันทึกข้อมูล?
                </h3>
                
                <div className={`p-6 rounded-2xl mb-8 flex flex-col gap-4 text-left ${isDarkMode ? 'input-3d-dark' : 'input-3d-light'}`}>
                  <div><span className="text-gray-500 text-sm">ชื่อภารกิจ:</span><br/><span className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-black'}`}>{formData.mission_name || "-"}</span></div>
                  <div><span className="text-gray-500 text-sm">พิกัด/จังหวัด:</span><br/><span className={`font-bold text-lg ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>{formData.province || "-"}</span></div>
                </div>

                <div className="flex justify-center gap-4 mt-2">
                  <button disabled={isSubmitting} type="button" onClick={() => setShowConfirmModal(false)} className={`px-8 py-4 rounded-xl font-bold btn-3d ${isDarkMode ? 'btn-menu-dark text-gray-400' : 'btn-menu-light text-gray-600'}`}>
                    กลับไปแก้ไข
                  </button>
                  <button disabled={isSubmitting} type="button" onClick={(e) => handleSubmit(e, "add")} className="btn-3d btn-primary-3d px-10 py-4 rounded-xl font-bold">
                    {isSubmitting ? "กำลังส่งค่า..." : "ยืนยันการบันทึก"}
                  </button>
                </div>
              </div>
            ) : (
              // --- หน้าจอรายละเอียด / แก้ไข ---
              <>
                <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                  <h3 className={`text-2xl font-bold flex items-center gap-3 ${isEditing ? (isDarkMode ? 'text-yellow-400' : 'text-yellow-600') : (isDarkMode ? 'text-cyan-400' : 'text-cyan-600')}`}>
                    <div className={`p-3 rounded-xl btn-3d ${isDarkMode ? 'btn-menu-dark' : 'btn-menu-light'}`}>
                      {isEditing ? <Edit3 size={24} /> : <List size={24} />}
                    </div>
                    {isEditing ? "EDIT MISSION DATA" : "MISSION DETAILS"}
                  </h3>
                  <div className="flex items-center gap-3">
                    {!isEditing && (currentUser.role === "admin" || String(selectedMission.vehicle_id) === String(currentUser.vehicle_id)) && ( 
                      <>
                        <button onClick={handleEditClick} className={`px-4 py-2 rounded-xl font-bold btn-3d flex items-center gap-2 ${isDarkMode ? 'btn-menu-dark text-yellow-400' : 'btn-menu-light text-yellow-600'}`}><Edit3 size={16}/> แก้ไข</button> 
                        <button onClick={handleDelete} className={`px-4 py-2 rounded-xl font-bold btn-3d flex items-center gap-2 ${isDarkMode ? 'btn-menu-dark text-red-400' : 'btn-menu-light text-red-600'}`}><Trash2 size={16}/> ลบ</button>
                      </>
                    )}
                    <button onClick={() => setSelectedMission(null)} className={`p-3 rounded-xl btn-3d flex items-center justify-center ${isDarkMode ? 'btn-menu-dark text-gray-400' : 'btn-menu-light text-gray-600'}`}><X size={20} /></button>
                  </div>
                </div>
                
                {/* เนื้อหาด้านใน Modal */}
                {!isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-6">
                        <div><p className={`text-xs font-bold tracking-widest mb-1 ${isDarkMode ? 'text-cyan-500' : 'text-cyan-700'}`}>ชื่อภารกิจ</p><p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{selectedMission.mission_name}</p></div>
                        <div className="flex items-center gap-4"><div className={`p-4 rounded-xl btn-3d ${isDarkMode ? 'btn-menu-dark text-cyan-400' : 'btn-menu-light text-cyan-600'}`}><MapPin /></div><div><p className="text-xs font-bold text-gray-500">พิกัด / จังหวัด</p><p className={`text-lg font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{selectedMission.province}</p></div></div>
                        <div className="flex items-center gap-4"><div className={`p-4 rounded-xl btn-3d ${isDarkMode ? 'btn-menu-dark text-fuchsia-400' : 'btn-menu-light text-fuchsia-600'}`}><Shield /></div><div><p className="text-xs font-bold text-gray-500">สังกัด / รหัสรถ</p><p className="mt-1 font-mono font-bold text-fuchsia-500">{selectedMission.affiliation} | {VEHICLE_NAMES[selectedMission.vehicle_id] || selectedMission.vehicle_id}</p></div></div>
                     </div>
                     <div className="space-y-6">
                        <div className={`p-6 rounded-2xl ${isDarkMode ? 'input-3d-dark' : 'input-3d-light'}`}>
                          <p className="text-xs font-bold text-gray-500 mb-2"><Calendar className="inline mr-2" size={14}/>ห้วงเวลาปฏิบัติการ</p>
                          <p className={`text-lg font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{selectedMission.start_date ? new Date(selectedMission.start_date).toLocaleDateString('th-TH') : '-'} ถึง {selectedMission.end_date ? new Date(selectedMission.end_date).toLocaleDateString('th-TH') : '-'}</p>
                          <p className={`text-sm mt-2 font-bold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>รวม: {selectedMission.total_days} วัน</p>
                        </div>
                        <div className={`p-6 rounded-2xl ${isDarkMode ? 'input-3d-dark' : 'input-3d-light'}`}>
                          <p className="text-xs font-bold text-gray-500 mb-2"><Users className="inline mr-2" size={14}/>จำนวนผู้เข้าร่วมงานโดยประมาณ</p>
                          <p className={`text-3xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{Number(selectedMission.people_total).toLocaleString()} <span className="text-sm font-normal text-gray-500">คน</span></p>
                        </div>
                     </div>
                     <div className={`md:col-span-2 grid grid-cols-2 gap-6 pt-6 border-t border-white/10`}>
                        <div className={`p-6 rounded-2xl ${isDarkMode ? 'input-3d-dark' : 'input-3d-light'}`}><p className="text-xs font-bold text-gray-500 mb-2">INCIDENT REPORT</p><p className={isDarkMode ? 'text-gray-300' : 'text-gray-800'}>{selectedMission.incident_report || "-"}</p></div>
                        <div className={`p-6 rounded-2xl ${isDarkMode ? 'input-3d-dark' : 'input-3d-light'}`}><p className="text-xs font-bold text-gray-500 mb-2">REMARK / DISTANCE</p><p className={isDarkMode ? 'text-gray-300' : 'text-gray-800'}>{selectedMission.remark || "-"}</p><p className={`mt-2 font-mono font-bold ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>Distance: {selectedMission.distance_km} km</p></div>
                     </div>
                  </div>
                ) : (
                  <form onSubmit={(e) => handleSubmit(e, "edit")} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* ... ฟอร์ม Edit ... */}
                    <div className="flex flex-col gap-2 md:col-span-2"><label className="text-sm font-bold text-yellow-500">ชื่อภารกิจ</label><input required type="text" name="mission_name" value={formData.mission_name} onChange={handleChange} className={`p-4 rounded-xl focus:outline-none ${isDarkMode ? 'input-3d-dark text-white focus:border-yellow-500' : 'input-3d-light text-black'}`} /></div>
                    <div className="flex flex-col gap-2"><label className="text-sm font-bold text-yellow-500">จังหวัด/พิกัด</label><input required type="text" name="province" value={formData.province} onChange={handleChange} className={`p-4 rounded-xl focus:outline-none ${isDarkMode ? 'input-3d-dark text-white focus:border-yellow-500' : 'input-3d-light text-black'}`} /></div>
                    <div className="flex flex-col gap-2"><label className="text-sm font-bold text-yellow-500">ระยะทาง (กม.)</label><input type="number" name="distance_km" value={formData.distance_km} onChange={handleChange} className={`p-4 rounded-xl focus:outline-none ${isDarkMode ? 'input-3d-dark text-white focus:border-yellow-500' : 'input-3d-light text-black'}`} /></div>
                    <div className="flex flex-col gap-2"><label className="text-sm font-bold text-yellow-500">วันที่เริ่ม</label><input required type="date" name="start_date" value={formData.start_date} onChange={handleChange} className={`p-4 rounded-xl focus:outline-none ${isDarkMode ? 'input-3d-dark text-white' : 'input-3d-light text-black'}`} style={{colorScheme: isDarkMode ? "dark" : "light"}}/></div>
                    <div className="flex flex-col gap-2"><label className="text-sm font-bold text-yellow-500">วันที่สิ้นสุด</label><input required type="date" name="end_date" value={formData.end_date} onChange={handleChange} className={`p-4 rounded-xl focus:outline-none ${isDarkMode ? 'input-3d-dark text-white' : 'input-3d-light text-black'}`} style={{colorScheme: isDarkMode ? "dark" : "light"}}/></div>
                    <div className="flex flex-col gap-2"><label className="text-sm font-bold text-yellow-500">จำนวนคน (ต่อวัน)</label><input type="number" name="people_per_day" value={formData.people_per_day} onChange={handleChange} className={`p-4 rounded-xl focus:outline-none ${isDarkMode ? 'input-3d-dark text-white focus:border-yellow-500' : 'input-3d-light text-black'}`} /></div>
                    <div className="flex flex-col gap-2"><label className="text-sm font-bold text-green-500">รวมผู้เข้าร่วมงานทั้งหมด</label><input readOnly type="text" name="people_total" value={formData.people_total} className={`p-4 rounded-xl font-bold focus:outline-none cursor-not-allowed ${isDarkMode ? 'input-3d-dark text-green-400' : 'input-3d-light text-green-600'}`} /></div>
                    <div className="flex flex-col gap-2 md:col-span-2"><label className="text-sm font-bold text-yellow-500">เหตุสำคัญ / รับแจ้ง</label><input type="text" name="incident_report" value={formData.incident_report} onChange={handleChange} className={`p-4 rounded-xl focus:outline-none ${isDarkMode ? 'input-3d-dark text-white focus:border-yellow-500' : 'input-3d-light text-black'}`} /></div>
                    <div className="flex flex-col gap-2 md:col-span-2"><label className="text-sm font-bold text-yellow-500">หมายเหตุ</label><input type="text" name="remark" value={formData.remark} onChange={handleChange} className={`p-4 rounded-xl focus:outline-none ${isDarkMode ? 'input-3d-dark text-white focus:border-yellow-500' : 'input-3d-light text-black'}`} /></div>
                    <div className={`md:col-span-2 mt-6 flex justify-end gap-4 pt-6 border-t border-white/10`}>
                      <button type="button" onClick={() => setIsEditing(false)} className={`px-8 py-4 rounded-xl font-bold btn-3d ${isDarkMode ? 'btn-menu-dark text-gray-400' : 'btn-menu-light text-gray-600'}`}>ยกเลิก</button>
                      <button disabled={isSubmitting} type="submit" className="btn-3d px-10 py-4 rounded-xl font-bold text-gray-900" style={{ background: 'linear-gradient(145deg, #facc15, #ca8a04)', boxShadow: '5px 5px 15px rgba(0,0,0,0.5), -2px -2px 8px rgba(250,204,21,0.5)' }}>
                        {isSubmitting ? "SAVING..." : "UPDATE DATA"}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}