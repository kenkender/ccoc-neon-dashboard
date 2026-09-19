import { NextResponse } from "next/server";
import { SYSTEM_USERS } from "@/app/data/users";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwsLqrtjt9fU7P5XOERxEqrM5QAW8MKPrsPw_F5A40LfrvtLYgkY3UnKEDH3db6C8HK/exec";

// ── GET: ดึงข้อมูลจาก Supabase (ถ้าล้มเหลวจะ fallback ไป GAS) ───────────────
export async function GET(request: Request) {
  try {
    // 1. Query Supabase Tables
    const [missionsRes, usersRes, logsRes] = await Promise.all([
      supabase.from("missions").select("*").order("created_at", { ascending: false }),
      supabase.from("users").select("*"),
      supabase.from("login_logs").select("*").order("timestamp", { ascending: false }).limit(100),
    ]);

    const hasMissions = missionsRes.data && missionsRes.data.length > 0;
    const hasUsers = usersRes.data && usersRes.data.length > 0;

    // ถ้ามีข้อมูลใน Supabase ให้ส่งตอบกลับทันที (ความเร็วระดับ < 100ms)
    if (hasMissions || hasUsers) {
      return NextResponse.json({
        status: "success",
        source: "supabase",
        data: {
          missions: missionsRes.data || [],
          users: (usersRes.data && usersRes.data.length > 0) ? usersRes.data : SYSTEM_USERS,
          login_logs: logsRes.data || [],
        },
      });
    }

    // 2. ถ้า Supabase ยังว่างเปล่า ให้ fallback ไปดึงจาก GAS
    console.log("ℹ️ Supabase empty, fetching initial data from Google Apps Script...");
    const gasRes = await fetch(GOOGLE_SCRIPT_URL, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    const text = await gasRes.text();
    const data = JSON.parse(text);

    return NextResponse.json({
      ...data,
      source: "gas_fallback",
    });
  } catch (error: any) {
    console.warn("⚠️ API GET error:", error?.message || error);
    return NextResponse.json({
      status: "success",
      source: "static_fallback",
      data: {
        missions: [],
        users: SYSTEM_USERS,
        login_logs: [],
      },
    });
  }
}

// ── Background POST ไปยัง Google Apps Script (เพื่อ Dual Sync) ──────────────
async function postToGASBackground(body: any) {
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body),
      redirect: "follow",
      cache: "no-store",
    });
  } catch (err) {
    console.warn("⚠️ GAS background sync warning:", err);
  }
}

