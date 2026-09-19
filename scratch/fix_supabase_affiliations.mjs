import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://pcifvntiacjfritdnnal.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjaWZ2bnRpYWNqZnJpdGRubmFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MDQ0MjUsImV4cCI6MjA5MjM4MDQyNX0.m-o_DOkZ5Q-fzkiwSs0k4t8xNc0BXaM7RN3Uz4OyqzY";

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

async function fixAffiliations() {
  console.log("🛠️ Checking Supabase missions for missing affiliations...");
  const { data: missions, error } = await supabase.from("missions").select("*");
  if (error || !missions) {
    console.error("❌ Failed to fetch missions:", error?.message);
    return;
  }

  let updatedCount = 0;
  for (const m of missions) {
    const rawAff = String(m.affiliation || "").trim();
    if (!rawAff || rawAff === "-" || rawAff === "ไม่ระบุ" || rawAff === "ไม่ระบุสังกัด") {
      const vKey = String(m.vehicle_id || "").trim().toLowerCase();
      let inferredAff = VEHICLE_AFFILIATIONS[vKey];
      if (!inferredAff) {
        const text = `${m.vehicle_id || ""} ${m.unit_name || ""}`;
        if (text.includes("บก.ทท.1")) inferredAff = "บก.ทท.1";
        else if (text.includes("บก.ทท.2")) inferredAff = "บก.ทท.2";
        else if (text.includes("บก.ทท.3")) inferredAff = "บก.ทท.3";
        else if (text.includes("บช.ทท.")) inferredAff = "บช.ทท.";
      }

      if (inferredAff) {
        const { error: upErr } = await supabase
          .from("missions")
          .update({ affiliation: inferredAff })
          .eq("id", m.id);
        if (!upErr) updatedCount++;
      }
    }
  }

  console.log(`✅ Updated ${updatedCount} missions with correct affiliations in Supabase!`);
}

fixAffiliations().catch(console.error);
