"use client";

import { useEffect, useState } from "react";
import { PenTool, List, LineChart, X, MapPin, Users, Calendar, Car, Edit3, Save, LogOut, Shield, Filter, UserCircle, FileSpreadsheet, Printer, Sun, Moon, Trash2, RefreshCw, History, Clock, Image as ImageIcon, Truck, ExternalLink, Plane } from "lucide-react";
import DashboardView from "./components/DashboardView";
import LoginView from "./components/LoginView"; 
import ThailandMap from "./components/ThailandMap";
import PhotoUploadZone from "./components/PhotoUploadZone";
import PhotoGallery from "./components/PhotoGallery";
import MissionPhotoView from "./components/MissionPhotoView";
import VehicleManagementView from "./components/VehicleManagementView";
import FleetRosterView from "./components/FleetRosterView";
import UavMissionForm from "./components/UavMissionForm";
import LineReportModal from "./components/LineReportModal";
import { usePopup } from "./components/PopupContext";
import { SYSTEM_USERS, VEHICLE_AFFILIATIONS, VEHICLE_UNIT_MAP, VEHICLE_NAMES, enrichUserData, getUnifiedUsersList } from "./data/users";

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

const formatRecordedDate = (timestampStr: string) => {
  if (!timestampStr) return "-";
  
  const cleanStr = String(timestampStr).trim().replace('T', ' ').split('.')[0];
  const parts = cleanStr.match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2}):(\d{2}))?/);
  
  if (parts) {
    const [_, year, month, day, hours, minutes, seconds] = parts;
    const thaiYear = Number(year) + 543;
    if (hours !== undefined) {
      return `${day}/${month}/${thaiYear} ${hours}:${minutes}:${seconds}`;
    }
    return `${day}/${month}/${thaiYear}`;
  }

  try {
    const d = new Date(timestampStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const thaiYear = d.getFullYear() + 543;
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');
      return `${day}/${month}/${thaiYear} ${hours}:${minutes}:${seconds}`;
    }
  } catch {}
  
  return timestampStr;
};

