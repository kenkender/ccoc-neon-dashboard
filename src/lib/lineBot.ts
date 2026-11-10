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
 * บันทึกหรืออัปเดต groupId ของกลุ่มไลน์ลงใน Supabase (ใช้ตาราง login_logs ด้วย role = 'line_group')
 */
export async function registerLineGroupId(groupId: string): Promise<void> {
  if (!groupId || !groupId.startsWith("C")) return;
  try {
    const { data: existing } = await supabase
      .from("login_logs")
      .select("id")
      .eq("role", "line_group")
      .eq("affiliation", groupId)
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
          username: "line_group",
          role: "line_group",
          affiliation: groupId,
          timestamp: new Date().toLocaleString("sv-SE", { timeZone: "Asia/Bangkok" }),
        },
      ]);
    }
  } catch (err) {
    console.error("⚠️ Failed to register LINE groupId:", err);
  }
}

/**
 * ดึงรายการ groupId ทั้งหมดที่บอทเข้าร่วม
 */
export async function getRegisteredLineGroupIds(): Promise<string[]> {
  try {
    const { data } = await supabase
      .from("login_logs")
      .select("affiliation")
      .eq("role", "line_group");

    const ids = (data || [])
      .map((row) => String(row.affiliation || "").trim())
      .filter((id) => id.startsWith("C") || id.startsWith("R"));

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
// TEMPLATES: FLEX MESSAGES สไตล์ Neon Dashboard
// ─────────────────────────────────────────────────────────────────────────────

/**
 * การ์ด Flex Message: แจ้งเตือนเมื่อมีหน่วยลงบันทึกภารกิจสำเร็จ
 */
export function buildMissionFlexMessage(mission: any) {
  const isUav =
    String(mission.vehicle_type || "").toLowerCase().includes("uav") ||
    Boolean(mission.drone_id) ||
    String(mission.vehicle_id || "").toLowerCase().includes("uav");

  const headerTitle = isUav ? "🛸 บันทึกภารกิจ UAV Mobile สำเร็จ" : "🚗 บันทึกภารกิจ CCOC Mobile สำเร็จ";
  const headerColor = isUav ? "#06B6D4" : "#D946EF"; // Cyan vs Fuchsia
  const badgeColor = isUav ? "#0891B2" : "#A21CAF";

  const rows: any[] = [
    {
      type: "box",
      layout: "baseline",
      spacing: "sm",
      contents: [
        { type: "text", text: "หน่วย", color: "#94A3B8", size: "sm", flex: 2 },
        {
          type: "text",
          text: `${mission.unit_name || "-"} [${mission.vehicle_id || "-"}]`,
          wrap: true,
          color: "#F8FAFC",
          size: "sm",
          weight: "bold",
          flex: 5,
        },
      ],
    },
    {
      type: "box",
      layout: "baseline",
      spacing: "sm",
      contents: [
        { type: "text", text: "สังกัด", color: "#94A3B8", size: "sm", flex: 2 },
        {
          type: "text",
          text: mission.affiliation || "-",
          wrap: true,
          color: "#38BDF8",
          size: "sm",
          weight: "bold",
          flex: 5,
        },
      ],
    },
    {
      type: "box",
      layout: "baseline",
      spacing: "sm",
      contents: [
        { type: "text", text: "ภารกิจ", color: "#94A3B8", size: "sm", flex: 2 },
        {
          type: "text",
          text: mission.mission_name || "-",
          wrap: true,
          color: "#FCD34D",
          size: "sm",
          weight: "bold",
          flex: 5,
        },
      ],
    },
    {
      type: "box",
      layout: "baseline",
      spacing: "sm",
      contents: [
        { type: "text", text: "วันที่", color: "#94A3B8", size: "sm", flex: 2 },
        {
          type: "text",
          text: mission.start_date || mission.timestamp || "-",
          wrap: true,
          color: "#E2E8F0",
          size: "sm",
          flex: 5,
        },
      ],
    },
  ];

  if (mission.province || mission.location) {
    rows.push({
      type: "box",
      layout: "baseline",
      spacing: "sm",
      contents: [
        { type: "text", text: "พื้นที่", color: "#94A3B8", size: "sm", flex: 2 },
        {
          type: "text",
          text: `${mission.province || ""} ${mission.location || ""}`.trim() || "-",
          wrap: true,
          color: "#E2E8F0",
          size: "sm",
          flex: 5,
        },
      ],
    });
  }

  if (isUav && (mission.drone_id || mission.sorties || mission.flight_duration_min)) {
    rows.push({
      type: "box",
      layout: "baseline",
      spacing: "sm",
      contents: [
        { type: "text", text: "การบิน", color: "#94A3B8", size: "sm", flex: 2 },
        {
          type: "text",
          text: `${mission.drone_id || "UAV"} | ${mission.sorties || 1} เที่ยวบิน | ${mission.flight_duration_min || 0} นาที`,
          wrap: true,
          color: "#34D399",
          size: "sm",
          flex: 5,
        },
      ],
    });
  } else if (!isUav && mission.distance_km) {
    rows.push({
      type: "box",
      layout: "baseline",
      spacing: "sm",
      contents: [
        { type: "text", text: "ระยะทาง", color: "#94A3B8", size: "sm", flex: 2 },
        {
          type: "text",
          text: `${mission.distance_km} กม.`,
          wrap: true,
          color: "#34D399",
          size: "sm",
          flex: 5,
        },
      ],
    });
  }

  if (mission.incident_report && mission.incident_report !== "-") {
    rows.push({
      type: "box",
      layout: "baseline",
      spacing: "sm",
      contents: [
        { type: "text", text: "เหตุการณ์", color: "#94A3B8", size: "sm", flex: 2 },
        {
          type: "text",
          text: mission.incident_report,
          wrap: true,
          color: "#CBD5E1",
          size: "sm",
          flex: 5,
        },
      ],
    });
  }

  return {
    type: "flex",
    altText: `📢 ${headerTitle}: ${mission.unit_name || mission.vehicle_id} - ${mission.mission_name || ""}`,
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
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "CCOC NEON ALERT",
                size: "xxs",
                color: headerColor,
                weight: "bold",
                letterSpacing: "1px",
              },
              {
                type: "text",
                text: "บันทึกเรียบร้อย",
                size: "xxs",
                color: "#10B981",
                align: "end",
                weight: "bold",
              },
            ],
          },
          {
            type: "text",
            text: headerTitle,
            weight: "bold",
            size: "md",
            color: "#F8FAFC",
            margin: "md",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#1E293B",
        paddingAll: "16px",
        spacing: "md",
        contents: rows,
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
            color: badgeColor,
            height: "sm",
            action: {
              type: "uri",
              label: "📊 ดูข้อมูลในระบบ CCOC NEON",
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
            letterSpacing: "1px",
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
            letterSpacing: "1px",
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
