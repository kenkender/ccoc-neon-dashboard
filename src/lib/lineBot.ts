import crypto from "crypto";
import { supabase } from "./supabase";

export const LINE_CHANNEL_ID =
  process.env.LINE_CHANNEL_ID || "2012523104";

export const LINE_CHANNEL_SECRET =
  process.env.LINE_CHANNEL_SECRET || "989c0847aa13453a918594bdc5866587";

export const LINE_CHANNEL_ACCESS_TOKEN =
  process.env.LINE_CHANNEL_ACCESS_TOKEN ||
  "ye0ELqJ1G9CFvyIZtiZzqCPkmi5sQRtSOe/HNgZOhf47Mkseu02AOTS7xFGKquGW3nVuxcap+WtfRejilo4Ni+GggiTAPwWV1hzzWut/Jq9Ug+IyWMBZKYQ7lmfhvDl3CQvQzHzzyq+/xBxCNXac5wdB04t89/1O/w1cDnyilFU=";

const LINE_MESSAGING_API_ENDPOINT = "https://api.line.me/v2/bot/message";

/**
 * ตรวจสอบลายเซ็น LINE Webhook Signature (HMAC-SHA256)
 */
export function verifyLineSignature(body: string, signature: string): boolean {
  if (!signature || !LINE_CHANNEL_SECRET) return false;
  try {
    const hash = crypto
      .createHmac("SHA256", LINE_CHANNEL_SECRET)
      .update(body)
      .digest("base64");
    return hash === signature;
  } catch {
    return false;
  }
}

/**
 * บันทึกหรืออัปเดต targetId (groupId, roomId, หรือ userId สำหรับทดสอบส่วนตัว) ลงใน Supabase
 */
export async function registerLineGroupId(targetId: string): Promise<void> {
  if (
    !targetId ||
    (!targetId.startsWith("C") && !targetId.startsWith("R") && !targetId.startsWith("U"))
  ) {
    return;
  }
  try {
    const { data: existing } = await supabase
      .from("login_logs")
      .select("id")
      .eq("role", "line_group")
      .eq("affiliation", targetId)
      .limit(1);

    if (existing && existing.length > 0) {
      // อัปเดต timestamp ล่าสุด
      await supabase
        .from("login_logs")
        .update({
          timestamp: new Date().toLocaleString("sv-SE", { timeZone: "Asia/Bangkok" }),
        })
        .eq("id", existing[0].id);
    } else {
      await supabase.from("login_logs").insert([
        {
          username: targetId.startsWith("U") ? "line_user_test" : "line_group",
          role: "line_group",
          affiliation: targetId,
          timestamp: new Date().toLocaleString("sv-SE", { timeZone: "Asia/Bangkok" }),
        },
      ]);
    }
  } catch (err) {
    console.error("⚠️ Failed to register LINE targetId:", err);
  }
}

/**
 * ดึงรายการ targetId ทั้งหมดที่บอทเข้าร่วม (กลุ่ม, ห้องสนทนา หรือบัญชีส่วนตัวที่เปิดทดสอบ)
 */
export async function getRegisteredLineGroupIds(): Promise<string[]> {
  try {
    const { data } = await supabase
      .from("login_logs")
      .select("affiliation")
      .eq("role", "line_group");

    const ids = (data || [])
      .map((row) => String(row.affiliation || "").trim())
      .filter((id) => id.startsWith("C") || id.startsWith("R") || id.startsWith("U"));

    // Deduplicate
    return Array.from(new Set(ids));
  } catch (err) {
    console.error("⚠️ Failed to fetch LINE group IDs:", err);
    return [];
  }
}

/**
 * ส่งข้อความแบบ Push Message ไปยังเป้าหมาย (groupId หรือ userId)
 */
