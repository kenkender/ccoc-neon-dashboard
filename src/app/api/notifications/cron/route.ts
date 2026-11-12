import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  sendWebPushNotification,
  analyzeStationInactivity,
  buildNotificationForUnit,
} from "@/lib/webPush";
import {
  broadcastToAllLineGroups,
  buildDaily1700FlexMessage,
  buildStatusFlexMessage,
} from "@/lib/lineBot";
import { SYSTEM_USERS } from "@/app/data/users";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function executeNotificationBroadcast(mode: "daily_1700" | "inactivity_only" = "daily_1700") {
  const [missionsRes, usersRes, subsRes] = await Promise.all([
    supabase.from("missions").select("*").order("created_at", { ascending: false }),
    supabase.from("users").select("*"),
    supabase.from("login_logs").select("*").eq("role", "push_sub"),
  ]);

  const missions = missionsRes.data || [];
  const users = usersRes.data && usersRes.data.length > 0 ? usersRes.data : SYSTEM_USERS;
  const rawSubs = subsRes.data || [];

  const statuses = analyzeStationInactivity(missions, users);
  const inactiveUnits = statuses.filter((s) => s.isInactive5Days);

  // 🔔 ส่งข้อความแจ้งเตือนเข้ากลุ่มไลน์อัตโนมัติเป็นอันดับแรก (ใช้เวลา < 1 วินาที เพื่อไม่ให้ Web Push มาขวาง)
  let lineSentGroups = 0;
  try {
    const inactiveCcoc = inactiveUnits.filter((u) => u.username.startsWith("stc"));
    const inactiveUav = inactiveUnits.filter((u) => u.username.startsWith("uav"));

    if (mode === "inactivity_only") {
      lineSentGroups = await broadcastToAllLineGroups([
        buildStatusFlexMessage(inactiveCcoc, inactiveUav, missions.length),
      ]);
    } else {
      const messagesToSend: any[] = [
        buildDaily1700FlexMessage(inactiveCcoc.length, inactiveUav.length),
      ];
      // หากมีหน่วยขาดส่งเกิน 5 วัน ให้แนบการ์ดสรุปรายชื่อหน่วยที่ขาดส่งไปพร้อมกับแจ้งเตือน 17:00 น. ด้วย
      if (inactiveCcoc.length > 0 || inactiveUav.length > 0) {
        messagesToSend.push(
          buildStatusFlexMessage(inactiveCcoc, inactiveUav, missions.length)
        );
      }
      lineSentGroups = await broadcastToAllLineGroups(messagesToSend);
    }
  } catch (err) {
    console.warn("⚠️ LINE group broadcast warning in cron:", err);
  }

  let sentCount = 0;
  let failedCount = 0;
  const expiredIds: number[] = [];

  // ส่ง Web Push แบบ Parallel (Promise.allSettled) แทนการวนลูปทีละเครื่อง เพื่อไม่ให้ Timeout
  const pushTasks = rawSubs.map(async (row) => {
    let sub: any = null;
    try {
      sub = JSON.parse(row.affiliation);
    } catch {
      if (row.id) expiredIds.push(row.id);
      return;
    }

    if (!sub || !sub.endpoint || !sub.keys) {
      if (row.id) expiredIds.push(row.id);
      return;
    }

    const uname = String(row.username || "stc01").trim().toLowerCase();
    const unitStatus = statuses.find((s) => s.username === uname);

    // ถ้าเลือกโหมดส่งเฉพาะหน่วยที่ไม่มีภารกิจเคลื่อนไหว 5 วัน
    if (mode === "inactivity_only" && uname !== "admin" && unitStatus && !unitStatus.isInactive5Days) {
      return;
    }

    const payload = buildNotificationForUnit(uname, statuses, "daily_1700");
    const result = await sendWebPushNotification(sub, payload);

    if (result.ok) {
      sentCount++;
    } else {
      failedCount++;
      if (result.expired && row.id) {
        expiredIds.push(row.id);
      }
    }
  });

  await Promise.allSettled(pushTasks);

  if (expiredIds.length > 0) {
    await supabase.from("login_logs").delete().in("id", expiredIds);
  }

  return {
    status: "success",
    executedAt: new Date().toLocaleString("sv-SE", { timeZone: "Asia/Bangkok" }),
    mode,
    totalSubscribedDevices: rawSubs.length,
    sentCount,
    failedCount,
    cleanedExpiredCount: expiredIds.length,
    lineGroupsNotified: lineSentGroups,
    totalUnitsChecked: statuses.length,
    inactiveUnitsCount: inactiveUnits.length,
    inactiveUnits: inactiveUnits.map((u) => ({
      username: u.username,
      short_name: u.short_name,
      unit_name: u.unit_name,
      affiliation: u.affiliation,
      vehicle_type: u.vehicle_type,
      lastMissionDate: u.lastMissionDate,
      daysInactive: u.daysInactive,
    })),
  };
}

// GET: สำหรับ Vercel Cron เรียกทำงานอัตโนมัติทุกวัน เวลา 17:00 น. (10:00 UTC)
export async function GET() {
  try {
    const result = await executeNotificationBroadcast("daily_1700");
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("⚠️ Cron notification error:", error);
    return NextResponse.json({ status: "error", message: error?.message }, { status: 500 });
  }
}

// POST: สำหรับแอดมินกดปุ่มสั่งแจ้งเตือนทุกหน่วย หรือเฉพาะหน่วยที่ขาดส่งเกิน 5 วัน ทันทีจากหน้าเว็บ
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const mode = body.mode === "inactivity_only" ? "inactivity_only" : "daily_1700";
    const result = await executeNotificationBroadcast(mode);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("⚠️ Manual notification broadcast error:", error);
    return NextResponse.json({ status: "error", message: error?.message }, { status: 500 });
  }
}

