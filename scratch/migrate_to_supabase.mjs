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

  const { missions = [], ccoc_missions = [], uav_missions = [], users = [] } = json.data;

  // Deduplicate Users by username
  const userMap = new Map();
  users.forEach(u => {
    const uname = String(u.username || u.vehicle_id || "").trim().toLowerCase();
    if (uname && uname !== "undefined" && uname !== "null") {
      userMap.set(uname, {
        username: uname,
        password: u.password || "",
        role: u.role || "user",
        affiliation: u.affiliation || "",
        unit_name: u.unit_name || u.vehicle_name || "",
        vehicle_name: u.vehicle_name || u.unit_name || "",
        vehicle_type: u.vehicle_type || (uname.startsWith("uav") ? "UAV Mobile" : "CCOC Mobile"),
      });
    }
  });

  const uniqueUsers = Array.from(userMap.values());

  if (uniqueUsers.length > 0) {
    console.log(`⏳ Uploading ${uniqueUsers.length} unique users to Supabase...`);
    const { error: userErr } = await supabase.from("users").upsert(uniqueUsers, { onConflict: "username" });
    if (userErr) {
      console.error("⚠️ Error uploading users:", userErr.message);
    } else {
      console.log("✅ Users migrated successfully!");
    }
  }

  console.log("🎉 Migration process complete!");
}

migrate().catch(console.error);