export async function sendLinePush(to: string, messages: any[]): Promise<boolean> {
  if (!to || !messages || messages.length === 0) return false;
  try {
    const res = await fetch(`${LINE_MESSAGING_API_ENDPOINT}/push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to,
        messages,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`⚠️ LINE Push Error (${res.status}):`, errText);
      return false;
    }
    return true;
  } catch (err) {
    console.error("⚠️ LINE Push network exception:", err);
    return false;
  }
}

/**
 * ส่งข้อความแบบ Reply Message โดยใช้ replyToken
 */
export async function replyLineMessage(replyToken: string, messages: any[]): Promise<boolean> {
  if (!replyToken || !messages || messages.length === 0) return false;
  try {
    const res = await fetch(`${LINE_MESSAGING_API_ENDPOINT}/reply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        replyToken,
        messages,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`⚠️ LINE Reply Error (${res.status}):`, errText);
      return false;
    }
    return true;
  } catch (err) {
    console.error("⚠️ LINE Reply exception:", err);
    return false;
  }
}

/**
 * ส่งแจ้งเตือนไปยังทุกกลุ่มไลน์ที่ลงทะเบียนไว้
 */
export async function broadcastToAllLineGroups(messages: any[]): Promise<number> {
  const groupIds = await getRegisteredLineGroupIds();
  if (groupIds.length === 0) {
    console.log("ℹ️ No LINE groups registered yet. Invite the bot to your group first.");
    return 0;
  }

  let sent = 0;
  for (const gid of groupIds) {
    const ok = await sendLinePush(gid, messages);
    if (ok) sent++;
  }
  return sent;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATES: FLEX MESSAGES & TEXT MESSAGES สไตล์ Neon Dashboard
// ─────────────────────────────────────────────────────────────────────────────

const THAI_MONTHS_SHORT = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
];

export function formatThaiReportDate(dateVal: any): string {
  if (!dateVal) return "-";
  const s = String(dateVal).trim();
  const m = s.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (m) {
    let y = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10) - 1;
    const d = parseInt(m[3], 10);
    if (y < 2500) y += 543;
    const shortY = String(y).slice(-2);
    return `${d} ${THAI_MONTHS_SHORT[mo] || ""} ${shortY}`;
  }
  const dt = new Date(s);
  if (!isNaN(dt.getTime())) {
    let y = dt.getFullYear();
    if (y < 2500) y += 543;
    const shortY = String(y).slice(-2);
    return `${dt.getDate()} ${THAI_MONTHS_SHORT[dt.getMonth()]} ${shortY}`;
  }
  return s;
}

export function parseCoverageAndAltitude(
  coverageDetail: any,
  explicitAltitude?: any
): { coverage: string; altitude: string } {
  let altitude = String(explicitAltitude || "").trim();
  let coverage = String(coverageDetail || "").trim();

  if ((!altitude || altitude === "-") && coverage && coverage !== "-") {
    const match = coverage.match(/(?:[\|\(\[]\s*)?(?:ความสูง(?:ในการขึ้นบิน)?|altitude)\s*:?\s*([^\]\)\|\n]+)/i);
    if (match && match[1]) {
      altitude = match[1].trim();
      coverage = coverage.replace(/(?:[\|\(\[]\s*)?(?:ความสูง(?:ในการขึ้นบิน)?|altitude)\s*:?\s*[^\]\)\|\n]+[\)\]]?/i, "").trim();
      coverage = coverage.replace(/^[\|\s]+|[\|\s]+$/g, "");
    }
  }

  coverage = coverage.replace(/\(ระยะทาง(?:รวม)?(?:ไป-กลับ)?\s*[\d.]+\s*กม\.?\)/i, "").trim();

  return {
    coverage: coverage && coverage !== "-" ? coverage : "-",
    altitude:
      altitude && altitude !== "-"
        ? altitude.endsWith("ม.") || altitude.endsWith("เมตร") || altitude.endsWith("m")
          ? altitude
          : `${altitude} ม.`
        : "-",
  };
}

/**
 * สร้างข้อความรายงานผู้บังคับบัญชาแบบ Plain Text (สามารถแตะค้างเพื่อคัดลอก หรือแชร์ต่อได้ทันที)
 */
