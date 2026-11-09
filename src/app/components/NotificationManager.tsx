"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Bell,
  BellRing,
  BellOff,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  X,
  Smartphone,
  ShieldAlert,
  RefreshCw,
} from "lucide-react";
import {
  SYSTEM_USERS,
  VEHICLE_AFFILIATIONS,
  VEHICLE_UNIT_MAP,
  VEHICLE_NAMES,
} from "../data/users";
import { usePopup } from "./PopupContext";

const DEFAULT_VAPID_PUBLIC_KEY =
  "BF-QVb6iAKlUzHblAuc4gRRuoJOLLn_smZuAjBl_9g3Pk3jIJxnQYBYJX0fbjcZeMPDQvAtcLrCO5s7ZX8CQkIk";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function parseMissionDateMs(dateVal: any): number {
  if (!dateVal) return 0;
  const s = String(dateVal).trim();
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    let yr = parseInt(isoMatch[1], 10);
    if (yr > 2400) yr -= 543;
    return new Date(`${yr}-${isoMatch[2]}-${isoMatch[3]}T00:00:00+07:00`).getTime();
  }
  const dt = new Date(s);
  if (!isNaN(dt.getTime())) {
    if (dt.getFullYear() > 2400) dt.setFullYear(dt.getFullYear() - 543);
    return dt.getTime();
  }
  return 0;
}

export interface UnitActivityInfo {
  username: string;
  unit_name: string;
  short_name: string;
  affiliation: string;
  vehicle_type: string;
  lastMissionDate: string | null;
  lastMissionName: string | null;
  daysInactive: number | null;
  isInactive5Days: boolean;
}

interface NotificationManagerProps {
  currentUser: any;
  missions: any[];
  usersList: any[];
  isDarkMode: boolean;
  compact?: boolean;
  fullWidthSidebar?: boolean;
  enableScheduler?: boolean;
}