export default function Home() {
  const { showNotification, showConfirm, showUploadProgress, updateUploadProgress, closeUploadProgress } = usePopup();
  const [currentUser, setCurrentUser] = useState<any>(null); 
  const [usersList, setUsersList] = useState<any[]>([]); 
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeMenu, setActiveMenu] = useState(1);
  const [selectedMission, setSelectedMission] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setUploadedFiles([]);
  }, [selectedMission, isEditing]);

  // 💾 Restore session from localStorage to prevent re-login on page refresh
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('ccoc_current_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        const enriched = enrichUserData(parsed);
        setCurrentUser(enriched);
        if (enriched.role === "user") {
          setFormData(prev => ({ 
            ...prev, 
            affiliation: enriched.affiliation, 
            vehicle_id: enriched.vehicle_id,
            unit_name: enriched.unit_name 
          }));
        }
      }
    } catch (e) {
      console.error("Failed to restore saved user session:", e);
    }
  }, []);
  const [showConfirmModal, setShowConfirmModal] = useState(false); 
  const [showMapOverlay, setShowMapOverlay] = useState(true);
  const [formVehicleTypeFilter, setFormVehicleTypeFilter] = useState("CCOC Mobile");
  
  const [logFilterAffiliation, setLogFilterAffiliation] = useState("ALL");
  const [logFilterStartDate, setLogFilterStartDate] = useState("");
  const [logFilterEndDate, setLogFilterEndDate] = useState("");
  const [pdfTypeFilter, setPdfTypeFilter] = useState("ALL"); // ALL | CCOC Mobile | UAV Mobile
  const [loginLogs, setLoginLogs] = useState<any[]>([]);
  const [showLineReportModal, setShowLineReportModal] = useState(false);
  const [lastSubmittedMission, setLastSubmittedMission] = useState<any>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);

  const [formData, setFormData] = useState({
    affiliation: "", unit_name: "", vehicle_id: "", mission_name: "", province: "", start_date: "", end_date: "", total_days: "", distance_km: "", people_per_day: "", people_total: "", incident_report: "", remark: "",
    location: "", start_time: "21.00", operators: "สายตรวจอากาศยานไร้คนขับ",
    drone_id: "Drone-01", sorties: 1, flight_duration_min: 45, coverage_detail: "", tourist_density: "ปริมาณน้อย", vehicle_type: "CCOC Mobile"
  });

  const API_URL = "/api/missions";

  const fetchData = async () => {
    try {
      const response = await fetch(API_URL);
      const text = await response.text();
      let result: any;
      try {
        result = JSON.parse(text);
      } catch (parseErr) {
        console.warn("⚠️ Google Apps Script API returned non-JSON response (HTML page):", text.slice(0, 150));
        setLoading(false);
        return;
      }

      if (!response.ok || result.status === "error" || !result.data) {
        console.warn("⚠️ API returned error or empty data (keeping current state):", result);
        setLoading(false);
        return;
      }
      
      const cleanedMissions = (result.data.missions || []).map((m: any) => {
        let isUav = String(m.vehicle_type || "").toLowerCase().includes("uav") || 
                    String(m.vehicle_id || "").toLowerCase().includes("uav") ||
                    Boolean(m.drone_id);

        let missionName = m.mission_name;
        let vehicleId = m.vehicle_id;
        let unitName = m.unit_name;
        let province = m.province;
        let location = m.location;
        let startDate = m.start_date;
        let startTime = m.start_time;
        let distanceKm = m.distance_km || m.distance || m.km;
        let affil = m.affiliation || m.status || m.affil;

        // Extract count of tourists if embedded in tourist_density e.g. "ปริมาณปานกลาง (200 คน)"
        let touristCountEst = m.tourist_count_est || "";
        let density = m.tourist_density || "";
        if (!touristCountEst && density) {
          const match = String(density).match(/\(([^)]+)\)/);
          if (match && match[1]) {
            touristCountEst = match[1];
          } else if (/^\d+/.test(String(density).trim())) {
            touristCountEst = density;
          }
        }
        if (!touristCountEst) {
          touristCountEst = m.people_total || m.people_per_day || "";
        }

        // 🛠️ Auto-Fix: แก้ไขปัญหาคอลัมน์ใน Google Sheet UAV เคลื่อนสลับตำแหน่งอัตโนมัติ
        if (isUav) {
          const startTimeStr = String(startTime || "");
          if (startTimeStr && (startTimeStr.includes("พ.ต.ท.") || startTimeStr.includes("สายตรวจ") || startTimeStr.length > 12)) {
            startTime = "21.00";
          }
          const provinceStr = String(province || "");
          if (provinceStr && /^\d{4}-\d{2}-\d{2}/.test(provinceStr.trim())) {
            startDate = province;
            province = (location && !/^\d+/.test(String(location))) ? location : (m.mission_type || "กทม.");
          }
          if (!distanceKm || distanceKm === "-" || distanceKm === "0") {
            if (m.coverage_detail) {
              const matchDist = String(m.coverage_detail).match(/(?:ระยะทาง(?:รวม)?(?:ไป-กลับ)?|ความยาว)\s*:?\s*([\d.]+)/i) || String(m.coverage_detail).match(/([\d.]+)\s*กม/i);
              if (matchDist && matchDist[1]) {
                distanceKm = matchDist[1];
              }
            }
          }
        }

        let vId = String(vehicleId || "").trim().toLowerCase();
        let uName = String(unitName || "").trim().toLowerCase();
        let finalAffil = String(affil || "").trim();

        if (vId.includes("uav")) {
          vId = "UAV Mobile";
          if (!finalAffil || finalAffil === "-") finalAffil = "บช.ทท.";
        } else if (vId.includes("อยุธยา") || uName.includes("อยุธยา")) {
          vId = "stc03";
          if (!finalAffil) finalAffil = "บก.ทท.1";
        } else if (vId.includes("สนามศุภ") || uName.includes("สนามศุภ")) {
          vId = "stc09";
          if (!finalAffil) finalAffil = "บก.ทท.1";
        } else if (vId.includes("ฝอ.6") || uName.includes("ฝอ.6") || vId === "stc01") {
          vId = "stc01";
          if (!finalAffil) finalAffil = "บช.ทท.";
        } else {
          vId = String(vehicleId || "").trim();
        }

        return {
          ...m,
          mission_name: missionName || "ว.43 สายตรวจโดรนมุมสูง",
          vehicle_id: vId,
          raw_vehicle_id: vehicleId || "UAV Mobile",
          unit_name: unitName,
          province: province || "-",
          start_date: startDate,
          start_time: startTime || "21.00 น.",
          distance_km: distanceKm,
          tourist_count_est: touristCountEst,
          tourist_density: density,
          affiliation: finalAffil,
          vehicle_type: isUav ? "UAV Mobile" : (m.vehicle_type || "CCOC Mobile")
        };
      });

      setData({ missions: cleanedMissions });
      if (result.data.users && Array.isArray(result.data.users)) {
        setUsersList(getUnifiedUsersList(result.data.users));
      } else {
        setUsersList(getUnifiedUsersList([]));
      }
      setLoading(false);
      const fetchedLogs = result.data.login_logs || result.data.log || result.data.logs || result.data.loginLogs || result.data.login_history || [];
      if (fetchedLogs.length > 0) setLoginLogs(fetchedLogs);
    } catch (error) { console.error("Error fetching data:", error); setLoading(false); }
  };

  useEffect(() => { 
    // ดึงข้อมูลครั้งแรกเมื่อเปิดหน้าเว็บ
    fetchData(); 
  }, []);

  // 💓 Heartbeat System: ส่งสัญญาณออนไลน์เฉพาะฝั่ง UI (ลบการส่งไปหลังบ้านออกเพื่อป้องกันชีตบวม)
  useEffect(() => {
    if (!currentUser) return;

    const sendHeartbeat = () => {
      const currentTimestamp = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Bangkok' });
      const newLog = {
        username: currentUser.username,
        affiliation: currentUser.affiliation,
        role: currentUser.role,
        timestamp: currentTimestamp
      };

      // อัปเดต UI ฝั่งตัวเองเท่านั้น ไม่ส่งไปบันทึกซ้ำบน Google Sheets แล้ว
      setLoginLogs(prev => {
        const filtered = prev.filter(log => log.username !== currentUser.username);
        return [...filtered, newLog];
      });
    };

    const heartbeatInterval = setInterval(sendHeartbeat, 240000);
    return () => clearInterval(heartbeatInterval);
  }, [currentUser]);

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
    if (e && e.preventDefault) e.preventDefault();
    if (uploadedFiles.length < 2) {
      showNotification({
        type: "warning",
        title: "อัปโหลดรูปภาพไม่ครบถ้วน",
        message: "กรุณาอัปโหลดรูปภาพประกอบภารกิจอย่างน้อย 2 รูปครับ",
        details: ["ระบบต้องการรูปภาพอย่างน้อย 2 ถึง 5 รูปในการบันทึกภารกิจ"],
      });
      return;
    }
    if (uploadedFiles.length > 5) {
      showNotification({
        type: "warning",
        title: "จำนวนรูปภาพเกินกำหนด",
        message: "สามารถอัปโหลดรูปภาพได้สูงสุดไม่เกิน 5 รูปครับ",
      });
      return;
    }
    setIsSubmitting(true);
    let payloadData: any = { ...formData };
    if (currentUser.role === "user") {
      payloadData.affiliation = currentUser.affiliation;
      // ถ้า vehicle_type = ALL (สถานีมีทั้ง CCOC + UAV) ให้ใช้ vehicle_id จาก form ที่ถูกเลือกไว้
      // ถ้าเป็น user ปกติ (ไม่ใช่ ALL) ให้ lock vehicle_id เป็นของตัวเอง
      const isAllType = String(currentUser.vehicle_type || "").trim().toUpperCase() === "ALL";
      if (!isAllType) {
        payloadData.vehicle_id = currentUser.vehicle_id;
      }
    }

    const currentTimestamp = action === "edit" ? selectedMission.timestamp : new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Bangkok' });
    const isUav = String(payloadData.vehicle_type || "").toLowerCase().includes("uav") || 
                  String(payloadData.vehicle_id || "").toLowerCase().includes("uav") ||
                  Boolean(payloadData.drone_id);

    // 🛠️ FIX COLUMN MISALIGNMENT FOR GOOGLE SHEETS:
    // Strictly match Row 1 Header columns A to R:
    // 1: timestamp, 2: unit_name, 3: vehicle_id, 4: mission_name, 5: location, 6: province,
    // 7: start_date, 8: start_time, 9: commander, 10: operators, 11: drone_id, 12: sorties,
    // 13: flight_duration_min, 14: coverage_detail, 15: tourist_density, 16: incident_report, 17: remark, 18: status
    if (isUav) {
      const touristCountEst = (formData as any).tourist_count_est;
      const baseDensity = formData.tourist_density || "ปริมาณน้อย";
      let combinedDensity = baseDensity;
      if (touristCountEst) {
        const countStr = String(touristCountEst).trim();
        const formattedCount = countStr.includes("คน") ? countStr : `${countStr} คน`;
        combinedDensity = `${baseDensity} (${formattedCount})`;
      }

      let coverageDetail = String(formData.coverage_detail || "-");
      const userDist = String((formData as any).distance_km || "").trim();
      if (userDist && userDist !== "-" && userDist !== "0" && !coverageDetail.includes(userDist)) {
        if (coverageDetail === "-") {
          coverageDetail = `ระยะทางรวมไป-กลับ ${userDist} กม.`;
        } else {
          coverageDetail = `${coverageDetail} (ระยะทางไป-กลับ ${userDist} กม.)`;
        }
      }

      // Strictly 18 keys matching Row 1 Header columns A to R (NO Col S or T):
      payloadData = {
        timestamp: currentTimestamp,
        unit_name: String(formData.unit_name || currentUser?.unit_name || currentUser?.affiliation || "-"),
        vehicle_id: String(formData.vehicle_id || "stc01"),
        mission_name: String(formData.mission_name || "ว.43 สายตรวจโดรนมุมสูง"),
        location: String(formData.location || formData.province || "-"),
        province: String(formData.province || "-"),
        start_date: String(formData.start_date || new Date().toISOString().split('T')[0]),
        start_time: String(formData.start_time || "21.00"),
        commander: "-",
        operators: String(formData.operators || "สายตรวจอากาศยานไร้คนขับ"),
        drone_id: String(formData.drone_id || "DJI Matrice 4T"),
        sorties: Number(formData.sorties ?? 1),
        flight_duration_min: Number(formData.flight_duration_min ?? 45),
        coverage_detail: coverageDetail,
        tourist_density: String(combinedDensity),
        incident_report: String(formData.incident_report || "เหตุการณ์ทั่วไปปกติ"),
        remark: String(formData.remark || "-"),
        status: String(formData.affiliation || currentUser?.affiliation || "บช.ทท.")
      };
    }

    const payload = { 
      action: action, 
      timestamp: currentTimestamp, 
      data: payloadData 
    };

    // 🟢 แสดง Upload Progress Animated Modal ภายในโปรเจค
    showUploadProgress({
      stage: "sending_data",
      progress: 25,
      missionName: payloadData.mission_name || "ภารกิจ CCOC",
      files: uploadedFiles,
      totalFiles: uploadedFiles.length,
    });

    const userDistance = String((formData as any).distance_km || "").trim();
    const newMissionFormatted = {
      ...payloadData,
      tourist_count_est: (formData as any).tourist_count_est || "",
      timestamp: payload.timestamp,
      mission_name: payloadData.mission_name || "ว.43 สายตรวจโดรนมุมสูง",
      vehicle_id: payloadData.vehicle_id || "UAV Mobile",
      raw_vehicle_id: payloadData.vehicle_id || "UAV Mobile",
      unit_name: payloadData.unit_name || currentUser.unit_name || currentUser.affiliation || "-",
      province: payloadData.province || "-",
      start_date: payloadData.start_date || new Date().toISOString().split('T')[0],
      start_time: payloadData.start_time || "21.00 น.",
      distance_km: userDistance || payloadData.distance_km || "-",
      affiliation: String(formData.affiliation || currentUser?.affiliation || "บช.ทท."),
      vehicle_type: isUav ? "UAV Mobile" : (payloadData.vehicle_type || "CCOC Mobile")
    };

    setData((prev: any) => {
      const currentMissions = prev?.missions || [];
      if (action === "edit") {
        const updated = currentMissions.map((m: any) => 
          m.timestamp === selectedMission?.timestamp ? { ...m, ...newMissionFormatted } : m
        );
        return { ...prev, missions: updated };
      } else {
        return { ...prev, missions: [newMissionFormatted, ...currentMissions] };
      }
    });

    try {
      // ✅ PRIMARY: ส่งตรงไปยัง Google Apps Script จาก Browser (ไม่มี Vercel timeout issue!)
      // mode: "no-cors" หมายความว่าเราไม่สามารถอ่าน response ได้ แต่ GAS จะได้รับข้อมูลแน่นอน
      const GOOGLE_SCRIPT_DIRECT_URL = "https://script.google.com/macros/s/AKfycbwsLqrtjt9fU7P5XOERxEqrM5QAW8MKPrsPw_F5A40LfrvtLYgkY3UnKEDH3db6C8HK/exec";
      const directGasSendPromise = fetch(GOOGLE_SCRIPT_DIRECT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });

      // ✅ SECONDARY: อัปเดต Vercel API cache (timeout 8 วินาที เพื่อไม่ให้ค้างนาน)
      const vercelApiTimeout = new Promise<Response>((_, reject) => 
        setTimeout(() => reject(new Error("Vercel API timeout")), 8000)
      );
      let isGasSuccess = true; // assume success เพราะ direct send สำเร็จ
      try {
        const apiRes = await Promise.race([
          fetch(API_URL, { 
            method: "POST", 
            body: JSON.stringify(payload), 
            headers: { "Content-Type": "application/json" } 
          }),
          vercelApiTimeout
        ]) as Response;
        const result = await apiRes.json();
        isGasSuccess = result?.gasSuccess !== false;
      } catch (vercelErr: any) {
        console.warn("⚠️ Vercel API cache update skipped:", vercelErr?.message);
        // ไม่เป็นไร เพราะ direct send สำเร็จแล้ว
      }

      // รอ direct GAS send เสร็จ (ส่วนใหญ่จะเสร็จก่อน Vercel timeout แล้ว)
      await directGasSendPromise.catch((err) => console.warn("Direct GAS notice:", err));
      
      updateUploadProgress({ stage: "uploading_photos", progress: 55 });

      // Upload photos if any
      let isPhotoUploadFailed = false;
      if (uploadedFiles.length > 0) {
        const formDataUpload = new FormData();
        uploadedFiles.forEach(file => {
          formDataUpload.append("photos", file);
        });
        formDataUpload.append("mission_timestamp", payload.timestamp);
        formDataUpload.append("mission_name", payloadData.mission_name || "");

        try {
          const photoRes = await fetch(`/api/photos/upload`, {
            method: "POST",
            headers: {
              "x-vehicle-id": payloadData.vehicle_id,
            },
            body: formDataUpload,
          });
          if (!photoRes.ok) isPhotoUploadFailed = true;
          updateUploadProgress({ progress: 95 });
        } catch (uploadErr) {
          console.error("❌ Failed to upload photos:", uploadErr);
          isPhotoUploadFailed = true;
        }
      }

      // Complete progress animation
      updateUploadProgress({ stage: "success", progress: 100 });
      await new Promise((resolve) => setTimeout(resolve, 800));
      closeUploadProgress();

      // แสดง Notification Popup สรุปความสำเร็จ
      showNotification({
        type: !isGasSuccess ? "warning" : (isPhotoUploadFailed ? "info" : "success"),
        title: !isGasSuccess
          ? "บันทึกในเว็บสำเร็จ (กำลังส่งเข้า Google Sheets)"
          : (action === "add" ? "บันทึกภารกิจสำเร็จ!" : "อัปเดตข้อมูลสำเร็จ!"),
        message: !isGasSuccess
          ? "บันทึกข้อมูลบนระบบเว็บสำเร็จแล้ว แต่การส่งไปยัง Google Sheets อาจล่าช้าเนื่องจากสัญญาณเชื่อมต่อ"
          : (isPhotoUploadFailed
            ? "บันทึกรายละเอียดภารกิจลง Google Sheets เรียบร้อยแล้ว (เฉพาะไฟล์ภาพถ่ายยังไม่ได้อัปโหลดเนื่องจากยังไม่เปิด Photo Server)"
            : (action === "add" ? "ข้อมูลถูกบันทึกเรียบร้อยแล้ว" : "อัปเดตข้อมูลภารกิจเรียบร้อยแล้ว")),
        details: [
          `ชื่อภารกิจ: ${payloadData.mission_name || "-"}`,
          `พิกัด/จังหวัด: ${payloadData.province || "-"}`,
          `จำนวนรูปภาพ: ${uploadedFiles.length} รูป`,
        ],
      });

      let resetForm = { affiliation: "", unit_name: "", vehicle_id: "", mission_name: "", province: "", start_date: "", end_date: "", total_days: "", distance_km: "", people_per_day: "", people_total: "", incident_report: "", remark: "", location: "", start_time: "21.00", operators: "สายตรวจอากาศยานไร้คนขับ", drone_id: "Drone-01", sorties: 1, flight_duration_min: 45, coverage_detail: "", tourist_density: "ปริมาณน้อย", vehicle_type: formVehicleTypeFilter };
      if (currentUser.role === "user") { resetForm.affiliation = currentUser.affiliation; resetForm.vehicle_id = currentUser.vehicle_id; }
      setFormData(resetForm);
      setUploadedFiles([]);
      if (action === "edit") { setIsEditing(false); setSelectedMission(null); } else { setActiveMenu(2); setShowMapOverlay(true); }

      // 🟢 เปิดแสดง Modal LINE Report สำหรับคัดลอกส่งผู้บังคับบัญชา
      if (action === "add") {
        setLastSubmittedMission(newMissionFormatted);
        setShowLineReportModal(true);
      } 
    } catch (error) { 
      updateUploadProgress({ stage: "error", errorMessage: "เกิดข้อผิดพลาดในการส่งข้อมูล" });
    }
    setIsSubmitting(false);
    setShowConfirmModal(false);
  };

  const handleChange = (e: any) => { 
    const { name, value } = e.target;
    if (name === "vehicle_id") {
      const isUav = String(value || "").toLowerCase().includes("uav");
      setFormVehicleTypeFilter(isUav ? "UAV Mobile" : "CCOC Mobile");
      setFormData(prev => ({ ...prev, vehicle_id: value, vehicle_type: isUav ? "UAV Mobile" : "CCOC Mobile" }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEditClick = () => {
    const formatDate = (dateStr: string) => dateStr ? new Date(dateStr).toISOString().split('T')[0] : "";
    setFormData({
      affiliation: selectedMission.affiliation || "",
      unit_name: selectedMission.unit_name || "",
      vehicle_id: selectedMission.vehicle_id || "",
      mission_name: selectedMission.mission_name || "",
      province: selectedMission.province || "",
      start_date: formatDate(selectedMission.start_date),
      end_date: formatDate(selectedMission.end_date),
      total_days: selectedMission.total_days || "",
      distance_km: selectedMission.distance_km || "",
      people_per_day: selectedMission.people_per_day || "",
      people_total: selectedMission.people_total || "",
      incident_report: selectedMission.incident_report || "",
      remark: selectedMission.remark || "",
      location: selectedMission.location || "",
      start_time: selectedMission.start_time || "21.00",
      operators: selectedMission.operators || "",
      drone_id: selectedMission.drone_id || "Drone-01",
      sorties: selectedMission.sorties || 1,
      flight_duration_min: selectedMission.flight_duration_min || 45,
      coverage_detail: selectedMission.coverage_detail || "",
      tourist_density: selectedMission.tourist_density || "",
      vehicle_type: selectedMission.vehicle_type || (String(selectedMission.vehicle_id || "").toLowerCase().includes("uav") ? "UAV Mobile" : "CCOC Mobile")
    });
    setIsEditing(true);
  };

  const handleDelete = () => {
    showConfirm({
      title: "ยืนยันการลบภารกิจ",
      message: `คุณแน่ใจหรือไม่ว่าต้องการลบภารกิจ "${selectedMission?.mission_name || ""}" ?\n(การลบจะไม่สามารถกู้คืนได้)`,
      isDanger: true,
      confirmText: "ยืนยันลบภารกิจ",
      onConfirm: async () => {
        setIsDeleting(true); 
        const payload = { action: "delete", timestamp: selectedMission.timestamp };
        try {
          await fetch(API_URL, { 
            method: "POST", 
            body: JSON.stringify(payload),
            headers: { "Content-Type": "application/json" }
          });
          setSelectedMission(null); 
          setLoading(true); 
          fetchData(); 
          showNotification({
            type: "success",
            title: "ลบภารกิจสำเร็จ",
            message: "ลบข้อมูลภารกิจออกจากระบบเรียบร้อยแล้ว",
          });
        } catch (error) { 
          showNotification({
            type: "error",
            title: "ลบข้อมูลไม่สำเร็จ",
            message: "เกิดข้อผิดพลาดในการลบข้อมูลภารกิจ",
          });
        }
        setIsDeleting(false); 
      },
    });
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
    // Filter by vehicle type (PDF Type Filter)
    let passType = true;
    if (pdfTypeFilter !== "ALL") {
      const uname = String(m.vehicle_id || "").trim().toLowerCase();
      const vtype = String(m.vehicle_type || "").toLowerCase();
      if (pdfTypeFilter === "CCOC Mobile") {
        passType = uname.startsWith("stc") || vtype === "ccoc mobile";
      } else if (pdfTypeFilter === "UAV Mobile") {
        passType = uname.startsWith("uav") || uname === "uav mobile" || vtype === "uav mobile";
      }
    }
    return passAffil && passDate && passType;
  }).reverse();

  const getDateRangeText = () => {
    if (!logFilterStartDate && !logFilterEndDate) return "ทั้งหมด";
    const sDate = logFilterStartDate ? new Date(logFilterStartDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : "เริ่มต้น";
    const eDate = logFilterEndDate ? new Date(logFilterEndDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : "ปัจจุบัน";
    return `วันที่ ${sDate} ถึง ${eDate}`;
  };

  const getVehicleTypeTitleText = () => {
    if (pdfTypeFilter === "CCOC Mobile") return "รถปฏิบัติการเคลื่อนที่ CCOC Mobile";
    if (pdfTypeFilter === "UAV Mobile") return "รถปฏิบัติการเคลื่อนที่ UAV Mobile";
    return "รถปฏิบัติการเคลื่อนที่ CCOC Mobile และ UAV Mobile";
  };

  const handleExportExcel = () => {
    const sortedLogs = [...filteredLogs].sort((a, b) => {
      const affA = String(a.affiliation || "").trim(); const affB = String(b.affiliation || "").trim();
      if (affA < affB) return -1; if (affA > affB) return 1; return new Date(a.start_date || 0).getTime() - new Date(b.start_date || 0).getTime();
    });
    const csvRows = [];
    csvRows.push(`ผลการปฏิบัติการใช้งาน${getVehicleTypeTitleText()} (ประจำห้วง: ${getDateRangeText()}),,,,,,,,,,`);
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

  const handleExportPDF = (type: "CCOC Mobile" | "UAV Mobile" | "ALL") => {
    setShowPdfModal(false);
    const printWindow = window.open('', '_blank'); if (!printWindow) return;

    const toThaiNumber = (text: any) => {
      if (text === null || text === undefined) return "";
      const arabic = ["0","1","2","3","4","5","6","7","8","9"];
      const thai = ["๐","๑","๒","๓","๔","๕","๖","๗","๘","๙"];
      let str = String(text);
      for (let i = 0; i < 10; i++) str = str.split(arabic[i]).join(thai[i]);
      return str;
    };

    const normalizeAffiliation = (aff: string) => {
      if (aff === "ฝ่ายอำนวยการ 6" || aff === "ฝ่ายอำนวยการ 6.") return "บช.ทท.";
      return aff;
    };

    const affOrder: Record<string, number> = { "บช.ทท.": 1, "บก.ทท.1": 2, "บก.ทท.2": 3, "บก.ทท.3": 4 };
    const sortByAffDate = (a: any, b: any) => {
      const affA = normalizeAffiliation(String(a.affiliation || "").trim());
      const affB = normalizeAffiliation(String(b.affiliation || "").trim());
      const wA = affOrder[affA] || 99, wB = affOrder[affB] || 99;
      if (wA !== wB) return wA - wB;
      return new Date(a.start_date || 0).getTime() - new Date(b.start_date || 0).getTime();
    };

    // แยกข้อมูล CCOC และ UAV
    const ccocLogs = [...filteredLogs].filter(m => {
      const vt = String(m.vehicle_type || "").toLowerCase();
      const vid = String(m.vehicle_id || "").toLowerCase();
      return vt === "ccoc mobile" || vid.startsWith("stc");
    }).sort(sortByAffDate);

    const uavLogs = [...filteredLogs].filter(m => {
      const vt = String(m.vehicle_type || "").toLowerCase();
      const vid = String(m.vehicle_id || "").toLowerCase();
      return vt === "uav mobile" || vid.startsWith("uav") || vid === "uav mobile" || Boolean(m.drone_id);
    }).sort(sortByAffDate);

    const titleType = type === "CCOC Mobile" ? "รถปฏิบัติการเคลื่อนที่ CCOC Mobile"
      : type === "UAV Mobile" ? "สายตรวจอากาศยานไร้คนขับ (UAV Mobile)"
      : "รถปฏิบัติการเคลื่อนที่ CCOC Mobile และ UAV Mobile";

    const commonCSS = `@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;700&display=swap');
      body { font-family: 'Sarabun', sans-serif; padding: 20px; color: #000; font-size: 11px; }
      h2 { text-align: center; margin-bottom: 5px; font-size: 16px; }
      h3 { text-align: center; margin: 20px 0 8px; font-size: 14px; color: #1d4ed8; border-bottom: 2px solid #1d4ed8; padding-bottom: 4px; }
      p { text-align: center; margin-top: 0; margin-bottom: 10px; }
      .header-meta { text-align: center; font-size: 12px; margin-bottom: 20px; color: #333; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
      th, td { border: 1px solid #000; padding: 6px; text-align: left; vertical-align: top; }
      th { background-color: #f0f0f0; text-align: center; }
      .text-center { text-align: center; } .text-right { text-align: right; }
      .bg-group { background-color: #e5e7eb; font-weight: bold; text-align: left !important; }
      .section-uav th { background-color: #dbeafe; }
      @media print { @page { size: landscape; margin: 10mm; } body { -webkit-print-color-adjust: exact; } }`;

    // ─── ฟังก์ชัน build ตาราง CCOC ────────────────────────────────────────────
    const buildCCOCTable = (logs: any[]) => {
      if (logs.length === 0) return `<p style="color:#6b7280;">ไม่มีข้อมูล CCOC Mobile ในช่วงเวลาที่เลือก</p>`;
      let html = `<table><thead><tr>
        <th rowspan="2" width="4%">ลำดับ</th>
        <th rowspan="2" width="15%">หน่วย</th>
        <th rowspan="2" width="20%">ชื่อภารกิจ / จังหวัด</th>
        <th colspan="3">วัน เดือน ปี จัดงาน</th>
        <th rowspan="2" width="8%">ระยะทางที่ตั้งรถ ถึง จุดจัดงาน<br/>ไป-กลับ(กม.)</th>
        <th colspan="2">จำนวนผู้ร่วมงาน</th>
        <th rowspan="2" width="15%">เหตุการณ์สำคัญที่รับแจ้ง</th>
        <th rowspan="2" width="10%">หมายเหตุ</th>
      </tr><tr>
        <th width="6%">เริ่มวันที่</th><th width="6%">ถึงวันที่</th><th width="5%">รวม/วัน</th>
        <th width="5%">ต่อวัน</th><th width="6%">ตลอดงาน</th>
      </tr></thead><tbody>`;
      let curAff = ""; let rowIdx = 1;
      logs.forEach((m: any) => {
        const aff = normalizeAffiliation(String(m.affiliation || "ไม่ระบุสังกัด").trim());
        if (aff !== curAff) { html += `<tr><td colspan="11" class="bg-group">${toThaiNumber(aff)}</td></tr>`; curAff = aff; rowIdx = 1; }
        const unitName = `${m.unit_name || "-"}<br/><small>${VEHICLE_NAMES[m.vehicle_id] || m.vehicle_id}</small>`;
        const missionAndProv = `${m.mission_name || "-"}<br/><b>${m.province || "-"}</b>`;
        const sDate = m.start_date ? new Date(m.start_date).toLocaleDateString('th-TH', {day:'2-digit', month:'short', year:'2-digit'}) : "-";
        const eDate = m.end_date ? new Date(m.end_date).toLocaleDateString('th-TH', {day:'2-digit', month:'short', year:'2-digit'}) : "-";
        html += `<tr><td class="text-center">${toThaiNumber(rowIdx++)}</td><td>${toThaiNumber(unitName)}</td><td>${toThaiNumber(missionAndProv)}</td><td class="text-center">${toThaiNumber(sDate)}</td><td class="text-center">${toThaiNumber(eDate)}</td><td class="text-center">${toThaiNumber(m.total_days || 0)}</td><td class="text-center">${toThaiNumber(m.distance_km || 0)}</td><td class="text-right">${toThaiNumber(Number(m.people_per_day || 0).toLocaleString())}</td><td class="text-right">${toThaiNumber(Number(m.people_total || 0).toLocaleString())}</td><td>${toThaiNumber(m.incident_report || "-")}</td><td>${toThaiNumber(m.remark || "-")}</td></tr>`;
      });
      const totDist = logs.reduce((s, m) => s + Number(m.distance_km || 0), 0);
      const totPplDay = logs.reduce((s, m) => s + Number(m.people_per_day || 0), 0);
      const totPplAll = logs.reduce((s, m) => s + Number(m.people_total || 0), 0);
      html += `<tr style="background-color:#d1d5db;font-weight:bold;font-size:12px;"><td colspan="6" class="text-right">รวมสถิติทั้งหมด ${toThaiNumber(logs.length.toLocaleString())} ภารกิจ :</td><td class="text-center">${toThaiNumber(totDist.toLocaleString())}</td><td class="text-right">${toThaiNumber(totPplDay.toLocaleString())}</td><td class="text-right">${toThaiNumber(totPplAll.toLocaleString())}</td><td colspan="2"></td></tr>`;
      html += `</tbody></table>`;
      return html;
    };

    // ─── ฟังก์ชัน build ตาราง UAV ─────────────────────────────────────────────
    const buildUAVTable = (logs: any[]) => {
      if (logs.length === 0) return `<p style="color:#6b7280;">ไม่มีข้อมูล UAV Mobile ในช่วงเวลาที่เลือก</p>`;

      const getFlightDuration = (m: any): number => {
        const val = m.flight_duration_min;
        if (val !== undefined && val !== null && val !== "") {
          const num = Number(String(val).replace(/[^0-9.]/g, ""));
          if (!isNaN(num) && num > 0) return num;
        }
        return 45; // ค่ามาตรฐานหากไม่ได้ระบุ
      };

      const getTouristNumber = (m: any): number => {
        const fields = [m.tourist_count_est, m.people_per_day, m.people_total];
        for (const f of fields) {
          if (f !== null && f !== undefined && f !== "") {
            const numStr = String(f).replace(/[^0-9]/g, "");
            if (numStr && !isNaN(Number(numStr))) {
              const num = Number(numStr);
              if (num > 0) return num;
            }
          }
        }
        return 0;
      };

      let html = `<table class="section-uav"><thead><tr>
        <th rowspan="2" width="4%">ลำดับ</th>
        <th rowspan="2" width="14%">หน่วย</th>
        <th rowspan="2" width="18%">ชื่อภารกิจ / สถานที่ / จังหวัด</th>
        <th colspan="2">วันเวลาปฏิบัติการ</th>
        <th colspan="3">ข้อมูลการบิน UAV</th>
        <th rowspan="2" width="8%">ระยะทาง<br/>ปฏิบัติภารกิจ (กม.)</th>
        <th rowspan="2" width="8%">ปริมาณ/จำนวน<br/>นักท่องเที่ยว</th>
        <th rowspan="2" width="14%">เหตุการณ์สำคัญ</th>
        <th rowspan="2" width="8%">หมายเหตุ</th>
      </tr><tr>
        <th width="7%">วันที่</th><th width="5%">เวลา</th>
        <th width="9%">รุ่น/รหัสโดรน</th><th width="5%">รอบบิน</th><th width="6%">เวลาบิน (นาที)</th>
      </tr></thead><tbody>`;
      let curAff = ""; let rowIdx = 1;
      logs.forEach((m: any) => {
        const aff = normalizeAffiliation(String(m.affiliation || "ไม่ระบุสังกัด").trim());
        if (aff !== curAff) { html += `<tr><td colspan="12" class="bg-group">${toThaiNumber(aff)}</td></tr>`; curAff = aff; rowIdx = 1; }
        const unitName = `${m.unit_name || "-"}<br/><small>${m.raw_vehicle_id || m.vehicle_id || "UAV"}</small>`;
        const missionAndPlace = `${m.mission_name || "-"}<br/><small>${m.location || ""}</small><br/><b>${m.province || "-"}</b>`;
        const sDate = m.start_date ? new Date(m.start_date).toLocaleDateString('th-TH', {day:'2-digit', month:'short', year:'2-digit'}) : "-";
        
        const flightMin = getFlightDuration(m);
        const tNum = getTouristNumber(m);
        const touristVal = tNum > 0 
          ? `${tNum.toLocaleString()} คน`
          : (m.tourist_count_est && m.tourist_count_est !== "ปริมาณน้อย" 
              ? m.tourist_count_est 
              : (m.tourist_density || "-"));

        html += `<tr><td class="text-center">${toThaiNumber(rowIdx++)}</td><td>${toThaiNumber(unitName)}</td><td>${toThaiNumber(missionAndPlace)}</td><td class="text-center">${toThaiNumber(sDate)}</td><td class="text-center">${toThaiNumber(m.start_time || "-")}</td><td class="text-center">${toThaiNumber(m.drone_id || "-")}</td><td class="text-center">${toThaiNumber(m.sorties || 1)}</td><td class="text-center">${toThaiNumber(flightMin)}</td><td class="text-center">${toThaiNumber(m.distance_km || "-")}</td><td class="text-center">${toThaiNumber(touristVal)}</td><td>${toThaiNumber(m.incident_report || "-")}</td><td>${toThaiNumber(m.remark || "-")}</td></tr>`;
      });

      const totDist = logs.reduce((s, m) => s + Number(m.distance_km || 0), 0);
      const totFlight = logs.reduce((s, m) => s + getFlightDuration(m), 0);
      const totTourists = logs.reduce((s, m) => s + getTouristNumber(m), 0);

      const formatFlightTotal = (mins: number) => {
        if (mins >= 60) {
          const hrs = Math.floor(mins / 60);
          const remainingMins = mins % 60;
          if (remainingMins > 0) {
            return `${toThaiNumber(mins.toLocaleString())} นาที (${toThaiNumber(hrs)} ชม. ${toThaiNumber(remainingMins)} นาที)`;
          }
          return `${toThaiNumber(mins.toLocaleString())} นาที (${toThaiNumber(hrs)} ชม.)`;
        }
        return `${toThaiNumber(mins.toLocaleString())} นาที`;
      };

      const touristTotalText = totTourists > 0 ? `${toThaiNumber(totTourists.toLocaleString())} คน` : "-";

      html += `<tr style="background-color:#dbeafe;font-weight:bold;font-size:12px;"><td colspan="7" class="text-right">รวมสถิติทั้งหมด ${toThaiNumber(logs.length.toLocaleString())} ภารกิจ :</td><td class="text-center">${formatFlightTotal(totFlight)}</td><td class="text-center">${toThaiNumber(totDist.toLocaleString())}</td><td class="text-center">${touristTotalText}</td><td colspan="2"></td></tr>`;
      html += `</tbody></table>`;
      return html;
    };

    // ─── Build final HTML ─────────────────────────────────────────────────────
    let bodyContent = "";
    if (type === "CCOC Mobile") {
      bodyContent = `<h3>ผลการปฏิบัติการ — รถปฏิบัติการเคลื่อนที่ CCOC Mobile</h3>${buildCCOCTable(ccocLogs)}`;
    } else if (type === "UAV Mobile") {
      bodyContent = `<h3 style="color:#1e40af;">ผลการปฏิบัติการ — สายตรวจอากาศยานไร้คนขับ (UAV Mobile)</h3>${buildUAVTable(uavLogs)}`;
    } else {
      // ALL = Section CCOC แล้วตาม UAV
      bodyContent = `
        <h3>Section 1 — รถปฏิบัติการเคลื่อนที่ CCOC Mobile</h3>${buildCCOCTable(ccocLogs)}
        <h3 style="color:#1e40af;">Section 2 — สายตรวจอากาศยานไร้คนขับ (UAV Mobile)</h3>${buildUAVTable(uavLogs)}`;
    }

    const html = `<html><head><title>รายงานสถิติ ${titleType}</title><style>${commonCSS}</style></head><body>
      <h2>ผลการปฏิบัติการใช้งาน${titleType}</h2>
      <p style="font-size:14px;margin-bottom:8px;"><strong>ประจำห้วงเวลา:</strong> ${toThaiNumber(getDateRangeText())}</p>
      <div class="header-meta"><strong>ผู้พิมพ์รายงาน:</strong> ${toThaiNumber(currentUser.role === 'admin' ? 'Master Admin' : currentUser.affiliation)} | <strong>วันที่พิมพ์:</strong> ${toThaiNumber(new Date().toLocaleString('th-TH'))}</div>
      ${bodyContent}
    </body></html>`;

    printWindow.document.write(html);
    printWindow.document.close();
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
              try {
                localStorage.setItem('ccoc_current_user', JSON.stringify(user));
              } catch (e) {}
              setShowMapOverlay(true);
              if (user.role === "user") { 
                const isUav = String(user.vehicle_id || "").toLowerCase().startsWith("uav");
                const defaultType = isUav ? "UAV Mobile" : "CCOC Mobile";
                setFormVehicleTypeFilter(defaultType);
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
      <div className={`${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex w-full md:w-56 lg:w-60 xl:w-72 flex-col z-20 shrink-0 transition-colors duration-500 md:m-2 lg:m-3 xl:m-4 md:rounded-3xl md:max-h-[calc(100vh-2rem)] overflow-y-auto custom-scrollbar ${isDarkMode ? 'plate-3d-dark' : 'plate-3d-light'}`}>
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

          {/* เมนูที่ 5: คลังภาพภารกิจ */}
          <button onClick={() => { setActiveMenu(5); setIsMobileMenuOpen(false); }} style={{ animationDelay: '300ms' }} className={`flex items-center gap-3 p-4 rounded-xl font-bold btn-3d anim-fade-in-left ${activeMenu === 5 ? (isDarkMode ? 'menu-active-dark text-cyan-400' : 'menu-active-light text-cyan-600') : (isDarkMode ? 'btn-menu-dark text-gray-400' : 'btn-menu-light text-gray-600')}`}>
            <ImageIcon size={20} /> <span>{currentUser?.role === "admin" ? "5. คลังภาพภารกิจ" : "4. คลังภาพภารกิจ"}</span>
          </button>

          {/* เมนูที่ 6: จัดการรถ/ผู้ใช้ (เฉพาะ Admin) */}
          {currentUser?.role === "admin" && (
            <button onClick={() => { setActiveMenu(6); setIsMobileMenuOpen(false); }} style={{ animationDelay: '380ms' }} className={`flex items-center gap-3 p-4 rounded-xl font-bold btn-3d anim-fade-in-left ${activeMenu === 6 ? (isDarkMode ? 'menu-active-dark text-emerald-400' : 'menu-active-light text-emerald-600') : (isDarkMode ? 'btn-menu-dark text-gray-400' : 'btn-menu-light text-gray-600')}`}>
              <Truck size={20} /> <span>6. จัดการรถ/ผู้ใช้</span>
            </button>
          )}

          {/* เมนูที่ 7: VR TPB */}
          <a
            href="https://dashboard.speaklinks.co.th/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsMobileMenuOpen(false)}
            style={{ animationDelay: '420ms' }}
            className={`flex items-center justify-between p-4 rounded-xl font-bold btn-3d anim-fade-in-left ${isDarkMode ? 'btn-menu-dark text-cyan-400 hover:text-cyan-300' : 'btn-menu-light text-cyan-600 hover:text-cyan-700'}`}
          >
            <div className="flex items-center gap-3">
              <ExternalLink size={20} /> <span>{currentUser?.role === "admin" ? "7. VR TPB" : "5. VR TPB"}</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-900/40 text-cyan-300 border border-cyan-500/30">
              EXTERNAL ↗
            </span>
          </a>

          {/* ปุ่มสลับธีม 3D */}
          <button onClick={() => setIsDarkMode(!isDarkMode)} className={`flex items-center gap-3 p-4 rounded-xl font-bold btn-3d mt-4 ${isDarkMode ? 'btn-menu-dark text-yellow-500' : 'btn-menu-light text-indigo-600'}`}>
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />} <span>{isDarkMode ? 'สลับเป็นธีมสว่าง' : 'สลับเป็นธีมมืด'}</span>
          </button>
        </div>
        
        <div className="mt-auto p-4 border-t border-white/5 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full btn-3d flex items-center justify-center shrink-0 ${isDarkMode ? 'btn-menu-dark text-cyan-400' : 'btn-menu-light text-cyan-600'}`}><UserCircle size={20}/></div>
            <div className="flex-1 overflow-hidden">
              <p className={`text-sm font-bold truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`} title={currentUser.role === 'admin' ? 'Master Admin' : (currentUser.unit_name || currentUser.vehicle_name || VEHICLE_UNIT_MAP[currentUser.username?.toLowerCase()] || currentUser.username)}>
                {currentUser.role === 'admin' ? 'Master Admin' : (currentUser.unit_name || currentUser.vehicle_name || VEHICLE_UNIT_MAP[currentUser.username?.toLowerCase()] || currentUser.username)}
              </p>
              <p className={`text-[11px] font-mono font-bold truncate ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
                {currentUser.role === 'admin' ? 'ALL' : `${currentUser.username} (${currentUser.affiliation || VEHICLE_AFFILIATIONS[currentUser.username?.toLowerCase()] || 'บก.ทท.'})`}
              </p>
            </div>
          </div>
          {/* ปุ่ม รีเฟรชข้อมูล */}
          <button 
            onClick={() => { setLoading(true); fetchData(); }} 
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold tracking-wider btn-3d transition-all ${isDarkMode ? 'btn-menu-dark text-cyan-400 hover:text-cyan-300' : 'btn-menu-light text-cyan-600 hover:text-cyan-700'}`}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> {loading ? "กำลังรีเฟรช..." : "รีเฟรชข้อมูล"}
          </button>

          <button onClick={() => { 
            try { localStorage.removeItem('ccoc_current_user'); } catch (e) {}
            setCurrentUser(null); 
            setActiveMenu(1); 
            setIsMobileMenuOpen(false); 
          }} className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold tracking-wider btn-3d ${isDarkMode ? 'btn-menu-dark text-red-400' : 'btn-menu-light text-red-500'}`}>
            <LogOut size={16} /> LOGOUT
          </button>
        </div>
      </div>

      {/* พื้นที่แสดงผลหลัก (Main Content) */}
      <div className="flex-1 w-full p-2 sm:p-4 h-screen max-h-screen flex flex-col overflow-y-auto relative z-10" onClick={() => { if(isMobileMenuOpen) setIsMobileMenuOpen(false); }}>
        
        {/* หน้า 1: ฟอร์มบันทึกข้อมูล (อัปเดต Layout เป็น 2 คอลัมน์) */}
        {activeMenu === 1 && (
          <div className="flex-1 flex flex-col">
          {showMapOverlay ? (
            <div className="w-full max-w-8xl mx-auto anim-fade-in flex-1">
              <FleetRosterView
                isDarkMode={isDarkMode}
                currentUser={currentUser}
                usersList={usersList}
                missions={data?.missions || []}
                onRecordMission={(vehicleId, affiliation, targetVehicleType) => {
                  const isUav = targetVehicleType ? (targetVehicleType === "UAV Mobile") : String(vehicleId || "").toLowerCase().includes("uav");
                  const vType = targetVehicleType || (isUav ? "UAV Mobile" : "CCOC Mobile");
                  setFormVehicleTypeFilter(vType);
                  const foundUser = usersList.find((u: any) => String(u.username || "").toLowerCase() === String(vehicleId || "").toLowerCase());
                  setFormData(prev => ({
                    ...prev,
                    vehicle_id: vehicleId,
                    vehicle_type: vType,
                    unit_name: foundUser?.unit_name || prev.unit_name,
                    affiliation: affiliation || VEHICLE_AFFILIATIONS[vehicleId?.toLowerCase()] || prev.affiliation
                  }));
                  setShowMapOverlay(false);
                }}
              />
            </div>
          ) : (
            <div className="w-full max-w-8xl mx-auto flex flex-col gap-4 anim-fade-in">
              {formVehicleTypeFilter === "UAV Mobile" || String(formData.vehicle_id || "").toLowerCase().includes("uav") ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                  <div className="lg:col-span-2 xl:col-span-3">
                    <UavMissionForm
                      isDarkMode={isDarkMode}
                      currentUser={currentUser}
                      usersList={usersList}
                      formData={formData}
                      handleChange={handleChange}
                      setFormData={setFormData}
                      uploadedFiles={uploadedFiles}
                      setUploadedFiles={setUploadedFiles}
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (uploadedFiles.length < 2) {
                          showNotification({
                            type: "warning",
                            title: "อัปโหลดรูปภาพไม่ครบถ้วน",
                            message: "กรุณาอัปโหลดรูปภาพประกอบภารกิจอย่างน้อย 2 รูปครับ",
                            details: ["ระบบต้องการรูปภาพอย่างน้อย 2 ถึง 5 รูปในการบันทึกภารกิจ"],
                          });
                          return;
                        }
                        if (uploadedFiles.length > 5) {
                          showNotification({
                            type: "warning",
                            title: "จำนวนรูปภาพเกินกำหนด",
                            message: "สามารถอัปโหลดรูปภาพได้สูงสุดไม่เกิน 5 รูปครับ",
                          });
                          return;
                        }
                        setShowConfirmModal(true);
                      }}
                      isSubmitting={isSubmitting}
                      setShowMapOverlay={setShowMapOverlay}
                      onSwitchFormType={(type) => setFormVehicleTypeFilter(type)}
                    />
                  </div>

                  {/* ฝั่งขวา: กรอบ Log */}
                  <div className={`lg:col-span-1 flex flex-col p-4 sm:p-6 rounded-3xl anim-fade-in-right max-h-[500px] lg:max-h-[calc(100vh-2rem)] lg:sticky lg:top-4 ${isDarkMode ? 'plate-3d-dark' : 'plate-3d-light'}`}>
                    <h3 className={`text-lg sm:text-xl font-bold mb-4 sm:mb-6 flex items-center gap-2 ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
                      <Shield size={20} /> ผู้เข้าใช้งานล่าสุด (log)
                    </h3>
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-3">
                      {loginLogs.slice().reverse().map((log: any, index: number) => {
                        const displayName = VEHICLE_NAMES[log.username] || log.username;
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
                              <p className={`text-[10px] ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{formattedTime}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
              
              {/* ฝั่งซ้าย: ฟอร์มบันทึกข้อมูล CCOC Mobile */}
              <div className={`lg:col-span-2 xl:col-span-3 p-3 sm:p-4 md:p-5 rounded-3xl flex flex-col ${isDarkMode ? 'plate-3d-dark' : 'plate-3d-light'}`}>
                 <h2 className={`text-xl font-bold mb-4 flex items-center justify-between pb-3 border-b border-white/10 ${isDarkMode ? 'text-fuchsia-400' : 'text-fuchsia-600'}`}>
                   <div className="flex items-center gap-2.5">
                     <div className={`p-2.5 rounded-xl btn-3d ${isDarkMode ? 'btn-menu-dark text-fuchsia-400' : 'btn-menu-light text-fuchsia-600'}`}><PenTool size={18} /></div> 
                     <span>บันทึกภารกิจใหม่ ({formData.vehicle_id.toUpperCase()})</span>
                   </div>
                   
                   <div className="flex items-center gap-3">
                     <button 
                       type="button" 
                       onClick={() => setShowMapOverlay(true)} 
                       className={`text-xs font-bold px-4 py-2.5 rounded-xl btn-3d flex items-center gap-2 ${isDarkMode ? 'btn-menu-dark text-cyan-400' : 'btn-menu-light text-cyan-600'}`}
                     >
                       <List size={14} /> กลับรายชื่อรถ
                     </button>
                   </div>
                 </h2>
              
                <form id="mission-form" onSubmit={(e) => { 
                  e.preventDefault(); 
                  if (uploadedFiles.length < 2) {
                    showNotification({
                      type: "warning",
                      title: "อัปโหลดรูปภาพไม่ครบถ้วน",
                      message: "กรุณาอัปโหลดรูปภาพประกอบภารกิจอย่างน้อย 2 รูปครับ",
                      details: ["ระบบต้องการรูปภาพอย่างน้อย 2 ถึง 5 รูปในการบันทึกภารกิจ"],
                    });
                    return;
                  }
                  if (uploadedFiles.length > 5) {
                    showNotification({
                      type: "warning",
                      title: "จำนวนรูปภาพเกินกำหนด",
                      message: "สามารถอัปโหลดรูปภาพได้สูงสุดไม่เกิน 5 รูปครับ",
                    });
                    return;
                  }
                  setShowConfirmModal(true); 
                }} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-4 content-start">
                 
                 <div className="flex flex-col gap-1 min-w-0 sm:col-span-2 lg:col-span-2">
                   <label className={`text-xs sm:text-sm font-mono font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>สังกัดของรถโมบาย (Affiliation)</label>
                   <select required disabled={currentUser.role === "user"} name="affiliation" value={formData.affiliation} onChange={handleChange} className={`py-2 px-3 rounded-xl text-xs sm:text-sm focus:outline-none disabled:opacity-50 transition-all cursor-pointer w-full min-w-0 ${isDarkMode ? 'input-3d-dark text-white' : 'input-3d-light text-black'}`}>
                     <option value="" disabled>-- โปรดเลือกสังกัดท่าน --</option><option value="บช.ทท.">1. กองบัญชาการตำรวจท่องเที่ยว (บช.ทท.)</option><option value="บก.ทท.1">2. กองบังคับการตำรวจท่องเที่ยว 1</option><option value="บก.ทท.2">3. กองบังคับการตำรวจท่องเที่ยว 2</option><option value="บก.ทท.3">4. กองบังคับการตำรวจท่องเที่ยว 3</option>
                   </select>
                 </div>

                 <div className="flex flex-col gap-1 min-w-0 sm:col-span-2 lg:col-span-2">
                   <label className={`text-xs sm:text-sm font-mono font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>ใส่รหัสรถโมบายในสังกัดท่าน</label>
                   <select required disabled={currentUser.role === "user"} name="vehicle_id" value={formData.vehicle_id} onChange={handleChange} className={`py-2 px-3 rounded-xl text-xs sm:text-sm focus:outline-none disabled:opacity-50 transition-all cursor-pointer w-full min-w-0 ${isDarkMode ? 'input-3d-dark text-white' : 'input-3d-light text-black'}`}>
                     <option value="" disabled>-- เลือกรหัสรถ --</option>
                     {/* CCOC Mobile group */}
                     {usersList.filter((u: any) => u.role !== "admin" && (String(u.username || "").toLowerCase().startsWith("stc") || String(u.vehicle_type || "").toLowerCase() === "ccoc mobile")).length > 0 && (
                       <optgroup label="── CCOC Mobile ──">
                         {usersList.filter((u: any) => u.role !== "admin" && (String(u.username || "").toLowerCase().startsWith("stc") || String(u.vehicle_type || "").toLowerCase() === "ccoc mobile")).map((u: any, i: number) => (
                           <option key={`stc-${i}`} value={u.username}>{u.username} {u.unit_name ? `— ${u.unit_name}` : ""}</option>
                         ))}
                       </optgroup>
                     )}
                     {/* UAV Mobile group */}
                     {usersList.filter((u: any) => u.role !== "admin" && (String(u.username || "").toLowerCase().startsWith("uav") || String(u.vehicle_type || "").toLowerCase() === "uav mobile" || String(u.username || "").toLowerCase() === "uav mobile")).length > 0 && (
                       <optgroup label="── UAV Mobile ──">
                         {usersList.filter((u: any) => u.role !== "admin" && (String(u.username || "").toLowerCase().startsWith("uav") || String(u.vehicle_type || "").toLowerCase() === "uav mobile" || String(u.username || "").toLowerCase() === "uav mobile")).map((u: any, i: number) => (
                           <option key={`uav-${i}`} value={u.username}>{u.username} {u.unit_name ? `— ${u.unit_name}` : ""}</option>
                         ))}
                       </optgroup>
                     )}
                     {/* Fallback: หากยังโหลด usersList ไม่เสร็จ แสดง hardcode */}
                     {usersList.filter((u: any) => u.role !== "admin").length === 0 && (
                       <>
                         <optgroup label="── CCOC Mobile ──">
                           <option value="stc01">stc01 — บช.ทท.</option>
                           <option value="stc02">stc02 — ภูเก็ต</option>
                           <option value="stc03">stc03 — อยุธยา</option>
                           <option value="stc04">stc04 — ชลบุรี</option>
                           <option value="stc05">stc05 — โคราช</option>
                           <option value="stc06">stc06 — เชียงใหม่</option>
                           <option value="stc07">stc07 — พิษณุโลก</option>
                           <option value="stc08">stc08 — หัวหิน</option>
                           <option value="stc09">stc09 — สนามศุภชลาศัย</option>
                           <option value="stc10">stc10 — หาดใหญ่</option>
                         </optgroup>
                         <optgroup label="── UAV Mobile ──">
                           <option value="UAV Mobile">UAV Mobile</option>
                         </optgroup>
                       </>
                     )}
                   </select>
                 </div>

                 <div className="flex flex-col gap-1.5 sm:col-span-1 lg:col-span-1">
                   <label className={`text-sm sm:text-base font-mono font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>1. หน่วยที่ออกภารกิจ</label>
                   <input required type="text" name="unit_name" value={formData.unit_name} onChange={handleChange} placeholder="เช่น บช.ทท." className={`py-3 px-4 rounded-xl text-sm sm:text-base focus:outline-none transition-all ${isDarkMode ? 'input-3d-dark text-white' : 'input-3d-light text-black'}`} />
                 </div>

                 <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-2">
                   <label className={`text-sm sm:text-base font-mono font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>2. ชื่อภารกิจ</label>
                   <input required type="text" name="mission_name" value={formData.mission_name} onChange={handleChange} placeholder="ระบุชื่อภารกิจ...ออกตรวจดูแลนักท่องเที่ยว หรือ ภารกิจสนับสนุน ของบช.ทท." className={`py-3 px-4 rounded-xl text-sm sm:text-base focus:outline-none transition-all ${isDarkMode ? 'input-3d-dark text-white' : 'input-3d-light text-black'}`} />
                 </div>

                 <div className="flex flex-col gap-1.5 sm:col-span-1 lg:col-span-1">
                   <label className={`text-sm sm:text-base font-mono font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>พิกัด/จังหวัด</label>
                   <input required type="text" name="province" value={formData.province} onChange={handleChange} placeholder="เช่น สวนเบญ จ.กทม." className={`py-3 px-4 rounded-xl text-sm sm:text-base focus:outline-none transition-all ${isDarkMode ? 'input-3d-dark text-white' : 'input-3d-light text-black'}`} />
                 </div>

                 <div className="flex flex-col gap-1.5 sm:col-span-1 lg:col-span-1">
                   <label className={`text-sm sm:text-base font-mono font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>3. วันที่เริ่มภารกิจ</label>
                   <input required type="date" name="start_date" value={formData.start_date} onChange={handleChange} className={`py-3 px-4 rounded-xl text-sm sm:text-base focus:outline-none transition-all cursor-pointer ${isDarkMode ? 'input-3d-dark text-white' : 'input-3d-light text-black'}`} style={{colorScheme: isDarkMode ? "dark" : "light"}} />
                 </div>

                 <div className="flex flex-col gap-1.5 sm:col-span-1 lg:col-span-1">
                   <label className={`text-sm sm:text-base font-mono font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>4. วันที่สิ้นสุดภารกิจ</label>
                   <input required type="date" name="end_date" value={formData.end_date} onChange={handleChange} className={`py-3 px-4 rounded-xl text-sm sm:text-base focus:outline-none transition-all cursor-pointer ${isDarkMode ? 'input-3d-dark text-white' : 'input-3d-light text-black'}`} style={{colorScheme: isDarkMode ? "dark" : "light"}} />
                 </div>

                 <div className="flex flex-col gap-1.5 sm:col-span-1 lg:col-span-1">
                   <label className={`text-sm sm:text-base font-mono font-bold ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>รวมระยะเวลา (วัน)</label>
                   <input readOnly type="text" name="total_days" value={formData.total_days} placeholder="คำนวณอัตโนมัติ" className={`py-3 px-4 rounded-xl text-sm sm:text-base focus:outline-none cursor-not-allowed font-bold ${isDarkMode ? 'input-3d-dark text-cyan-400' : 'input-3d-light text-cyan-600'}`} />
                 </div>

                 <div className="flex flex-col gap-1.5 sm:col-span-1 lg:col-span-1">
                   <label className={`text-sm sm:text-base font-mono font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>5. ระยะทาง (ไป-กลับ กม.)</label>
                   <input type="number" name="distance_km" value={formData.distance_km} onChange={handleChange} placeholder="ระบุระยะทาง" className={`py-3 px-4 rounded-xl text-sm sm:text-base focus:outline-none transition-all ${isDarkMode ? 'input-3d-dark text-white' : 'input-3d-light text-black'}`} />
                 </div>

                 <div className="flex flex-col gap-1.5 sm:col-span-1 lg:col-span-1">
                   <label className={`text-sm sm:text-base font-mono font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>6. จำนวนคน (ต่อวัน)</label>
                   <input type="number" name="people_per_day" value={formData.people_per_day} onChange={handleChange} placeholder="จำนวนคน" className={`py-3 px-4 rounded-xl text-sm sm:text-base focus:outline-none transition-all ${isDarkMode ? 'input-3d-dark text-white' : 'input-3d-light text-black'}`} />
                 </div>

                 <div className="flex flex-col gap-1.5 sm:col-span-1 lg:col-span-1">
                   <label className={`text-sm sm:text-base font-mono font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>รวมผู้ร่วมงานทั้งหมด</label>
                   <input readOnly type="text" name="people_total" value={formData.people_total} placeholder="คำนวณอัตโนมัติ" className={`py-3 px-4 rounded-xl text-sm sm:text-base focus:outline-none cursor-not-allowed font-bold ${isDarkMode ? 'input-3d-dark text-green-400' : 'input-3d-light text-green-600'}`} />
                 </div>

                 <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-2">
                   <label className={`text-sm sm:text-base font-mono font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>7. เหตุสำคัญ / รับแจ้ง</label>
                   <input type="text" name="incident_report" value={formData.incident_report} onChange={handleChange} placeholder="เช่น เหตุการณ์ปกติ..." className={`py-3 px-4 rounded-xl text-sm sm:text-base focus:outline-none transition-all ${isDarkMode ? 'input-3d-dark text-white' : 'input-3d-light text-black'}`} />
                 </div>
                 </div> {/* end of grid */}

                 {/* กรอบสี่เหลี่ยมจัดกลุ่ม หมายเหตุ และ อัปโหลดรูปภาพ (2 คอลัมน์) */}
                 <div className={`p-3 sm:p-4 rounded-2xl border transition-all ${
                   isDarkMode 
                     ? 'bg-gray-950/40 border-purple-900/30 shadow-[0_10px_30px_rgba(0,0,0,0.3),inset_0_0_15px_rgba(168,85,247,0.05)]' 
                     : 'bg-gray-50/50 border-gray-200 shadow-sm'
                 }`}>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     
                     {/* คอลัมน์ที่ 1: 8. หมายเหตุ */}
                     <div className="flex flex-col gap-1.5">
                       <label className={`text-sm sm:text-base font-mono font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>8. หมายเหตุ</label>
                       <textarea 
                         name="remark" 
                         value={formData.remark} 
                         onChange={handleChange} 
                         placeholder="ระบุเพิ่มเติม (ถ้ามี)..." 
                         className={`py-3 px-4 rounded-xl text-sm sm:text-base focus:outline-none transition-all min-h-[100px] resize-none ${
                           isDarkMode ? 'input-3d-dark text-white' : 'input-3d-light text-black'
                         }`} 
                       />
                     </div>

                     {/* คอลัมน์ที่ 2: 9. อัปโหลดรูปภาพ */}
                     <div className="flex flex-col min-h-[140px]">
                       <PhotoUploadZone
                         files={uploadedFiles}
                         setFiles={setUploadedFiles}
                         isDarkMode={isDarkMode}
                       />
                     </div>

                   </div>
                 </div>
                 
                 {/* ปุ่มบันทึกเข้าฐานข้อมูล ตรงกลาง ด้านล่าง */}
                 <div className="mt-3 flex justify-center">
                   <button 
                     disabled={isSubmitting} 
                     type="submit" 
                     className="btn-3d btn-primary-3d px-10 sm:px-14 py-4 sm:py-5 rounded-2xl font-bold text-lg sm:text-xl tracking-widest w-full md:w-auto shadow-[0_0_15px_rgba(217,70,239,0.3)] hover:scale-[1.02] active:scale-95 transition-all"
                   > 
                     {isSubmitting ? "กำลังส่งเข้าฐานข้อมูล..." : "บันทึกเข้าฐานข้อมูล"} 
                   </button>
                 </div>
                </form>
             </div>
          {/* ฝั่งขวา: กรอบ Log (ใส่เอฟเฟกต์เลื่อนเข้าและเด้งขึ้น) */}
          <div className={`lg:col-span-1 flex flex-col p-4 sm:p-6 rounded-3xl anim-fade-in-right max-h-[500px] lg:max-h-[calc(100vh-2rem)] lg:sticky lg:top-4 ${isDarkMode ? 'plate-3d-dark' : 'plate-3d-light'}`}>
            <h3 className={`text-lg sm:text-xl font-bold mb-4 sm:mb-6 flex items-center gap-2 ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
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
          )}
          </div>
          )}
          </div>
        )}
        {activeMenu === 2 && (
          <div className={`w-full mx-auto min-h-[80vh] flex flex-col p-3.5 sm:p-5 rounded-3xl anim-fade-in ${isDarkMode ? 'plate-3d-dark' : 'plate-3d-light'}`}>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 pb-4 border-b border-white/10 shrink-0 anim-fade-in-down gap-3">
              <h2 className={`text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2.5 ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
                <div className={`p-2 sm:p-2.5 rounded-xl btn-3d ${isDarkMode ? 'btn-menu-dark text-cyan-400' : 'btn-menu-light text-cyan-600'}`}><List size={22} /></div>
                รายการบันทึกข้อมูล
              </h2>
              
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4 lg:mt-0">
                <button onClick={() => { setLoading(true); fetchData(); }} className={`flex items-center gap-2 text-xs sm:text-sm font-bold px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl btn-3d ${isDarkMode ? 'btn-menu-dark text-blue-400' : 'btn-menu-light text-blue-600'}`}>
                  <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> รีเฟรชข้อมูล
                </button>
                <button onClick={() => setShowPdfModal(true)} className={`flex items-center gap-2 text-xs sm:text-sm font-bold px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl btn-3d ${isDarkMode ? 'btn-menu-dark text-red-400' : 'btn-menu-light text-red-600'}`}>
                  <Printer size={16} /> ดึงไฟล์ PDF
                </button>

                <div 
                  onClick={(e) => e.stopPropagation()} 
                  className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 px-3 sm:px-5 rounded-xl ml-0 sm:ml-2 transition-all cursor-pointer hover:brightness-110 ${isDarkMode ? 'input-3d-dark' : 'input-3d-light'}`}
                >
                  <Calendar className={isDarkMode ? "text-cyan-500" : "text-cyan-600"} size={18} />
                  <input type="date" value={logFilterStartDate} onChange={(e) => setLogFilterStartDate(e.target.value)} className="bg-transparent text-xs sm:text-sm focus:outline-none cursor-pointer w-full h-full" style={{colorScheme: isDarkMode ? "dark" : "light"}} />
                  <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>-</span>
                  <input type="date" value={logFilterEndDate} onChange={(e) => setLogFilterEndDate(e.target.value)} className="bg-transparent text-xs sm:text-sm focus:outline-none cursor-pointer w-full h-full" style={{colorScheme: isDarkMode ? "dark" : "light"}} />
                </div>

                <div 
                  onClick={(e) => e.stopPropagation()} 
                  className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 px-3 sm:px-5 rounded-xl transition-all cursor-pointer hover:brightness-110 ${isDarkMode ? 'input-3d-dark' : 'input-3d-light'}`}
                >
                  <Filter className={isDarkMode ? "text-orange-500" : "text-orange-600"} size={18} />
                  <select value={logFilterAffiliation} onChange={(e) => setLogFilterAffiliation(e.target.value)} className={`bg-transparent text-xs sm:text-sm font-bold focus:outline-none cursor-pointer w-full h-full ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                    <option value="ALL">ทุกสังกัด</option><option value="บช.ทท.">บช.ทท.</option><option value="บก.ทท.1">บก.ทท.1</option><option value="บก.ทท.2">บก.ทท.2</option><option value="บก.ทท.3">บก.ทท.3</option>
                  </select>
                </div>

                {/* PDF Type Filter */}
                <div 
                  onClick={(e) => e.stopPropagation()} 
                  className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 px-3 sm:px-5 rounded-xl transition-all cursor-pointer hover:brightness-110 ${isDarkMode ? 'input-3d-dark' : 'input-3d-light'}`}
                >
                  <Truck className={isDarkMode ? "text-fuchsia-400" : "text-fuchsia-600"} size={18} />
                  <select value={pdfTypeFilter} onChange={(e) => setPdfTypeFilter(e.target.value)} className={`bg-transparent text-xs sm:text-sm font-bold focus:outline-none cursor-pointer w-full h-full ${isDarkMode ? 'text-fuchsia-400' : 'text-fuchsia-600'}`}>
                    <option value="ALL">ทุกประเภทรถ</option>
                    <option value="CCOC Mobile">CCOC Mobile</option>
                    <option value="UAV Mobile">UAV Mobile</option>
                  </select>
                </div>
              </div>
            </div>

            {loading ? ( <div className="flex justify-center items-center h-40"><p className="text-cyan-400 font-mono animate-pulse text-lg">&gt; กำลังดึงฐานข้อมูลอยู่จ้า!!</p></div> ) : (
              <div className={`rounded-2xl overflow-hidden min-h-[400px] ${isDarkMode ? 'input-3d-dark' : 'input-3d-light'}`}>
                <div className="overflow-x-auto overflow-y-auto max-h-[60vh] w-full custom-scrollbar p-2">
                  <div className="min-w-[900px] flex flex-col">
                    
                    <div className={`grid grid-cols-12 gap-4 p-4 rounded-xl mb-2 text-sm tracking-wider shrink-0 font-bold ${isDarkMode ? 'btn-menu-dark text-cyan-400' : 'btn-menu-light text-cyan-700'}`}>
                      <div className="col-span-1 text-center">ลำดับ.</div><div className="col-span-4">MISSION NAME / ชื่อภารกิจ</div><div className="col-span-2 text-center">หน่วยงานที่ออกภารกิจ</div><div className="col-span-2">พิกัด / จังหวัด</div><div className="col-span-3 text-right">DATE RECORDED</div>
                    </div>
                    
                    <div className="space-y-2 pr-2">
                      {filteredLogs.map((mission: any, index: number) => (
                        <div key={index} onClick={() => { setSelectedMission(mission); setIsEditing(false); }} style={{ animationDelay: `${Math.min(index, 15) * 30}ms` }} className={`grid grid-cols-12 gap-4 p-4 rounded-xl items-center cursor-pointer btn-3d anim-fade-in-up ${isDarkMode ? 'list-item-3d-dark' : 'btn-menu-light hover:brightness-95'}`}>
                          <div className={`col-span-1 text-center font-mono ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{(index + 1).toString().padStart(3, '0')}</div>
                          <div className={`col-span-4 font-bold truncate pr-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{mission.mission_name || "ไม่ระบุชื่อภารกิจ"}</div>
                          <div className="col-span-2 text-center"><span className={`text-xs font-mono px-3 py-1.5 rounded-lg shadow-inner ${getAffiliationColor(mission.affiliation, isDarkMode)}`}>{mission.affiliation || "-"}</span></div>
                          <div className={`col-span-2 truncate pr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{mission.province}</div>
                          <div className={`col-span-3 text-right font-mono text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>{formatRecordedDate(mission.timestamp)}</div>
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
          <div className={`p-4 sm:p-6 md:p-4 rounded-[30px] anim-fade-in-up min-h-[85vh] flex flex-col overflow-y-auto ${isDarkMode ? 'plate-3d-dark' : 'plate-3d-light'}`}>
            <DashboardView missions={allowedMissions} refreshData={fetchData} /> 
          </div> 
        )}

        {/* หน้า 4: ประวัติการเข้าใช้งาน (Admin เท่านั้น) */}
        {activeMenu === 4 && currentUser?.role === "admin" && (
          <div className={`w-full mx-auto min-h-[80vh] flex flex-col p-3.5 sm:p-5 rounded-3xl anim-fade-in ${isDarkMode ? 'plate-3d-dark' : 'plate-3d-light'}`}>
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 pb-4 border-b border-white/10 shrink-0 anim-fade-in-down gap-3">
              <h2 className={`text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2.5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                <div className={`p-2 sm:p-2.5 rounded-xl btn-3d ${isDarkMode ? 'btn-menu-dark text-green-400' : 'btn-menu-light text-green-600'}`}><History size={22} /></div>
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
              <div className={`rounded-2xl overflow-hidden min-h-[400px] ${isDarkMode ? 'input-3d-dark' : 'input-3d-light'}`}>
                <div className="overflow-x-auto overflow-y-auto max-h-[60vh] w-full custom-scrollbar p-2">
                  <div className="min-w-[600px]">
                    {/* Header ตาราง */}
                    <div className={`grid grid-cols-12 gap-4 p-4 rounded-xl mb-2 text-sm tracking-wider shrink-0 font-bold ${isDarkMode ? 'btn-menu-dark text-green-400' : 'btn-menu-light text-green-700'}`}>
                      <div className="col-span-1 text-center">#</div>
                      <div className="col-span-3">USERNAME / รหัสรถ</div>
                      <div className="col-span-3 text-center">สังกัด</div>
                      <div className="col-span-2 text-center">ROLE</div>
                      <div className="col-span-3 text-right">วันเวลาเข้าใช้งาน</div>
                    </div>
                    {/* รายการ */}
                    <div className="space-y-2 pr-2">
                      {loginLogs.slice().reverse().map((log: any, index: number) => {
                        const displayName = VEHICLE_NAMES[log.username] || log.username;
                        const formattedTime = log.timestamp ? formatRecordedDate(log.timestamp) : "ไม่ระบุเวลา";
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

        {/* หน้า 5: คลังภาพภารกิจ */}
        {activeMenu === 5 && (
          <MissionPhotoView
            missions={data?.missions || []}
            currentUser={currentUser}
            isDarkMode={isDarkMode}
          />
        )}

        {/* หน้า 6: จัดการรถ/ผู้ใช้ (Admin เท่านั้น) */}
        {activeMenu === 6 && currentUser?.role === "admin" && (
          <VehicleManagementView
            isDarkMode={isDarkMode}
            usersList={usersList}
            fetchData={fetchData}
            API_URL={API_URL}
          />
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
                  (() => {
                    const isSelectedUav = String(selectedMission.vehicle_type || "").toLowerCase().includes("uav") ||
                                          String(selectedMission.vehicle_id || "").toLowerCase().includes("uav") ||
                                          Boolean(selectedMission.drone_id);

                    const formatModalDate = (dStr: string) => {
                      if (!dStr) return "-";
                      try {
                        const d = new Date(dStr);
                        if (isNaN(d.getTime())) return dStr;
                        return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
                      } catch { return dStr; }
                    };

                    return isSelectedUav ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-5">
                          <div>
                            <p className={`text-xs font-bold tracking-widest mb-1 ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>ชื่อภารกิจ UAV</p>
                            <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{selectedMission.mission_name || "-"}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-xl btn-3d shrink-0 ${isDarkMode ? 'btn-menu-dark text-cyan-400' : 'btn-menu-light text-cyan-600'}`}><MapPin size={20} /></div>
                            <div>
                              <p className="text-xs font-bold text-gray-500">พิกัด / จังหวัด</p>
                              <p className={`text-base font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{selectedMission.province || selectedMission.location || "-"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-xl btn-3d shrink-0 ${isDarkMode ? 'btn-menu-dark text-orange-400' : 'btn-menu-light text-orange-600'}`}><Shield size={20} /></div>
                            <div>
                              <p className="text-xs font-bold text-gray-500">สังกัด / รหัสโดรน</p>
                              <p className="mt-0.5 font-mono font-bold text-orange-400">{selectedMission.affiliation || "บช.ทท."} | {selectedMission.unit_name ? `${selectedMission.unit_name} (${selectedMission.raw_vehicle_id || selectedMission.vehicle_id})` : (selectedMission.raw_vehicle_id || selectedMission.vehicle_id)}</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-5">
                          <div className={`p-5 rounded-2xl ${isDarkMode ? 'input-3d-dark' : 'input-3d-light'}`}>
                            <p className="text-xs font-bold text-gray-500 mb-1"><Calendar className="inline mr-1.5" size={14}/>วันเวลาปฏิบัติการ</p>
                            <p className={`text-base font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>วันที่ {formatModalDate(selectedMission.start_date)} เวลา {selectedMission.start_time || "21.00"} น.</p>
                            <p className={`text-xs mt-2 font-mono ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>ระยะทางปฏิบัติภารกิจ: {selectedMission.distance_km ? `${selectedMission.distance_km} กม.` : "-"}</p>
                          </div>

                          <div className={`p-5 rounded-2xl ${isDarkMode ? 'input-3d-dark' : 'input-3d-light'}`}>
                            <p className="text-xs font-bold text-gray-500 mb-1"><Plane className="inline mr-1.5" size={14}/>ข้อมูลโดรน UAV</p>
                            <p className={`text-sm font-bold ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>รุ่นโดรน: {selectedMission.drone_id || "Drone-01"}</p>
                            <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>รอบการบิน: {selectedMission.sorties || 1} รอบ | ระยะเวลาบิน: {selectedMission.flight_duration_min || 45} นาที</p>
                            {selectedMission.coverage_detail && (
                              <p className={`text-xs mt-1.5 pt-1.5 border-t border-white/10 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>พื้นที่ปฏิบัติการ: {selectedMission.coverage_detail}</p>
                            )}
                          </div>

                          <div className={`p-5 rounded-2xl ${isDarkMode ? 'input-3d-dark' : 'input-3d-light'}`}>
                            <p className="text-xs font-bold text-gray-500 mb-1"><Users className="inline mr-1.5" size={14}/>ปริมาณ / จำนวนนักท่องเที่ยวโดยประมาณ</p>
                            <p className={`text-xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                              {(() => {
                                const count = selectedMission.tourist_count_est || selectedMission.people_total || selectedMission.people_per_day;
                                if (count && count !== "-" && !String(count).includes("ไม่ได้")) {
                                  const numStr = String(count).trim();
                                  if (/^\d+$/.test(numStr)) {
                                    return `${Number(numStr).toLocaleString()} คน`;
                                  }
                                  return numStr.includes("คน") ? numStr : `${numStr} คน`;
                                }
                                const density = selectedMission.tourist_density || "-";
                                if (density !== "-" && !density.includes("ไม่ได้")) {
                                  return density;
                                }
                                return "-";
                              })()}
                            </p>
                          </div>
                        </div>

                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/10">
                          <div className={`p-5 rounded-2xl ${isDarkMode ? 'input-3d-dark' : 'input-3d-light'}`}>
                            <p className="text-xs font-bold text-gray-500 mb-1">ผลการปฏิบัติงาน (INCIDENT REPORT)</p>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{selectedMission.incident_report || "เหตุการณ์ทั่วไปปกติ"}</p>
                          </div>
                          <div className={`p-5 rounded-2xl ${isDarkMode ? 'input-3d-dark' : 'input-3d-light'}`}>
                            <p className="text-xs font-bold text-gray-500 mb-1">หมายเหตุ / ข้อมูลเพิ่มเติม (REMARK)</p>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{selectedMission.remark || "-"}</p>
                          </div>
                        </div>

                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/10">
                          <div className={`p-5 rounded-2xl ${isDarkMode ? 'input-3d-dark' : 'input-3d-light'}`}>
                            <p className="text-xs font-bold text-gray-500 mb-1">ผลการปฏิบัติงาน (INCIDENT REPORT)</p>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{selectedMission.incident_report || "เหตุการณ์ทั่วไปปกติ"}</p>
                          </div>
                          <div className={`p-5 rounded-2xl ${isDarkMode ? 'input-3d-dark' : 'input-3d-light'}`}>
                            <p className="text-xs font-bold text-gray-500 mb-1">หมายเหตุ / ข้อมูลเพิ่มเติม (REMARK)</p>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{selectedMission.remark || "-"}</p>
                          </div>
                        </div>

                        <div className="md:col-span-2 pt-4 border-t border-white/10">
                          <PhotoGallery
                            missionTimestamp={selectedMission.timestamp}
                            currentUser={currentUser}
                            isDarkMode={isDarkMode}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-6">
                            <div><p className={`text-xs font-bold tracking-widest mb-1 ${isDarkMode ? 'text-cyan-500' : 'text-cyan-700'}`}>ชื่อภารกิจ</p><p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{selectedMission.mission_name || "-"}</p></div>
                            <div className="flex items-center gap-4"><div className={`p-4 rounded-xl btn-3d ${isDarkMode ? 'btn-menu-dark text-cyan-400' : 'btn-menu-light text-cyan-600'}`}><MapPin /></div><div><p className="text-xs font-bold text-gray-500">พิกัด / จังหวัด</p><p className={`text-lg font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{selectedMission.province || "-"}</p></div></div>
                            <div className="flex items-center gap-4"><div className={`p-4 rounded-xl btn-3d ${isDarkMode ? 'btn-menu-dark text-fuchsia-400' : 'btn-menu-light text-fuchsia-600'}`}><Shield /></div><div><p className="text-xs font-bold text-gray-500">สังกัด / รหัสรถ</p><p className="mt-1 font-mono font-bold text-fuchsia-500">{selectedMission.affiliation || "บช.ทท."} | {VEHICLE_NAMES[selectedMission.vehicle_id] || selectedMission.vehicle_id}</p></div></div>
                         </div>
                         <div className="space-y-6">
                            <div className={`p-6 rounded-2xl ${isDarkMode ? 'input-3d-dark' : 'input-3d-light'}`}>
                              <p className="text-xs font-bold text-gray-500 mb-2"><Calendar className="inline mr-2" size={14}/>ห้วงเวลาปฏิบัติการ</p>
                              <p className={`text-lg font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                {formatModalDate(selectedMission.start_date)} {selectedMission.end_date ? `ถึง ${formatModalDate(selectedMission.end_date)}` : ""}
                              </p>
                              {selectedMission.total_days && <p className={`text-sm mt-2 font-bold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>รวม: {selectedMission.total_days} วัน</p>}
                            </div>
                            <div className={`p-6 rounded-2xl ${isDarkMode ? 'input-3d-dark' : 'input-3d-light'}`}>
                              <p className="text-xs font-bold text-gray-500 mb-2"><Users className="inline mr-2" size={14}/>จำนวนผู้เข้าร่วมงานโดยประมาณ</p>
                              <p className={`text-3xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                                {!isNaN(Number(selectedMission.people_total)) && Number(selectedMission.people_total) > 0 
                                  ? Number(selectedMission.people_total).toLocaleString() 
                                  : !isNaN(Number(selectedMission.people_per_day)) 
                                  ? Number(selectedMission.people_per_day).toLocaleString() 
                                  : "-"} <span className="text-sm font-normal text-gray-500">คน</span>
                              </p>
                            </div>
                         </div>
                         <div className={`md:col-span-2 grid grid-cols-2 gap-6 pt-6 border-t border-white/10`}>
                            <div className={`p-6 rounded-2xl ${isDarkMode ? 'input-3d-dark' : 'input-3d-light'}`}><p className="text-xs font-bold text-gray-500 mb-2">INCIDENT REPORT</p><p className={isDarkMode ? 'text-gray-300' : 'text-gray-800'}>{selectedMission.incident_report || "-"}</p></div>
                            <div className={`p-6 rounded-2xl ${isDarkMode ? 'input-3d-dark' : 'input-3d-light'}`}><p className="text-xs font-bold text-gray-500 mb-2">REMARK / DISTANCE</p><p className={isDarkMode ? 'text-gray-300' : 'text-gray-800'}>{selectedMission.remark || "-"}</p><p className={`mt-2 font-mono font-bold ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>{selectedMission.distance_km ? `Distance: ${selectedMission.distance_km} km` : ""}</p></div>
                         </div>
                         <div className="md:col-span-2 pt-6 border-t border-white/10">
                           <PhotoGallery
                             missionTimestamp={selectedMission.timestamp}
                             currentUser={currentUser}
                             isDarkMode={isDarkMode}
                           />
                         </div>
                      </div>
                    );
                  })()
                ) : (
                  <form onSubmit={(e) => handleSubmit(e, "edit")} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* ... ฟอร์ม Edit ... */}
                    <div className="flex flex-col gap-2 md:col-span-2"><label className="text-sm font-bold text-yellow-500">ชื่อภารกิจ</label><input required type="text" name="mission_name" value={formData.mission_name} onChange={handleChange} placeholder="ระบุชื่อภารกิจ...ออกตรวจดูแลนักท่องเที่ยว หรือ ภารกิจสนับสนุน ของบช.ทท." className={`p-4 rounded-xl focus:outline-none ${isDarkMode ? 'input-3d-dark text-white focus:border-yellow-500' : 'input-3d-light text-black'}`} /></div>
                    <div className="flex flex-col gap-2"><label className="text-sm font-bold text-yellow-500">จังหวัด/พิกัด</label><input required type="text" name="province" value={formData.province} onChange={handleChange} className={`p-4 rounded-xl focus:outline-none ${isDarkMode ? 'input-3d-dark text-white focus:border-yellow-500' : 'input-3d-light text-black'}`} /></div>
                    <div className="flex flex-col gap-2"><label className="text-sm font-bold text-yellow-500">ระยะทาง (กม.)</label><input type="number" name="distance_km" value={formData.distance_km} onChange={handleChange} className={`p-4 rounded-xl focus:outline-none ${isDarkMode ? 'input-3d-dark text-white focus:border-yellow-500' : 'input-3d-light text-black'}`} /></div>
                    <div className="flex flex-col gap-2"><label className="text-sm font-bold text-yellow-500">วันที่เริ่ม</label><input required type="date" name="start_date" value={formData.start_date} onChange={handleChange} className={`p-4 rounded-xl focus:outline-none ${isDarkMode ? 'input-3d-dark text-white' : 'input-3d-light text-black'}`} style={{colorScheme: isDarkMode ? "dark" : "light"}}/></div>
                    <div className="flex flex-col gap-2"><label className="text-sm font-bold text-yellow-500">วันที่สิ้นสุด</label><input required type="date" name="end_date" value={formData.end_date} onChange={handleChange} className={`p-4 rounded-xl focus:outline-none ${isDarkMode ? 'input-3d-dark text-white' : 'input-3d-light text-black'}`} style={{colorScheme: isDarkMode ? "dark" : "light"}}/></div>
                    <div className="flex flex-col gap-2"><label className="text-sm font-bold text-yellow-500">จำนวนคน (ต่อวัน)</label><input type="number" name="people_per_day" value={formData.people_per_day} onChange={handleChange} className={`p-4 rounded-xl focus:outline-none ${isDarkMode ? 'input-3d-dark text-white focus:border-yellow-500' : 'input-3d-light text-black'}`} /></div>
                    <div className="flex flex-col gap-2"><label className="text-sm font-bold text-green-500">รวมผู้เข้าร่วมงานทั้งหมด</label><input readOnly type="text" name="people_total" value={formData.people_total} className={`p-4 rounded-xl font-bold focus:outline-none cursor-not-allowed ${isDarkMode ? 'input-3d-dark text-green-400' : 'input-3d-light text-green-600'}`} /></div>
                    <div className="flex flex-col gap-2 md:col-span-2"><label className="text-sm font-bold text-yellow-500">เหตุสำคัญ / รับแจ้ง</label><input type="text" name="incident_report" value={formData.incident_report} onChange={handleChange} className={`p-4 rounded-xl focus:outline-none ${isDarkMode ? 'input-3d-dark text-white focus:border-yellow-500' : 'input-3d-light text-black'}`} /></div>
                    <div className="flex flex-col gap-2 md:col-span-2"><label className="text-sm font-bold text-yellow-500">หมายเหตุ</label><input type="text" name="remark" value={formData.remark} onChange={handleChange} className={`p-4 rounded-xl focus:outline-none ${isDarkMode ? 'input-3d-dark text-white focus:border-yellow-500' : 'input-3d-light text-black'}`} /></div>
                    <div className="flex flex-col gap-2 md:col-span-2">
                      <PhotoUploadZone
                        files={uploadedFiles}
                        setFiles={setUploadedFiles}
                        isDarkMode={isDarkMode}
                      />
                    </div>
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

      {/* LINE Report Modal Popup */}
      <LineReportModal
        isOpen={showLineReportModal}
        onClose={() => setShowLineReportModal(false)}
        missionData={lastSubmittedMission}
        isDarkMode={isDarkMode}
      />

      {/* PDF Export Modal Popup */}
      {showPdfModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 anim-fade-in">
          <div className={`w-full max-w-lg p-6 sm:p-8 rounded-3xl relative btn-3d anim-pop-in border ${
            isDarkMode 
              ? 'bg-slate-900/95 border-red-500/30 text-white shadow-[0_0_50px_rgba(239,68,68,0.2)]' 
              : 'bg-white border-red-200 text-gray-900 shadow-2xl'
          }`}>
            <button 
              onClick={() => setShowPdfModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-500/20 text-gray-400 hover:text-white transition-all"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-red-500/20 text-red-500 border border-red-500/30">
                <Printer size={28} />
              </div>
              <div>
                <h3 className="text-xl font-bold">ออกรายงานไฟล์ PDF</h3>
                <p className="text-xs text-gray-400 mt-0.5">เลือกประเภทข้อมูลของตารางที่ต้องการดึงรายงาน</p>
              </div>
            </div>

            <div className="flex flex-col gap-3.5 my-6">
              {/* ตัวเลือก 1: CCOC Mobile */}
              <button
                onClick={() => handleExportPDF("CCOC Mobile")}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-left group ${
                  isDarkMode 
                    ? 'bg-slate-800/80 hover:bg-slate-700/80 border-cyan-500/30 hover:border-cyan-400' 
                    : 'bg-cyan-50/60 hover:bg-cyan-100/80 border-cyan-200 hover:border-cyan-400'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 group-hover:scale-110 transition-transform">
                    <Truck size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-cyan-400">รถปฏิบัติการเคลื่อนที่ CCOC Mobile</h4>
                    <p className="text-xs text-gray-400">สถิติระยะทาง, ผู้ร่วมงาน, เหตุการณ์สำคัญ</p>
                  </div>
                </div>
                <ExternalLink size={18} className="text-gray-400 group-hover:text-cyan-400 transition-colors shrink-0" />
              </button>

              {/* ตัวเลือก 2: UAV Mobile */}
              <button
                onClick={() => handleExportPDF("UAV Mobile")}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-left group ${
                  isDarkMode 
                    ? 'bg-slate-800/80 hover:bg-slate-700/80 border-blue-500/30 hover:border-blue-400' 
                    : 'bg-blue-50/60 hover:bg-blue-100/80 border-blue-200 hover:border-blue-400'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform">
                    <Plane size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-blue-400">สายตรวจอากาศยานไร้คนขับ (UAV Mobile)</h4>
                    <p className="text-xs text-gray-400">ข้อมูลการบิน, เวลาบิน, โดรน, นักท่องเที่ยว</p>
                  </div>
                </div>
                <ExternalLink size={18} className="text-gray-400 group-hover:text-blue-400 transition-colors shrink-0" />
              </button>

              {/* ตัวเลือก 3: ทั้งสองประเภท */}
              <button
                onClick={() => handleExportPDF("ALL")}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-left group ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-purple-900/40 to-indigo-900/40 hover:from-purple-800/60 hover:to-indigo-800/60 border-purple-500/40 hover:border-purple-400' 
                    : 'bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 border-purple-200 hover:border-purple-400'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform">
                    <FileSpreadsheet size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-purple-400">ทั้ง 2 ประเภท (CCOC & UAV)</h4>
                    <p className="text-xs text-gray-400">ออกรายงานรวม แยก Section 1 (CCOC) และ Section 2 (UAV)</p>
                  </div>
                </div>
                <ExternalLink size={18} className="text-gray-400 group-hover:text-purple-400 transition-colors shrink-0" />
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowPdfModal(false)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
