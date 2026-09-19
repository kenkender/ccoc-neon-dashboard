import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://pcifvntiacjfritdnnal.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjaWZ2bnRpYWNqZnJpdGRubmFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MDQ0MjUsImV4cCI6MjA5MjM4MDQyNX0.m-o_DOkZ5Q-fzkiwSs0k4t8xNc0BXaM7RN3Uz4OyqzY";
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwsLqrtjt9fU7P5XOERxEqrM5QAW8MKPrsPw_F5A40LfrvtLYgkY3UnKEDH3db6C8HK/exec";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const VEHICLE_AFFILIATIONS = {
  stc01: "บช.ทท.", stc09: "บก.ทท.1", stc03: "บก.ทท.1", stc04: "บก.ทท.1",
  stc05: "บก.ทท.2", stc06: "บก.ทท.2", stc07: "บก.ทท.2",
  stc08: "บก.ทท.3", stc02: "บก.ทท.3", stc10: "บก.ทท.3",
  uav_bchtt: "บช.ทท.",
  uav002: "บก.ทท.1", uav008: "บก.ทท.1", uav004: "บก.ทท.1", uav006: "บก.ทท.1", uav007: "บก.ทท.1", uav009: "บก.ทท.1", uav010: "บก.ทท.1",
  uav011: "บก.ทท.2", uav025: "บก.ทท.2", uav001: "บก.ทท.2", uav013: "บก.ทท.2", uav028: "บก.ทท.2", uav026: "บก.ทท.2", uav003: "บก.ทท.2", uav016: "บก.ทท.2", uav017: "บก.ทท.2",
  uav018: "บก.ทท.3", uav019: "บก.ทท.3", uav021: "บก.ทท.3", uav022: "บก.ทท.3", uav023: "บก.ทท.3", uavsamui: "บก.ทท.3", uav027: "บก.ทท.3", uav005: "บก.ทท.3"
};

function resolveAffiliation(rawAff, vehicleId, unitName) {
  let s = String(rawAff || "").trim();
  if (s === "ฝ่ายอำนวยการ 6" || s === "ฝอ.6" || s.includes("ฝ่ายอำนวยการ 6") || s.includes("บก.อก.บช.ทท")) {
    return "บช.ทท.";
  }
  if (!s || s === "-" || s === "ไม่ระบุ" || s === "ไม่ระบุสังกัด") {
    const cleanVKey = String(vehicleId || "").trim().toLowerCase();
    if (cleanVKey && VEHICLE_AFFILIATIONS[cleanVKey]) {
      return VEHICLE_AFFILIATIONS[cleanVKey];
    }
    const text = `${vehicleId || ""} ${unitName || ""}`;
    if (text.includes("บก.ทท.1")) return "บก.ทท.1";
    if (text.includes("บก.ทท.2")) return "บก.ทท.2";
    if (text.includes("บก.ทท.3")) return "บก.ทท.3";
    if (text.includes("บช.ทท.")) return "บช.ทท.";
  }
  return s || "บช.ทท.";
}

async function reimportCleanData() {
  console.log("🧹 Clearing old missions from Supabase...");
  const { error: delErr } = await supabase.from("missions").delete().neq("id", 0);
  if (delErr) {
    console.error("⚠️ Error clearing missions table:", delErr.message);
  } else {
    console.log("✅ Missions table cleared.");
  }

  console.log("🚀 Fetching fresh data from Google Apps Script...");
  const res = await fetch(GOOGLE_SCRIPT_URL, { redirect: "follow" });
  const json = await res.json();

  if (!json || !json.data) {
    console.error("❌ Failed to fetch data from GAS");
    return;
  }

  const ccocMissionsRaw = json.data.ccoc_missions || json.data.missions || [];
  const uavMissionsRaw = json.data.uav_missions || [];

  console.log(`📊 GAS raw data: ${ccocMissionsRaw.length} CCOC missions, ${uavMissionsRaw.length} UAV missions.`);

  const formattedCcoc = ccocMissionsRaw.map(m => ({
    timestamp: String(m.timestamp || "").trim(),
    affiliation: resolveAffiliation(m.affiliation || m.status, m.vehicle_id, m.unit_name),
    unit_name: m.unit_name || "",
    vehicle_id: m.vehicle_id || "",
    mission_name: m.mission_name || "",
    province: m.province || "",
    start_date: m.start_date || "",
    end_date: m.end_date || "",
    total_days: String(m.total_days || ""),
    distance_km: String(m.distance_km || m.distance || m.km || ""),
    people_per_day: String(m.people_per_day || ""),
    people_total: String(m.people_total || m.people_per_day || ""),
    incident_report: m.incident_report || "",
    remark: m.remark || "",
    location: m.location || "",
    start_time: String(m.start_time || ""),
    operators: m.operators || "",
    drone_id: m.drone_id || "",
    sorties: Number(m.sorties || 0),
    flight_duration_min: Number(m.flight_duration_min || 0),
    coverage_detail: m.coverage_detail || "",
    tourist_density: m.tourist_density || "",
    vehicle_type: "CCOC Mobile",
  })).filter(m => m.timestamp);

  const formattedUav = uavMissionsRaw.map(m => ({
    timestamp: String(m.timestamp || "").trim(),
    affiliation: resolveAffiliation(m.affiliation || m.status, m.vehicle_id, m.unit_name),
    unit_name: m.unit_name || "",
    vehicle_id: m.vehicle_id || "",
    mission_name: m.mission_name || "",
    province: m.province || "",
    start_date: m.start_date || "",
    end_date: m.end_date || "",
    total_days: String(m.total_days || ""),
    distance_km: String(m.distance_km || m.distance || m.km || ""),
    people_per_day: String(m.people_per_day || ""),
    people_total: String(m.people_total || m.people_per_day || ""),
    incident_report: m.incident_report || "",
    remark: m.remark || "",
    location: m.location || "",
    start_time: String(m.start_time || ""),
    operators: m.operators || "",
    drone_id: m.drone_id || "",
    sorties: Number(m.sorties || 0),
    flight_duration_min: Number(m.flight_duration_min || 0),
    coverage_detail: m.coverage_detail || "",
    tourist_density: m.tourist_density || "",
    vehicle_type: "UAV Mobile",
  })).filter(m => m.timestamp);

  console.log(`⏳ Uploading ${formattedCcoc.length} CCOC missions to Supabase...`);
  const { error: errCcoc } = await supabase.from("missions").insert(formattedCcoc);
  if (errCcoc) console.error("⚠️ Error inserting CCOC missions:", errCcoc.message);
  else console.log("✅ CCOC Mobile missions inserted!");

  console.log(`⏳ Uploading ${formattedUav.length} UAV missions to Supabase...`);
  const { error: errUav } = await supabase.from("missions").insert(formattedUav);
  if (errUav) console.error("⚠️ Error inserting UAV missions:", errUav.message);
  else console.log("✅ UAV Mobile missions inserted!");

  console.log("🎉 Clean re-import complete!");
}

reimportCleanData().catch(console.error);
