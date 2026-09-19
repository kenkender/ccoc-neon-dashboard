import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://pcifvntiacjfritdnnal.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjaWZ2bnRpYWNqZnJpdGRubmFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MDQ0MjUsImV4cCI6MjA5MjM4MDQyNX0.m-o_DOkZ5Q-fzkiwSs0k4t8xNc0BXaM7RN3Uz4OyqzY";
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwsLqrtjt9fU7P5XOERxEqrM5QAW8MKPrsPw_F5A40LfrvtLYgkY3UnKEDH3db6C8HK/exec";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrate() {
  console.log("🚀 Starting data migration from Google Sheets to Supabase...");

  // 1. Fetch current data from GAS
  const res = await fetch(GOOGLE_SCRIPT_URL);
  const json = await res.json();

  if (!json || !json.data) {
    console.error("❌ Failed to fetch data from GAS");
    return;
  }

  const { missions = [], ccoc_missions = [], uav_missions = [], users = [], login_logs = [] } = json.data;
  const allMissions = [...missions, ...ccoc_missions, ...uav_missions];

  console.log(`📦 Found ${allMissions.length} missions, ${users.length} users, ${login_logs.length} login logs.`);

  // 2. Insert Users
  if (users.length > 0) {
    const formattedUsers = users.map(u => ({
      username: String(u.username || u.vehicle_id || "").trim().toLowerCase(),
      password: u.password || "",
      role: u.role || "user",
      affiliation: u.affiliation || "",
      unit_name: u.unit_name || u.vehicle_name || "",
      vehicle_name: u.vehicle_name || u.unit_name || "",
      vehicle_type: u.vehicle_type || (String(u.username).startsWith("uav") ? "UAV Mobile" : "CCOC Mobile"),
    })).filter(u => u.username && u.username !== "undefined");

    console.log(`⏳ Uploading ${formattedUsers.length} users to Supabase...`);
    const { error: userErr } = await supabase.from("users").upsert(formattedUsers, { onConflict: "username" });
    if (userErr) {
      console.error("⚠️ Error uploading users:", userErr.message);
    } else {
      console.log("✅ Users migrated successfully!");
    }
  }

  // 3. Insert Missions
  if (allMissions.length > 0) {
    const formattedMissions = allMissions.map(m => ({
      timestamp: String(m.timestamp || "").trim(),
      affiliation: m.affiliation || "",
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
      start_time: m.start_time || "",
      operators: m.operators || "",
      drone_id: m.drone_id || "",
      sorties: Number(m.sorties || 0),
      flight_duration_min: Number(m.flight_duration_min || 0),
      coverage_detail: m.coverage_detail || "",
      tourist_density: m.tourist_density || "",
      vehicle_type: m.vehicle_type || (String(m.vehicle_id || "").toLowerCase().includes("uav") ? "UAV Mobile" : "CCOC Mobile"),
    })).filter(m => m.timestamp);

    console.log(`⏳ Uploading ${formattedMissions.length} missions to Supabase...`);
    const { error: missionErr } = await supabase.from("missions").insert(formattedMissions);
    if (missionErr) {
      console.error("⚠️ Error uploading missions:", missionErr.message);
    } else {
      console.log("✅ Missions migrated successfully!");
    }
  }

  console.log("🎉 Migration process complete!");
}

migrate().catch(console.error);
