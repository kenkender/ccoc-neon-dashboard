import { NextResponse } from "next/server";
import {
  verifyLineSignature,
  registerLineGroupId,
  replyLineMessage,
  buildStatusFlexMessage,
} from "@/lib/lineBot";
import { supabase } from "@/lib/supabase";
import { analyzeStationInactivity } from "@/lib/webPush";
import { SYSTEM_USERS } from "@/app/data/users";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "CCOC&UAV Alert Bot Webhook",
    timestamp: new Date().toISOString(),
  });
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-line-signature") || "";

    // ตรวจสอบความถูกต้องของ Signature จาก LINE
    if (!verifyLineSignature(rawBody, signature)) {
      console.warn("⚠️ Invalid LINE Webhook Signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const events: any[] = payload.events || [];

    for (const event of events) {
      const source = event.source || {};
      const groupId = source.groupId || source.roomId;

      // 1. บันทึก groupId ทุกครั้งที่มีปฏิสัมพันธ์ในกลุ่ม
      if (groupId) {
        await registerLineGroupId(groupId);
      }

      // 2. เมื่อบอทถูกดึงเข้าร่วมกลุ่ม (Join Group Event)
      if (event.type === "join") {
        const greetingText =
          "👋 สวัสดีครับทุกท่าน! CCOC&UAV Alert Bot เข้าร่วมกลุ่มเรียบร้อยแล้วครับ 🚀\n\n" +
          "บอทตัวนี้จะคอย:\n" +
          "✅ แจ้งเตือนเมื่อมีหน่วยลงบันทึกภารกิจสำเร็จแบบ Real-time\n" +
          "🔔 เตือนความจำทุกวัน เวลา 17:00 น.\n" +
          "📊 ตรวจสอบสถานะหน่วยที่ขาดการบันทึกเกิน 5 วัน\n\n" +
          '💡 ท่านสามารถพิมพ์คำว่า "สถานะ" หรือ "เช็คภารกิจ" ในกลุ่ม เพื่อดูสรุปข้อมูลล่าสุดได้ตลอดเวลาครับ';

        if (event.replyToken) {
          await replyLineMessage(event.replyToken, [{ type: "text", text: greetingText }]);
        }
        continue;
      }

      // 3. เมื่อมีข้อความเข้ามาในกลุ่มหรือแชทส่วนตัว (Message Event)
      if (event.type === "message" && event.message?.type === "text") {
        const userText = String(event.message.text || "").trim().toLowerCase();

        // ตรวจสอบคำสั่ง "สถานะ" / "เช็คภารกิจ" / "status"
        if (
          userText.includes("สถานะ") ||
          userText.includes("เช็คภารกิจ") ||
          userText.includes("ตรวจ") ||
          userText === "status" ||
          userText === "report" ||
          userText === "5 วัน" ||
          userText === "ค้างส่ง"
        ) {
          const [missionsRes, usersRes] = await Promise.all([
            supabase.from("missions").select("*").order("created_at", { ascending: false }),
            supabase.from("users").select("*"),
          ]);

          const missions = missionsRes.data || [];
          const users = usersRes.data && usersRes.data.length > 0 ? usersRes.data : SYSTEM_USERS;

          const statuses = analyzeStationInactivity(missions, users);
          const inactiveCcoc = statuses.filter((s) => s.isInactive5Days && s.username.startsWith("stc"));
          const inactiveUav = statuses.filter((s) => s.isInactive5Days && s.username.startsWith("uav"));

          const flexMsg = buildStatusFlexMessage(inactiveCcoc, inactiveUav, missions.length);

          if (event.replyToken) {
            await replyLineMessage(event.replyToken, [flexMsg]);
          }
        } else if (userText === "วิธีใช้" || userText === "help" || userText === "คำสั่ง") {
          const helpText =
            "📌 คำสั่งสำหรับ CCOC&UAV Alert Bot:\n\n" +
            "• พิมพ์ \"สถานะ\" หรือ \"เช็คภารกิจ\": ดูรายงานหน่วยที่ขาดการส่งข้อมูลเกิน 5 วัน\n" +
            "• ระบบจะแจ้งเตือนเข้ากลุ่มอัตโนมัติเมื่อมีหน่วยลงบันทึกภารกิจ\n" +
            "• ระบบจะส่งการแจ้งเตือนความจำทุกวันเวลา 17:00 น.\n\n" +
            "🌐 เปิดระบบ Dashboard: https://ccoc-neon-dashboard.vercel.app/";

          if (event.replyToken) {
            await replyLineMessage(event.replyToken, [{ type: "text", text: helpText }]);
          }
        }
      }
    }

    return NextResponse.json({ status: "success", count: events.length });
  } catch (err: any) {
    console.error("⚠️ LINE Webhook error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