export function buildMissionReportText(mission: any): string {
  const vid = String(mission.raw_vehicle_id || mission.vehicle_id || "").toLowerCase();
  const vtype = String(mission.vehicle_type || "").toLowerCase();
  const isExplicitCcoc = vid.startsWith("stc") || vtype === "ccoc mobile";
  const isUav =
    !isExplicitCcoc &&
    (vtype.includes("uav") ||
      vid.includes("uav") ||
      (Boolean(mission.drone_id) && mission.drone_id !== "Drone-01"));

  const sDate = formatThaiReportDate(mission.start_date || mission.timestamp);

  // เวลา
  let timeStr = String(mission.start_time || "").trim();
  if (!timeStr || timeStr === "-") {
    timeStr = "-";
  } else if (!timeStr.endsWith("น.") && !timeStr.endsWith("น")) {
    timeStr = `${timeStr} น.`;
  }

  // หน่วย และ สังกัด
  const rawVid = String(mission.raw_vehicle_id || mission.vehicle_id || "").toUpperCase();
  const unitName = mission.unit_name || rawVid || "-";
  const aff = mission.affiliation || "บช.ทท.";

  // สถานที่
  const loc = mission.location ? mission.location.trim() : "";
  const prov = mission.province ? mission.province.trim() : "";
  let fullLocation = loc;
  if (prov && !loc.includes(prov)) {
    fullLocation = loc ? `${loc} จ.${prov}` : `จ.${prov}`;
  }
  if (!fullLocation) fullLocation = "-";

  // ระยะทาง
  let distStr = String(mission.distance_km || mission.distance || mission.km || "-").trim();
  if (distStr && distStr !== "-" && distStr !== "0") {
    if (!distStr.includes("กม")) distStr = `${distStr} กม.`;
  } else {
    distStr = "-";
  }

  // จำนวนนักท่องเที่ยว
  let touristStr = String(
    mission.tourist_count_est ||
    mission.people_total ||
    mission.people_per_day ||
    mission.tourist_density ||
    "-"
  ).trim();
  if (touristStr && touristStr !== "-" && /^\d+$/.test(touristStr)) {
    touristStr = `${Number(touristStr).toLocaleString()} คน`;
  } else if (touristStr && touristStr !== "-" && !touristStr.includes("คน")) {
    touristStr = `${touristStr} คน`;
  }

  const incident =
    mission.incident_report && mission.incident_report !== "-"
      ? mission.incident_report
      : "เหตุการณ์ทั่วไปปกติ";

  if (isUav) {
    const droneModel = mission.drone_id || "UAV";
    const sorties = mission.sorties || 1;
    const duration = mission.flight_duration_min || 0;
    const { altitude } = parseCoverageAndAltitude(mission.coverage_detail, mission.flight_altitude);

    return `UAV Mobile ${aff}
เรียน ผู้บังคับบัญชา
🗓️  วันที่: ${sDate}
🕗  เวลา: ${timeStr}
👮‍♂️  ผู้ปฏิบัติ: ${unitName} (${rawVid.toLowerCase()})
🟥  การปฏิบัติ: ${mission.mission_name || "-"}
📍  สถานที่: ${fullLocation}
🚗  ระยะทางปฏิบัติภารกิจ (รวมไป-กลับ): ${distStr}
👥  จำนวนนักท่องเที่ยวโดยประมาณ: ${touristStr}
🛸  ข้อมูลการบิน UAV Mobile:
    - รหัส/รุ่นโดรน: ${droneModel} (${sorties} รอบบิน / รวม ${duration} นาที)
    - ความสูงในการขึ้นบิน: ${altitude}
🟦  ผลการปฏิบัติงาน: ${incident}`;
  } else {
    // CCOC Mobile (รูปแบบรายงานมาตรฐาน)
    const eDate = mission.end_date ? formatThaiReportDate(mission.end_date) : sDate;

    let totalDaysStr = String(mission.total_days || "").trim();
    if (!totalDaysStr || totalDaysStr === "-" || totalDaysStr === "0") {
      totalDaysStr = "1 วัน";
    } else if (!totalDaysStr.includes("วัน")) {
      totalDaysStr = `${totalDaysStr} วัน`;
    }

    // แยกพิกัดที่ปฏิบัติหน้าที่ และ สถานที่
    let coordinatesStr = "-";
    let locationStr = "-";

    if (loc && prov && loc !== prov) {
      coordinatesStr = loc;
      locationStr = prov.includes("จ.") ? prov : (prov.startsWith("กรุงเทพ") ? `จ.${prov}` : `จ.${prov}`);
    } else if (prov) {
      if (prov.includes("จ.")) {
        const parts = prov.split(/จ\./);
        if (parts[0].trim()) {
          coordinatesStr = parts[0].trim();
          locationStr = `จ.${parts[1].trim()}`;
        } else {
          coordinatesStr = "-";
          locationStr = prov;
        }
      } else {
        coordinatesStr = "-";
        locationStr = prov.startsWith("กรุงเทพ") ? `จ.${prov}` : `จ.${prov}`;
      }
    } else if (loc) {
      coordinatesStr = loc;
      locationStr = "-";
    }

    const cleanIncident =
      mission.incident_report &&
      mission.incident_report !== "-" &&
      mission.incident_report !== "ไม่ระบุ"
        ? mission.incident_report
        : "เหตุการณ์ปกติ";

    return `${rawVid} ${aff}
เรียน ผู้บังคับบัญชา
🗓️  วันที่เริ่มภารกิจ : ${sDate}
       วันที่สิ้นสุดภารกิจ : ${eDate}
       ระยะเวลารวม : ${totalDaysStr}
👮‍♂️  หน่วยที่ออกภารกิจ : ${unitName} (${rawVid.toLowerCase()})
       ชื่อภารกิจ : ${mission.mission_name || "-"}
🟥  พิกัดที่ปฏิบัติหน้าที่ : ${coordinatesStr}
📍  สถานที่ : ${locationStr}
🚗  ระยะทางปฏิบัติภารกิจ (รวมไป-กลับ) : ${distStr}
👥  จำนวนนักท่องเที่ยวโดยประมาณ : ${touristStr}
🟦  ผลการปฏิบัติงาน : ${cleanIncident}`;
  }
}

