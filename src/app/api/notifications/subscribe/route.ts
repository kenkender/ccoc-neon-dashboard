import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  VAPID_PUBLIC_KEY,
  sendWebPushNotification,
  analyzeStationInactivity,
  buildNotificationForUnit,
} from "@/lib/webPush";
import { SYSTEM_USERS } from "@/app/data/users";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data: subs } = await supabase
      .from("login_logs")
      .select("id, username, timestamp")
      .eq("role", "push_sub");

    return NextResponse.json({
      status: "success",
      publicKey: VAPID_PUBLIC_KEY,
      subscribedDevicesCount: subs?.length || 0,
    });
  } catch (err: any) {
    return NextResponse.json({
      status: "success",
      publicKey: VAPID_PUBLIC_KEY,
      subscribedDevicesCount: 0,
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, username, subscription, customTitle, customBody } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { status: "error", message: "Invalid push subscription" },
        { status: 400 }
      );
    }

    const uname = String(username || "stc01").trim().toLowerCase();
    const subJson = JSON.stringify(subscription);

    // 1. เช็คว่ามี endpoint นี้บันทึกไว้หรือยัง เพื่อป้องกันการซ้ำซ้อน
    const { data: existing } = await supabase
      .from("login_logs")
      .select("id, affiliation")
      .eq("role", "push_sub")
      .eq("username", uname);

    const duplicateIds = (existing || [])
      .filter((row: any) => {
        try {
          const parsed = JSON.parse(row.affiliation);
          return parsed.endpoint === subscription.endpoint;
        } catch {
          return false;
        }
      })
      .map((row: any) => row.id);

    if (duplicateIds.length > 0) {
      await supabase.from("login_logs").delete().in("id", duplicateIds);
    }

    await supabase.from("login_logs").insert([
      {
        username: uname,
        affiliation: subJson,
        role: "push_sub",
        timestamp: new Date().toLocaleString("sv-SE", { timeZone: "Asia/Bangkok" }),
      },
    ]);

    // 2. หากเป็นการกดปุ่ม "ทดสอบส่งแจ้งเตือน" ให้ยิง Web Push กลับไปยังเครื่องทันที
    if (action === "test") {
      const [missionsRes, usersRes] = await Promise.all([
        supabase.from("missions").select("*"),
        supabase.from("users").select("*"),
      ]);
      const statuses = analyzeStationInactivity(
        missionsRes.data || [],
        usersRes.data && usersRes.data.length > 0 ? usersRes.data : SYSTEM_USERS
      );
      const defaultPayload = buildNotificationForUnit(uname, statuses, "daily_1700");

      const pushRes = await sendWebPushNotification(subscription, {
        title: customTitle || defaultPayload.title,
        body: customBody || defaultPayload.body,
        tag: "ccoc-test-push",
        url: "/",
        requireInteraction: false,
      });

      return NextResponse.json({
        status: "success",
        message: "Subscribed and test push sent",
        pushResult: pushRes,
      });
    }

    return NextResponse.json({
      status: "success",
      message: "Push subscription saved",
    });
  } catch (error: any) {
    console.error("⚠️ Push subscribe error:", error);
    return NextResponse.json(
      { status: "error", message: error?.message || "Failed to subscribe" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { username, endpoint } = body;
    const uname = String(username || "").trim().toLowerCase();

    const { data: existing } = await supabase
      .from("login_logs")
      .select("id, affiliation")
      .eq("role", "push_sub")
      .eq("username", uname);

    const idsToDelete = (existing || [])
      .filter((row: any) => {
        if (!endpoint) return true;
        try {
          const parsed = JSON.parse(row.affiliation);
          return parsed.endpoint === endpoint;
        } catch {
          return false;
        }
      })
      .map((row: any) => row.id);

    if (idsToDelete.length > 0) {
      await supabase.from("login_logs").delete().in("id", idsToDelete);
    }

    return NextResponse.json({ status: "success", deletedCount: idsToDelete.length });
  } catch (error: any) {
    return NextResponse.json({ status: "error", message: error?.message }, { status: 500 });
  }
}