// ── POST: บันทึกข้อมูลลง Supabase (และ Background Sync ไป GAS) ─────────────
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action || "add";

    // 1. เพิ่ม/บันทึกรถใหม่ (addVehicle)
    if (action === "addVehicle" && body.data) {
      const newUser = {
        username: String(body.data.username || "").trim().toLowerCase(),
        password: body.data.password || "",
        role: "user",
        affiliation: body.data.affiliation || body.data.unit_name || "",
        unit_name: body.data.unit_name || body.data.vehicle_name || "",
        vehicle_name: body.data.vehicle_name || body.data.unit_name || "",
        vehicle_type: body.data.vehicle_type || "CCOC Mobile",
      };

      const { error } = await supabase.from("users").upsert([newUser], { onConflict: "username" });
      if (error) console.error("⚠️ Supabase addVehicle error:", error.message);

      postToGASBackground(body);
      return NextResponse.json({ status: "success", message: "Vehicle added to Supabase" });
    }

    // 2. แก้ไขรถเดิม (editVehicle)
    if (action === "editVehicle" && body.data) {
      const uname = String(body.data.username || "").trim().toLowerCase();
      const updatePayload: any = {
        unit_name: body.data.unit_name || "",
        vehicle_name: body.data.unit_name || "",
        affiliation: body.data.affiliation || "",
        vehicle_type: body.data.vehicle_type || "CCOC Mobile",
      };

      if (body.data.password) {
        updatePayload.password = body.data.password;
      }

      const { error } = await supabase.from("users").update(updatePayload).eq("username", uname);
      if (error) console.error("⚠️ Supabase editVehicle error:", error.message);

      postToGASBackground(body);
      return NextResponse.json({ status: "success", message: "Vehicle updated in Supabase" });
    }

    // 3. แก้ไขภารกิจ (edit)
    if (action === "edit" && body.data) {
      const { error } = await supabase
        .from("missions")
        .update({
          ...body.data,
          vehicle_type: body.data.vehicle_type || "CCOC Mobile",
        })
        .eq("timestamp", body.timestamp);

      if (error) console.error("⚠️ Supabase edit mission error:", error.message);

      postToGASBackground(body);
      return NextResponse.json({ status: "success", message: "Mission updated in Supabase" });
    }

    // 4. ลบภารกิจ (delete)
    if (action === "delete" && body.timestamp) {
      const { error } = await supabase.from("missions").delete().eq("timestamp", body.timestamp);
      if (error) console.error("⚠️ Supabase delete mission error:", error.message);

      postToGASBackground(body);
      return NextResponse.json({ status: "success", message: "Mission deleted from Supabase" });
    }

    // 4.5. บันทึกการเข้าใช้งาน (login)
    if (action === "login" && body.data) {
      const newLog = {
        username: String(body.data.username || "").trim(),
        affiliation: body.data.affiliation || "",
        role: body.data.role || "user",
        timestamp: body.timestamp || new Date().toLocaleString("sv-SE", { timeZone: "Asia/Bangkok" }),
      };

      const { error } = await supabase.from("login_logs").insert([newLog]);
      if (error) console.error("⚠️ Supabase login_log insert error:", error.message);

      postToGASBackground(body);
      return NextResponse.json({ status: "success", message: "Login log recorded in Supabase" });
    }

    // 5. เพิ่มภารกิจใหม่ (Default Add Mission)
    if (body.data) {
      const isUav =
        body.sheet === "uav_missions" ||
        String(body.data.vehicle_id || "").toLowerCase().includes("uav") ||
        Boolean(body.data.drone_id);

      const newMission = {
        timestamp: body.timestamp || new Date().toLocaleString("sv-SE", { timeZone: "Asia/Bangkok" }),
        affiliation: body.data.affiliation || "",
        unit_name: body.data.unit_name || "",
        vehicle_id: body.data.vehicle_id || "",
        mission_name: body.data.mission_name || "",
        province: body.data.province || "",
        start_date: body.data.start_date || "",
        end_date: body.data.end_date || "",
        total_days: String(body.data.total_days || ""),
        distance_km: String(body.data.distance_km || body.data.distance || body.data.km || ""),
        people_per_day: String(body.data.people_per_day || ""),
        people_total: String(body.data.people_total || body.data.people_per_day || ""),
        incident_report: body.data.incident_report || "",
        remark: body.data.remark || "",
        location: body.data.location || "",
        start_time: body.data.start_time || "",
        operators: body.data.operators || "",
        drone_id: body.data.drone_id || "",
        sorties: Number(body.data.sorties || 0),
        flight_duration_min: Number(body.data.flight_duration_min || 0),
        coverage_detail: body.data.coverage_detail || "",
        tourist_density: body.data.tourist_density || "",
        vehicle_type: isUav ? "UAV Mobile" : (body.data.vehicle_type || "CCOC Mobile"),
      };

      const { error } = await supabase.from("missions").insert([newMission]);
      if (error) console.error("⚠️ Supabase insert mission error:", error.message);

      postToGASBackground(body);
      return NextResponse.json({ status: "success", message: "Mission saved to Supabase" });
    }

    return NextResponse.json({ status: "success", message: "Processed" });
  } catch (error: any) {
    console.error("⚠️ Supabase POST handler error:", error);
    return NextResponse.json({ status: "error", message: error.toString() }, { status: 500 });
  }
}