/**
 * การ์ด Flex Message: แจ้งเตือนเมื่อมีหน่วยลงบันทึกภารกิจสำเร็จ (ดีไซน์ Executive Pro สไตล์ Dashboard)
 */
export function buildMissionFlexMessage(mission: any) {
  const vid = String(mission.raw_vehicle_id || mission.vehicle_id || "").toLowerCase();
  const vtype = String(mission.vehicle_type || "").toLowerCase();
  const isExplicitCcoc = vid.startsWith("stc") || vtype === "ccoc mobile";
  const isUav =
    !isExplicitCcoc &&
    (vtype.includes("uav") ||
      vid.includes("uav") ||
      (Boolean(mission.drone_id) && mission.drone_id !== "Drone-01"));

  const rawVid = String(mission.raw_vehicle_id || mission.vehicle_id || (isUav ? "UAV" : "STC01")).toUpperCase();
  const aff = mission.affiliation || "บช.ทท.";
  const unitName = mission.unit_name || aff || rawVid;
  const missionName = mission.mission_name || (isUav ? "ว.43 สายตรวจโดรนมุมสูง" : "ภารกิจ CCOC Mobile");

  const sDate = formatThaiReportDate(mission.start_date || mission.timestamp);
  const eDate = mission.end_date ? formatThaiReportDate(mission.end_date) : sDate;
  const dateRangeStr = eDate && eDate !== sDate && eDate !== "-" ? `${sDate} - ${eDate}` : sDate;

  let totalDaysStr = String(mission.total_days || "").trim();
  if (!totalDaysStr || totalDaysStr === "-" || totalDaysStr === "0") {
    totalDaysStr = "1 วัน";
  } else if (!totalDaysStr.includes("วัน")) {
    totalDaysStr = `${totalDaysStr} วัน`;
  }

  // พิกัด และ สถานที่
  const loc = mission.location ? String(mission.location).trim() : "";
  const prov = mission.province ? String(mission.province).trim() : "";
  let coordinatesStr = "-";
  let locationStr = "-";

  if (loc && prov && loc !== prov) {
    coordinatesStr = loc;
    locationStr = prov.includes("จ.") ? prov : (prov.startsWith("กรุงเทพ") ? `จ.${prov}` : `จ.${prov}`);
  } else if (prov) {
    if (prov.includes("จ.")) {
      const parts = prov.split(/จ\./);
      if (parts[0].trim()) {
        coordinatesStr = parts[0].trim();
        locationStr = `จ.${parts[1].trim()}`;
      } else {
        coordinatesStr = "-";
        locationStr = prov;
      }
    } else {
      coordinatesStr = "-";
      locationStr = prov.startsWith("กรุงเทพ") ? `จ.${prov}` : `จ.${prov}`;
    }
  } else if (loc) {
    coordinatesStr = loc;
    locationStr = "-";
  }

  // ระยะทาง
  let distStr = String(mission.distance_km || mission.distance || mission.km || "-").trim();
  if (distStr && distStr !== "-" && distStr !== "0") {
    if (!distStr.includes("กม")) distStr = `${distStr} กม.`;
  } else {
    distStr = "-";
  }

  // นักท่องเที่ยว
  let touristStr = String(
    mission.tourist_count_est ||
    mission.people_total ||
    mission.people_per_day ||
    mission.tourist_density ||
    "-"
  ).trim();
  if (touristStr && touristStr !== "-" && /^\d+$/.test(touristStr)) {
    touristStr = `${Number(touristStr).toLocaleString()} คน`;
  } else if (touristStr && touristStr !== "-" && !touristStr.includes("คน")) {
    touristStr = `${touristStr} คน`;
  }

  // เหตุการณ์
  const cleanIncident =
    mission.incident_report &&
    mission.incident_report !== "-" &&
    mission.incident_report !== "ไม่ระบุ"
      ? mission.incident_report
      : "เหตุการณ์ปกติ";

  const badgeText = isUav ? "🛸 UAV MOBILE REPORT" : "🚗 CCOC MOBILE REPORT";
  const badgeBg = isUav ? "#0369A1" : "#831843";
  const badgeColor = isUav ? "#38BDF8" : "#F472B6";
  const headerTitle = isUav ? `UAV Mobile ${aff}` : `${rawVid} ${aff}`;

  // 3 Metric Stat Boxes
  const statBox1 = isUav
    ? { title: "🛸 เที่ยวบิน", value: `${mission.sorties || 1} รอบบิน`, color: "#38BDF8" }
    : { title: "🗓️ ระยะเวลา", value: totalDaysStr, color: "#38BDF8" };

  const statBox2 = isUav
    ? { title: "⏱️ เวลาบินรวม", value: `${mission.flight_duration_min || 0} นาที`, color: "#FCD34D" }
    : { title: "🚗 ระยะทาง", value: distStr, color: "#FCD34D" };

  const statBox3 = {
    title: "👥 นทท. โดยประมาณ",
    value: touristStr,
    color: "#34D399",
  };

  const detailRows: any[] = [
    {
      type: "box",
      layout: "baseline",
      spacing: "sm",
      contents: [
        { type: "text", text: "👮‍♂️ หน่วย", color: "#94A3B8", size: "xs", flex: 3 },
        {
          type: "text",
          text: `${unitName} (${rawVid.toLowerCase()})`,
          wrap: true,
          color: "#F8FAFC",
          size: "xs",
          weight: "bold",
          flex: 7,
        },
      ],
    },
    {
      type: "box",
      layout: "baseline",
      spacing: "sm",
      contents: [
        { type: "text", text: "⭐ ภารกิจ", color: "#94A3B8", size: "xs", flex: 3 },
        {
          type: "text",
          text: missionName,
          wrap: true,
          color: "#FCD34D",
          size: "xs",
          weight: "bold",
          flex: 7,
        },
      ],
    },
    {
      type: "box",
      layout: "baseline",
      spacing: "sm",
      contents: [
        { type: "text", text: "🗓️ ห้วงเวลา", color: "#94A3B8", size: "xs", flex: 3 },
        {
          type: "text",
          text: dateRangeStr,
          wrap: true,
          color: "#E2E8F0",
          size: "xs",
          flex: 7,
        },
      ],
    },
  ];

  if (isUav) {
    const droneModel = mission.drone_id || "UAV";
    const { altitude } = parseCoverageAndAltitude(mission.coverage_detail, mission.flight_altitude);
    detailRows.push(
      {
        type: "box",
        layout: "baseline",
        spacing: "sm",
        contents: [
          { type: "text", text: "🛸 รุ่นโดรน", color: "#94A3B8", size: "xs", flex: 3 },
          {
            type: "text",
            text: droneModel,
            wrap: true,
            color: "#A78BFA",
            size: "xs",
            weight: "bold",
            flex: 7,
          },
        ],
      },
      {
        type: "box",
        layout: "baseline",
        spacing: "sm",
        contents: [
          { type: "text", text: "📏 ความสูง", color: "#94A3B8", size: "xs", flex: 3 },
          {
            type: "text",
            text: altitude,
            wrap: true,
            color: "#C084FC",
            size: "xs",
            flex: 7,
          },
        ],
      }
    );
  }

  if (coordinatesStr !== "-") {
    detailRows.push({
      type: "box",
      layout: "baseline",
      spacing: "sm",
      contents: [
        { type: "text", text: "🟥 พิกัด", color: "#94A3B8", size: "xs", flex: 3 },
        {
          type: "text",
          text: coordinatesStr,
          wrap: true,
          color: "#E2E8F0",
          size: "xs",
          flex: 7,
        },
      ],
    });
  }

  if (locationStr !== "-") {
    detailRows.push({
      type: "box",
      layout: "baseline",
      spacing: "sm",
      contents: [
        { type: "text", text: "📍 สถานที่", color: "#94A3B8", size: "xs", flex: 3 },
        {
          type: "text",
          text: locationStr,
          wrap: true,
          color: "#38BDF8",
          size: "xs",
          weight: "bold",
          flex: 7,
        },
      ],
    });
  }

  return {
    type: "flex",
    altText: `📢 รายงานภารกิจ: ${headerTitle} - ${missionName}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#0F172A",
        paddingAll: "16px",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                backgroundColor: badgeBg,
                cornerRadius: "4px",
                paddingStart: "8px",
                paddingEnd: "8px",
                paddingTop: "2px",
                paddingBottom: "2px",
                contents: [
                  {
                    type: "text",
                    text: badgeText,
                    size: "xxs",
                    color: badgeColor,
                    weight: "bold",
                  },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                backgroundColor: "#064E3B",
                cornerRadius: "4px",
                paddingStart: "8px",
                paddingEnd: "8px",
                paddingTop: "2px",
                paddingBottom: "2px",
                contents: [
                  {
                    type: "text",
                    text: "🟢 บันทึกเรียบร้อย",
                    size: "xxs",
                    color: "#34D399",
                    weight: "bold",
                  },
                ],
              },
            ],
          },
          {
            type: "text",
            text: headerTitle,
            weight: "bold",
            size: "xl",
            color: "#F8FAFC",
            margin: "md",
          },
          {
            type: "text",
            text: "เรียน ผู้บังคับบัญชา — รายงานผลการปฏิบัติหน้าที่",
            size: "xs",
            color: "#94A3B8",
            margin: "xs",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#1E293B",
        paddingAll: "16px",
        spacing: "md",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            spacing: "md",
            contents: [
              {
                type: "box",
                layout: "vertical",
                backgroundColor: "#0F172A",
                cornerRadius: "8px",
                paddingAll: "10px",
                flex: 1,
                contents: [
                  { type: "text", text: statBox1.title, size: "xxs", color: "#94A3B8" },
                  {
                    type: "text",
                    text: statBox1.value,
                    size: "md",
                    weight: "bold",
                    color: statBox1.color,
                    margin: "xs",
                  },
                ],
              },
              {
                type: "box",
                layout: "vertical",
                backgroundColor: "#0F172A",
                cornerRadius: "8px",
                paddingAll: "10px",
                flex: 1,
                contents: [
                  { type: "text", text: statBox2.title, size: "xxs", color: "#94A3B8" },
                  {
                    type: "text",
                    text: statBox2.value,
                    size: "md",
                    weight: "bold",
                    color: statBox2.color,
                    margin: "xs",
                  },
                ],
              },
              {
                type: "box",
                layout: "vertical",
                backgroundColor: "#0F172A",
                cornerRadius: "8px",
                paddingAll: "10px",
                flex: 1,
                contents: [
                  { type: "text", text: statBox3.title, size: "xxs", color: "#94A3B8" },
                  {
                    type: "text",
                    text: statBox3.value,
                    size: "md",
                    weight: "bold",
                    color: statBox3.color,
                    margin: "xs",
                  },
                ],
              },
            ],
          },
          { type: "separator", color: "#334155" },
          {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            contents: detailRows,
          },
          {
            type: "box",
            layout: "vertical",
            backgroundColor: "#0F172A",
            cornerRadius: "8px",
            paddingAll: "12px",
            contents: [
              {
                type: "text",
                text: "🟦 ผลการปฏิบัติงาน",
                size: "xs",
                color: "#38BDF8",
                weight: "bold",
              },
              {
                type: "text",
                text: cleanIncident,
                size: "xs",
                color: "#F1F5F9",
                margin: "sm",
                wrap: true,
              },
            ],
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#0F172A",
        paddingAll: "12px",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#0284C7",
            height: "sm",
            action: {
              type: "uri",
              label: "🌐 เปิดดูแดชบอร์ดเต็มรูปแบบ",
              uri: "https://ccoc-neon-dashboard.vercel.app/",
            },
          },
        ],
      },
    },
  };
}

/**
 * การ์ด Flex Message: เตือนความจำประจำวัน เวลา 17:00 น.
 */
export function buildDaily1700FlexMessage(inactiveCcocCount: number, inactiveUavCount: number) {
  const hasInactive = inactiveCcocCount > 0 || inactiveUavCount > 0;

  return {
    type: "flex",
    altText: "🔔 เตือนความจำประจำวัน (17:00 น.) — บันทึกภารกิจ CCOC / UAV Mobile",
    contents: {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#0F172A",
        paddingAll: "16px",
        contents: [
          {
            type: "text",
            text: "🔔 DAILY REMINDER (17:00 น.)",
            size: "xs",
            color: "#F59E0B",
            weight: "bold",
          },
          {
            type: "text",
            text: "เตือนความจำการลงภารกิจประจำวัน",
            weight: "bold",
            size: "md",
            color: "#F8FAFC",
            margin: "sm",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#1E293B",
        paddingAll: "16px",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: "เรียน ทุกหน่วยปฏิบัติการ CCOC Mobile และ UAV Mobile",
            size: "sm",
            color: "#F1F5F9",
            weight: "bold",
          },
          {
            type: "text",
            text: "หากวันนี้หน่วยของท่านมีการออกปฏิบัติภารกิจ โปรดอย่าลืมลงบันทึกข้อมูลภารกิจในระบบ CCOC NEON ให้เป็นปัจจุบันนะครับ",
            wrap: true,
            size: "xs",
            color: "#CBD5E1",
            lineSpacing: "4px",
          },
          {
            type: "separator",
            color: "#334155",
            margin: "md",
          },
          {
            type: "box",
            layout: "vertical",
            margin: "md",
            spacing: "xs",
            contents: [
              {
                type: "text",
                text: hasInactive
                  ? `⚠️ ตรวจพบหน่วยขาดการลงภารกิจเกิน 5 วัน:`
                  : `✅ ทุกหน่วยมีการลงภารกิจครบถ้วน`,
                size: "xs",
                color: hasInactive ? "#FB7185" : "#34D399",
                weight: "bold",
              },
              {
                type: "text",
                text: `• รถ CCOC Mobile: ยังไม่ลง ${inactiveCcocCount} คัน\n• UAV Mobile: ยังไม่ลง ${inactiveUavCount} ลำ`,
                size: "xs",
                color: "#94A3B8",
                wrap: true,
              },
            ],
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#0F172A",
        paddingAll: "12px",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#0284C7",
            height: "sm",
            action: {
              type: "uri",
              label: "📝 บันทึกภารกิจทันที",
              uri: "https://ccoc-neon-dashboard.vercel.app/",
            },
          },
        ],
      },
    },
  };
}

/**
 * การ์ด Flex Message: สรุปหน่วยที่ขาดการลงภารกิจเกิน 5 วัน (ตอบเมื่อพิมพ์ "สถานะ" ในกลุ่ม)
 */
export function buildStatusFlexMessage(
  inactiveCcoc: any[],
  inactiveUav: any[],
  totalMissions: number
) {
  const topInactiveCcoc = inactiveCcoc.slice(0, 5);
  const topInactiveUav = inactiveUav.slice(0, 5);

  const ccocLines =
    topInactiveCcoc.length > 0
      ? topInactiveCcoc
          .map(
            (u) =>
              `• [${u.short_name}] ขาด ${u.daysInactive === null ? "ไม่มีข้อมูล" : `${u.daysInactive} วัน`}`
          )
          .join("\n") +
        (inactiveCcoc.length > 5 ? `\n...และอีก ${inactiveCcoc.length - 5} หน่วย` : "")
      : "• ไม่มีหน่วยค้างส่ง 🎉";

  const uavLines =
    topInactiveUav.length > 0
      ? topInactiveUav
          .map(
            (u) =>
              `• [${u.short_name}] ขาด ${u.daysInactive === null ? "ไม่มีข้อมูล" : `${u.daysInactive} วัน`}`
          )
          .join("\n") +
        (inactiveUav.length > 5 ? `\n...และอีก ${inactiveUav.length - 5} หน่วย` : "")
      : "• ไม่มีหน่วยค้างส่ง 🎉";

  return {
    type: "flex",
    altText: `📊 รายงานสถานะภารกิจ CCOC: ค้างส่ง CCOC ${inactiveCcoc.length} หน่วย / UAV ${inactiveUav.length} หน่วย`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#0F172A",
        paddingAll: "16px",
        contents: [
          {
            type: "text",
            text: "📊 STATUS REPORT — CCOC NEON",
            size: "xs",
            color: "#38BDF8",
            weight: "bold",
          },
          {
            type: "text",
            text: "สรุปหน่วยที่ยังไม่มีภารกิจเกิน 5 วัน",
            weight: "bold",
            size: "md",
            color: "#F8FAFC",
            margin: "sm",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#1E293B",
        paddingAll: "16px",
        spacing: "md",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "ภารกิจทั้งหมด", size: "xxs", color: "#94A3B8" },
                  {
                    type: "text",
                    text: `${totalMissions}`,
                    size: "lg",
                    weight: "bold",
                    color: "#38BDF8",
                  },
                ],
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "CCOC ขาดส่ง", size: "xxs", color: "#94A3B8" },
                  {
                    type: "text",
                    text: `${inactiveCcoc.length} หน่วย`,
                    size: "lg",
                    weight: "bold",
                    color: "#F43F5E",
                  },
                ],
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "UAV ขาดส่ง", size: "xxs", color: "#94A3B8" },
                  {
                    type: "text",
                    text: `${inactiveUav.length} หน่วย`,
                    size: "lg",
                    weight: "bold",
                    color: "#F59E0B",
                  },
                ],
              },
            ],
          },
          { type: "separator", color: "#334155" },
          {
            type: "box",
            layout: "vertical",
            spacing: "xs",
            contents: [
              {
                type: "text",
                text: "🚗 รถ CCOC Mobile ที่ขาดส่ง > 5 วัน:",
                size: "xs",
                color: "#E2E8F0",
                weight: "bold",
              },
              {
                type: "text",
                text: ccocLines,
                size: "xxs",
                color: "#94A3B8",
                wrap: true,
                lineSpacing: "3px",
              },
            ],
          },
          {
            type: "box",
            layout: "vertical",
            spacing: "xs",
            margin: "sm",
            contents: [
              {
                type: "text",
                text: "🛸 UAV Mobile ที่ขาดส่ง > 5 วัน:",
                size: "xs",
                color: "#E2E8F0",
                weight: "bold",
              },
              {
                type: "text",
                text: uavLines,
                size: "xxs",
                color: "#94A3B8",
                wrap: true,
                lineSpacing: "3px",
              },
            ],
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#0F172A",
        paddingAll: "12px",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#0284C7",
            height: "sm",
            action: {
              type: "uri",
              label: "🌐 เปิดดูแดชบอร์ดเต็มรูปแบบ",
              uri: "https://ccoc-neon-dashboard.vercel.app/",
            },
          },
        ],
      },
    },
  };
}