export default function NotificationManager({
  currentUser,
  missions,
  usersList,
  isDarkMode,
  compact = false,
  fullWidthSidebar = false,
  enableScheduler = true,
}: NotificationManagerProps) {
  const { showNotification } = usePopup();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [activeTab, setActiveTab] = useState<"CCOC" | "UAV">("CCOC");
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  const userKey = useMemo(() => {
    const raw = currentUser?.vehicle_id || currentUser?.username || "stc01";
    return String(raw).trim().toLowerCase();
  }, [currentUser]);

  // คำนวณความเคลื่อนไหว 5 วันของทุกหน่วย
  const unitStatuses = useMemo<UnitActivityInfo[]>(() => {
    const nowBangkokStr = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Bangkok" });
    const todayMs = new Date(`${nowBangkokStr}T00:00:00+07:00`).getTime();

    const sourceUsers = usersList && usersList.length > 0 ? usersList : SYSTEM_USERS;
    const seen = new Set<string>();
    const list: UnitActivityInfo[] = [];

    for (const u of sourceUsers) {
      const uname = String(u.username || "").trim().toLowerCase();
      if (!uname || seen.has(uname)) continue;
      seen.add(uname);

      const unitMissions = (missions || []).filter(
        (m: any) => String(m.vehicle_id || "").trim().toLowerCase() === uname
      );

      let latestMs = 0;
      let latestDateStr: string | null = null;
      let latestName: string | null = null;

      for (const m of unitMissions) {
        const ms = parseMissionDateMs(m.start_date || m.timestamp);
        if (ms > latestMs) {
          latestMs = ms;
          latestDateStr = String(m.start_date || m.timestamp || "")
            .split("T")[0]
            .split(" ")[0];
          latestName = m.mission_name || null;
        }
      }

      let daysInactive: number | null = null;
      if (latestMs > 0) {
        const diff = Math.floor((todayMs - latestMs) / (1000 * 60 * 60 * 24));
        daysInactive = Math.max(0, diff);
      }

      const isInactive5Days = daysInactive === null || daysInactive >= 5;

      list.push({
        username: uname,
        unit_name: u.unit_name || VEHICLE_UNIT_MAP[uname] || uname,
        short_name: VEHICLE_NAMES[uname] || uname,
        affiliation: u.affiliation || VEHICLE_AFFILIATIONS[uname] || "บช.ทท.",
        vehicle_type: u.vehicle_type || (uname.startsWith("uav") ? "UAV Mobile" : "CCOC Mobile"),
        lastMissionDate: latestDateStr,
        lastMissionName: latestName,
        daysInactive,
        isInactive5Days,
      });
    }

    return list;
  }, [missions, usersList]);

  const myUnitStatus = useMemo(() => {
    return unitStatuses.find((u) => u.username === userKey) || null;
  }, [unitStatuses, userKey]);

  const inactiveCcocUnits = useMemo(() => {
    return unitStatuses.filter(
      (u) => u.isInactive5Days && u.username.startsWith("stc")
    );
  }, [unitStatuses]);

  const inactiveUavUnits = useMemo(() => {
    return unitStatuses.filter(
      (u) => u.isInactive5Days && u.username.startsWith("uav")
    );
  }, [unitStatuses]);

  // ฟังก์ชันส่งแจ้งเตือนขึ้นแถบ Notification Bar ของอุปกรณ์ (OS Notification Bar)
  const triggerOsNotification = useCallback(
    async (title: string, body: string, tag = "ccoc-reminder", requireInteraction = false) => {
      if (typeof window === "undefined" || !("Notification" in window)) return false;
      if (Notification.permission !== "granted") return false;

      try {
        if (swRegistration && swRegistration.active) {
          swRegistration.active.postMessage({
            type: "SHOW_LOCAL_NOTIFICATION",
            payload: {
              title,
              body,
              tag,
              url: "/",
              requireInteraction,
            },
          });
          return true;
        }
        if ("serviceWorker" in navigator) {
          const reg = await navigator.serviceWorker.ready;
          if (reg && reg.showNotification) {
            await reg.showNotification(title, {
              body,
              icon: "/stc_vehicle_front.png",
              badge: "/stc_vehicle_front.png",
              tag,
              requireInteraction,
            });
            return true;
          }
        }
        new Notification(title, {
          body,
          icon: "/stc_vehicle_front.png",
          tag,
        });
        return true;
      } catch (err) {
        console.warn("⚠️ OS notification fallback error:", err);
        return false;
      }
    },
    [swRegistration]
  );

  // ลงทะเบียน Service Worker และผูก Web Push Subscription
  const subscribeToWebPush = useCallback(
    async (reg: ServiceWorkerRegistration, runTestPush = false) => {
      try {
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(DEFAULT_VAPID_PUBLIC_KEY) as unknown as BufferSource,
        });

        const res = await fetch("/api/notifications/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: runTestPush ? "test" : "subscribe",
            username: currentUser?.role === "admin" ? "admin" : userKey,
            subscription: sub.toJSON(),
          }),
        });

        if (res.ok) {
          setIsSubscribed(true);
          return true;
        }
      } catch (err) {
        console.warn("⚠️ WebPush subscription warning:", err);
      }
      return false;
    },
    [currentUser?.role, userKey]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(async (reg) => {
          setSwRegistration(reg);
          const existingSub = await reg.pushManager.getSubscription();
          if (existingSub) {
            setIsSubscribed(true);
            // ซิงก์คู่กับ username ปัจจุบันใน Supabase
            subscribeToWebPush(reg, false);
          } else if ("Notification" in window && Notification.permission === "granted") {
            subscribeToWebPush(reg, false);
          }
        })
        .catch((err) => console.warn("⚠️ SW registration error:", err));
    }
  }, [subscribeToWebPush]);

  // ⏰ ระบบตรวจสอบอัตโนมัติ:
  // 1) เตือนทุกวันเวลา 17:00 น. (1 ครั้งต่อวัน)
  // 2) เตือนหากหน่วยไม่มีภารกิจเคลื่อนไหวภายใน 5 วัน (1 ครั้งต่อวัน)
  useEffect(() => {
    if (!enableScheduler) return;
    if (typeof window === "undefined" || !currentUser || !missions || missions.length === 0) return;
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const checkScheduleAndInactivity = () => {
      const now = new Date();
      const bangkokDateStr = now.toLocaleDateString("sv-SE", { timeZone: "Asia/Bangkok" });
      const bangkokTimeStr = now.toLocaleTimeString("en-GB", {
        timeZone: "Asia/Bangkok",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      const [hh] = bangkokTimeStr.split(":").map(Number);

      const uKey = currentUser?.role === "admin" ? "admin" : userKey;

      // 1. ตรวจสอบหน่วยไม่มีภารกิจเคลื่อนไหวภายใน 5 วัน (แจ้งเตือน 1 ครั้งต่อวันเมื่อเปิดระบบ)
      const inactiveStorageKey = `ccoc_noti_inactive5d_${bangkokDateStr}_${uKey}`;
      if (!localStorage.getItem(inactiveStorageKey)) {
        if (currentUser?.role === "admin") {
          const totalInactive = inactiveCcocUnits.length + inactiveUavUnits.length;
          if (totalInactive > 0) {
            triggerOsNotification(
              `⚠️ พบ ${totalInactive} หน่วยไม่มีภารกิจเคลื่อนไหวเกิน 5 วัน`,
              `รถ CCOC Mobile ${inactiveCcocUnits.length} หน่วย และ UAV ${inactiveUavUnits.length} หน่วย ยังไม่มีการบันทึกภารกิจในรอบ 5 วันล่าสุด`,
              `ccoc-admin-inactive5d-${bangkokDateStr}`,
              false
            );
            localStorage.setItem(inactiveStorageKey, "1");
          }
        } else if (myUnitStatus && myUnitStatus.isInactive5Days) {
          const daysMsg =
            myUnitStatus.daysInactive === null
              ? "ยังไม่มีประวัติการบันทึกภารกิจ"
              : `ไม่มีภารกิจเคลื่อนไหวมาแล้ว ${myUnitStatus.daysInactive} วัน`;
          triggerOsNotification(
            `⚠️ แจ้งเตือนหน่วย ${myUnitStatus.short_name} (เกิน 5 วัน)`,
            `${myUnitStatus.unit_name} ${daysMsg} — หากออกภารกิจ อย่าลืมลงภารกิจในระบบนะครับ!`,
            `ccoc-unit-inactive5d-${bangkokDateStr}`,
            true
          );
          localStorage.setItem(inactiveStorageKey, "1");
        }
      }

      // 2. แจ้งเตือนประจำวัน เวลา 17:00 น. (ทำงานเมื่อเวลาอยู่ในช่วง 17:00 - 17:59 น. วันละ 1 ครั้ง)
      if (hh === 17) {
        const dailyStorageKey = `ccoc_noti_1700_${bangkokDateStr}_${uKey}`;
        if (!localStorage.getItem(dailyStorageKey)) {
          if (myUnitStatus && myUnitStatus.isInactive5Days && currentUser?.role !== "admin") {
            triggerOsNotification(
              `🔔 แจ้งเตือน 17:00 น. — หน่วยของคุณไม่ได้ลงภารกิจเกิน 5 วัน`,
              `วันนี้ (${myUnitStatus.short_name}) ออกปฏิบัติภารกิจหรือไม่? อย่าลืมบันทึกภารกิจลงระบบนะครับ`,
              `ccoc-daily-1700-${bangkokDateStr}`,
              true
            );
          } else {
            triggerOsNotification(
              `🔔 เตือนความจำประจำวัน (17:00 น.)`,
              `วันนี้ออกปฏิบัติภารกิจหรือไม่? ถ้าออกภารกิจ อย่าลืมลงบันทึกภารกิจในระบบนะครับ`,
              `ccoc-daily-1700-${bangkokDateStr}`,
              false
            );
          }
          localStorage.setItem(dailyStorageKey, "1");
        }
      }
    };

    checkScheduleAndInactivity();
    const timer = setInterval(checkScheduleAndInactivity, 30000);
    return () => clearInterval(timer);
  }, [
    enableScheduler,
    currentUser,
    missions,
    userKey,
    myUnitStatus,
    inactiveCcocUnits.length,
    inactiveUavUnits.length,
    triggerOsNotification,
  ]);

  const handleEnableNotifications = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      showNotification({
        type: "warning",
        title: "อุปกรณ์ไม่รองรับ Notification มาตรฐาน",
        message: "หากใช้งานบน iPhone/iPad กรุณากดปุ่ม Share -> Add to Home Screen (เพิ่มไปยังหน้าจอโฮม) ก่อนเปิดการแจ้งเตือนครับ",
      });
      return;
    }

    setIsSubscribing(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        let reg = swRegistration;
        if (!reg && "serviceWorker" in navigator) {
          reg = await navigator.serviceWorker.register("/sw.js");
          setSwRegistration(reg);
        }
        if (reg) {
          await subscribeToWebPush(reg, true);
        }
        await triggerOsNotification(
          "✅ เปิดระบบแจ้งเตือนภารกิจสำเร็จ!",
          "ระบบจะแจ้งเตือนทุกวันเวลา 17:00 น. และแจ้งเตือนเมื่อหน่วยไม่มีภารกิจเคลื่อนไหวเกิน 5 วันครับ",
          "ccoc-enable-success"
        );
        showNotification({
          type: "success",
          title: "เปิดรับการแจ้งเตือนที่แถบ Noti สำเร็จ!",
          message: "ระบบได้ลงทะเบียนอุปกรณ์ของคุณแล้ว จะมีการแจ้งเตือนเวลา 17:00 น. ทุกวัน และเตือนเมื่อไม่มีภารกิจเกิน 5 วัน",
        });
      } else {
        showNotification({
          type: "warning",
          title: "ยังไม่ได้รับอนุญาตให้แสดงแจ้งเตือน",
          message: "กรุณากดอนุญาต (Allow) การแจ้งเตือนที่แถบตั้งค่าของเบราว์เซอร์",
        });
      }
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleTestNotification = async () => {
    setIsTesting(true);
    try {
      if (permission !== "granted") {
        await handleEnableNotifications();
        return;
      }

      const isInactive = myUnitStatus?.isInactive5Days;
      const title = isInactive
        ? `⚠️ [ทดสอบ] แจ้งเตือนหน่วย ${myUnitStatus?.short_name || userKey} (เกิน 5 วัน)`
        : `🔔 [ทดสอบ] เตือนความจำประจำวัน 17:00 น.`;
      const body = isInactive
        ? `${myUnitStatus?.unit_name} ไม่มีภารกิจเคลื่อนไหวในระบบเกิน 5 วัน — ถ้าออกภารกิจ อย่าลืมลงภารกิจนะครับ!`
        : `ถ้าออกปฏิบัติภารกิจวันนี้ อย่าลืมบันทึกข้อมูลภารกิจลงในระบบ CCOC / UAV นะครับ`;

      await triggerOsNotification(title, body, `ccoc-test-${Date.now()}`);

      if (swRegistration) {
        await subscribeToWebPush(swRegistration, true);
      }

      showNotification({
        type: "info",
        title: "ส่งแจ้งเตือนทดสอบไปที่แถบ Noti แล้ว!",
        message: "โปรดสังเกตที่แถบ Notification บนหน้าจอมือถือหรือมุมขวาล่างของคอมพิวเตอร์",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleAdminBroadcast = async (mode: "daily_1700" | "inactivity_only") => {
    setIsBroadcasting(true);
    try {
      const res = await fetch("/api/notifications/cron", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        showNotification({
          type: "success",
          title: "ส่งแจ้งเตือน Push ไปยังอุปกรณ์สำเร็จ!",
          message: `ส่งแจ้งเตือนไปยังเครื่องที่ลงทะเบียนแล้ว ${data.sentCount} เครื่อง (พบหน่วยไม่มีภารกิจเกิน 5 วัน จำนวน ${data.inactiveUnitsCount} หน่วย)`,
        });
      } else {
        showNotification({
          type: "error",
          title: "ส่งแจ้งเตือนไม่สำเร็จ",
          message: data.message || "เกิดข้อผิดพลาดในการส่ง Web Push",
        });
      }
    } catch {
      showNotification({
        type: "error",
        title: "ส่งแจ้งเตือนไม่สำเร็จ",
        message: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์แจ้งเตือนได้",
      });
    } finally {
      setIsBroadcasting(false);
    }
  };

  const badgeCount =
    currentUser?.role === "admin"
      ? inactiveCcocUnits.length
      : myUnitStatus?.isInactive5Days
      ? 1
      : 0;

  return (
    <>
      {/* ปุ่มกระดิ่งบน Header หรือ Sidebar */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        title="ตั้งค่าการแจ้งเตือนภารกิจ (17:00 น. / เตือนขาดส่ง 5 วัน)"
        className={`relative flex items-center rounded-xl btn-3d transition-all ${
          fullWidthSidebar
            ? "w-full justify-between p-4 font-bold"
            : compact
            ? "p-2 justify-center"
            : "px-3 py-3 gap-2 justify-center"
        } ${
          isDarkMode
            ? "btn-menu-dark text-amber-400 hover:text-amber-300"
            : "btn-menu-light text-amber-600 hover:text-amber-700"
        }`}
      >
        <div className="flex items-center gap-3">
          {permission === "granted" ? (
            <BellRing size={compact ? 18 : 20} className={badgeCount > 0 ? "animate-bounce" : ""} />
          ) : (
            <Bell size={compact ? 18 : 20} />
          )}
          {fullWidthSidebar ? (
            <span>แจ้งเตือนภารกิจ (17:00)</span>
          ) : (
            !compact && <span className="text-xs font-bold hidden xl:inline">แจ้งเตือน</span>
          )}
        </div>

        {badgeCount > 0 ? (
          <span
            className={`${
              fullWidthSidebar ? "" : "absolute -top-1.5 -right-1.5"
            } min-w-[20px] h-[20px] px-1.5 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center shadow-[0_0_8px_rgba(225,29,72,0.8)] border border-white/20`}
          >
            {badgeCount}
          </span>
        ) : permission === "granted" ? (
          <span
            className={`${
              fullWidthSidebar ? "" : "absolute -top-1 -right-1"
            } w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]`}
          />
        ) : null}
      </button>

      {/* Modal ศูนย์จัดการแจ้งเตือน — ใช้ createPortal เพื่อไม่ให้ติดกรอบ backdrop-blur ของ MobileHeader */}
      {isOpen &&
        mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-2.5 sm:p-6 bg-black/80 backdrop-blur-md anim-fade-in"
            onClick={() => setIsOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-[calc(100vw-20px)] sm:max-w-2xl max-h-[84dvh] sm:max-h-[88vh] flex flex-col rounded-2xl sm:rounded-3xl border shadow-2xl overflow-hidden ${
                isDarkMode
                  ? "bg-slate-950/95 border-cyan-500/30 text-white"
                  : "bg-white border-slate-300 text-slate-900"
              }`}
            >
              {/* Header (Sticky ด้านบนสุด ไม่โดนตัดขอบ) */}
              <div
                className={`shrink-0 flex items-start justify-between gap-2.5 p-3.5 sm:p-5 border-b ${
                  isDarkMode ? "border-white/10 bg-slate-950/95" : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                    <BellRing size={20} className="sm:w-6 sm:h-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-xl font-black tracking-wide leading-snug">
                      ระบบแจ้งเตือนภารกิจ (Notification Bar)
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 leading-relaxed">
                      เตือนอัตโนมัติทุกวัน 17:00 น. และเตือนเมื่อหน่วยไม่มีภารกิจภายใน 5 วัน
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="ปิดหน้าต่าง"
                  className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white active:scale-95 transition-all shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3 sm:space-y-4 custom-scrollbar">
                {/* กล่องที่ 1: สถานะการเปิดแจ้งเตือนบนอุปกรณ์นี้ */}
                <div
                  className={`p-3 sm:p-4 rounded-2xl border ${
                    permission === "granted"
                      ? "bg-emerald-950/30 border-emerald-500/30"
                      : "bg-amber-950/30 border-amber-500/40"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5 sm:gap-3">
                      {permission === "granted" ? (
                        <CheckCircle2 className="text-emerald-400 shrink-0 mt-0.5" size={20} />
                      ) : (
                        <BellOff className="text-amber-400 shrink-0 mt-0.5" size={20} />
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-xs sm:text-sm leading-snug">
                          สถานะแถบแจ้งเตือนบนอุปกรณ์นี้:{" "}
                          <span
                            className={
                              permission === "granted" ? "text-emerald-400" : "text-amber-400"
                            }
                          >
                            {permission === "granted"
                              ? "เปิดใช้งานแล้ว (พร้อมรับแจ้งเตือน 17:00 น.)"
                              : permission === "denied"
                              ? "ถูกปิดกั้นในเบราว์เซอร์"
                              : "ยังไม่ได้กดเปิดรับการแจ้งเตือน"}
                          </span>
                        </p>
                        <p className="text-[11px] sm:text-xs text-slate-400 mt-1 leading-relaxed">
                          • เตือนประจำวัน: <b>ทุกวัน เวลา 17:00 น. (1 ครั้ง/วัน)</b>
                          <br />• เตือนความเคลื่อนไหว: <b>เมื่อไม่มีภารกิจติดต่อกันครบ 5 วัน</b>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
                      {permission !== "granted" ? (
                        <button
                          type="button"
                          disabled={isSubscribing}
                          onClick={handleEnableNotifications}
                          className="w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
                        >
                          <Smartphone size={16} />
                          {isSubscribing ? "กำลังเปิด..." : "เปิดแจ้งเตือนบนเครื่องนี้"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={isTesting}
                          onClick={handleTestNotification}
                          className="w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl font-bold text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 active:scale-95 transition-all flex items-center gap-1.5"
                        >
                          <BellRing size={15} />
                          {isTesting ? "กำลังส่ง..." : "ทดสอบเด้งแถบ Noti ทันที"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* กล่องที่ 2: สถานะความเคลื่อนไหวของหน่วยผู้ใช้งานปัจจุบัน */}
                {myUnitStatus && (
                  <div
                    className={`p-3 sm:p-4 rounded-2xl border ${
                      myUnitStatus.isInactive5Days
                        ? "bg-rose-950/30 border-rose-500/40"
                        : "bg-slate-900/80 border-slate-800"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
                      <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                        <Clock size={14} className="shrink-0" />
                        <span>สถานะหน่วยของคุณ ({myUnitStatus.short_name})</span>
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0 ${
                          myUnitStatus.isInactive5Days
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        }`}
                      >
                        {myUnitStatus.isInactive5Days
                          ? "⚠️ ไม่มีภารกิจเกิน 5 วัน"
                          : "✅ มีการบันทึกภารกิจปกติ"}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-bold break-words">
                      {myUnitStatus.unit_name}
                    </p>
                    <p className="text-[11px] sm:text-xs text-slate-400 mt-1 leading-relaxed break-words">
                      {myUnitStatus.lastMissionDate
                        ? `ลงภารกิจล่าสุดเมื่อวันที่ ${myUnitStatus.lastMissionDate} (${myUnitStatus.daysInactive} วันที่ผ่านมา) — "${myUnitStatus.lastMissionName}"`
                        : "ยังไม่มีประวัติการบันทึกภารกิจในระบบ"}
                    </p>
                  </div>
                )}

                {/* กล่องที่ 3: รายชื่อหน่วยที่ไม่มีภารกิจเคลื่อนไหวภายใน 5 วัน */}
                <div className="p-3 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5 sm:space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="text-amber-400 shrink-0" size={17} />
                      <h4 className="font-bold text-xs sm:text-sm">
                        หน่วยที่ไม่มีภารกิจเคลื่อนไหวภายใน 5 วันล่าสุด
                      </h4>
                    </div>

                    {/* ปุ่มสลับดู CCOC / UAV */}
                    <div className="grid grid-cols-2 sm:flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-[11px] sm:text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setActiveTab("CCOC")}
                        className={`px-2.5 py-1.5 sm:px-3 sm:py-1 rounded-lg transition-all text-center ${
                          activeTab === "CCOC"
                            ? "bg-fuchsia-600 text-white"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        CCOC Mobile ({inactiveCcocUnits.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("UAV")}
                        className={`px-2.5 py-1.5 sm:px-3 sm:py-1 rounded-lg transition-all text-center ${
                          activeTab === "UAV"
                            ? "bg-cyan-600 text-white"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        UAV Mobile ({inactiveUavUnits.length})
                      </button>
                    </div>
                  </div>

                  <div className="max-h-44 sm:max-h-56 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {(activeTab === "CCOC" ? inactiveCcocUnits : inactiveUavUnits).map((u) => (
                      <div
                        key={u.username}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/90 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-200 truncate text-[11px] sm:text-xs">
                            <span className="text-amber-400 font-mono mr-1.5">[{u.username}]</span>
                            {u.unit_name}
                          </p>
                          <p className="text-[10px] sm:text-[11px] text-slate-400 truncate mt-0.5">
                            สังกัด: {u.affiliation} |{" "}
                            {u.lastMissionDate
                              ? `ล่าสุด: ${u.lastMissionDate}`
                              : "ยังไม่เคยบันทึกภารกิจ"}
                          </p>
                        </div>
                        <span className="px-2 py-1 rounded-lg bg-rose-950 text-rose-300 border border-rose-800 font-mono font-bold text-[10px] sm:text-[11px] shrink-0 whitespace-nowrap">
                          {u.daysInactive === null ? "ไม่มีข้อมูล" : `ขาด ${u.daysInactive} วัน`}
                        </span>
                      </div>
                    ))}

                    {(activeTab === "CCOC" ? inactiveCcocUnits : inactiveUavUnits).length === 0 && (
                      <div className="text-center py-6 text-emerald-400 text-xs font-bold">
                        🎉 ทุกหน่วยมีการบันทึกภารกิจภายใน 5 วันล่าสุดครบถ้วน!
                      </div>
                    )}
                  </div>

                  {/* ปุ่มสั่งยิง Push Notification ทันทีสำหรับ Admin */}
                  {currentUser?.role === "admin" && (
                    <div className="pt-2.5 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400">
                        สำหรับผู้ดูแลระบบ (บช.ทท.): ส่งแจ้งเตือน Push ไปยังทุกเครื่องทันที
                      </span>
                      <div className="grid grid-cols-1 sm:flex gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          disabled={isBroadcasting}
                          onClick={() => handleAdminBroadcast("inactivity_only")}
                          className="justify-center px-3 py-2 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 flex items-center gap-1.5"
                        >
                          <AlertTriangle size={14} />
                          {isBroadcasting ? "กำลังส่ง..." : "เตือนเฉพาะหน่วยเกิน 5 วัน"}
                        </button>
                        <button
                          type="button"
                          disabled={isBroadcasting}
                          onClick={() => handleAdminBroadcast("daily_1700")}
                          className="justify-center px-3 py-2 rounded-xl text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 flex items-center gap-1.5"
                        >
                          {isBroadcasting ? (
                            <RefreshCw size={14} className="animate-spin" />
                          ) : (
                            <Send size={14} />
                          )}
                          ส่งแจ้งเตือนทุกเครื่องทันที
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
