import crypto from "crypto";
import { SYSTEM_USERS, VEHICLE_AFFILIATIONS, VEHICLE_UNIT_MAP, VEHICLE_NAMES } from "@/app/data/users";

export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BF-QVb6iAKlUzHblAuc4gRRuoJOLLn_smZuAjBl_9g3Pk3jIJxnQYBYJX0fbjcZeMPDQvAtcLrCO5s7ZX8CQkIk";

const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ||
  "5IvqzZ2HlSPqrDO8ulwBrZWs3kpoKMJVCRSyEota1lE";

function createVapidJwt(audience: string, subject = "mailto:ccoc@touristpolice.go.th"): string {
  const header = Buffer.from(JSON.stringify({ typ: "JWT", alg: "ES256" })).toString("base64url");
  const exp = Math.floor(Date.now() / 1000) + 12 * 3600;
  const payload = Buffer.from(JSON.stringify({ aud: audience, exp, sub: subject })).toString("base64url");
  const unsignedToken = `${header}.${payload}`;

  const pubBuf = Buffer.from(VAPID_PUBLIC_KEY, "base64url");
  const x = pubBuf.subarray(1, 33).toString("base64url");
  const y = pubBuf.subarray(33, 65).toString("base64url");
  const jwk = { kty: "EC", crv: "P-256", x, y, d: VAPID_PRIVATE_KEY };
  const privateKey = crypto.createPrivateKey({ key: jwk as any, format: "jwk" });

  const signature = crypto
    .sign("sha256", Buffer.from(unsignedToken), {
      key: privateKey,
      dsaEncoding: "ieee-p1363",
    })
    .toString("base64url");

  return `${unsignedToken}.${signature}`;
}

function encryptWebPushPayload(payloadStr: string, p256dhBase64Url: string, authBase64Url: string): Buffer {
  const clientPublicKey = Buffer.from(p256dhBase64Url, "base64url");
  const userAuth = Buffer.from(authBase64Url, "base64url");
  const salt = crypto.randomBytes(16);

  const serverEcdh = crypto.createECDH("prime256v1");
  serverEcdh.generateKeys();
  const serverPublicKey = serverEcdh.getPublicKey();
  const sharedSecret = serverEcdh.computeSecret(clientPublicKey);

  // RFC 8291 key derivation
  const keyInfo = Buffer.concat([
    Buffer.from("WebPush: info\0"),
    clientPublicKey,
    serverPublicKey,
  ]);
  const ikm = Buffer.from(crypto.hkdfSync("sha256", sharedSecret, userAuth, keyInfo, 32));

  const cekInfo = Buffer.from("Content-Encoding: aes128gcm\0");
  const cek = Buffer.from(crypto.hkdfSync("sha256", ikm, salt, cekInfo, 16));

  const nonceInfo = Buffer.from("Content-Encoding: nonce\0");
  const nonce = Buffer.from(crypto.hkdfSync("sha256", ikm, salt, nonceInfo, 12));

  const plaintext = Buffer.concat([Buffer.from(payloadStr, "utf8"), Buffer.from([2])]);
  const cipher = crypto.createCipheriv("aes-128-gcm", cek, nonce);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final(), cipher.getAuthTag()]);

  const rsBuf = Buffer.alloc(4);
  rsBuf.writeUInt32BE(4096, 0);
  const idLenBuf = Buffer.from([serverPublicKey.length]);

  return Buffer.concat([salt, rsBuf, idLenBuf, serverPublicKey, encrypted]);
}

export interface WebPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  tag?: string;
  url?: string;
  requireInteraction?: boolean;
}

export async function sendWebPushNotification(
  subscription: WebPushSubscription,
  payload: NotificationPayload
): Promise<{ ok: boolean; status: number; expired?: boolean }> {
  try {
    const endpointUrl = new URL(subscription.endpoint);
    const audience = `${endpointUrl.protocol}//${endpointUrl.host}`;
    const jwt = createVapidJwt(audience);
    const bodyBuffer = encryptWebPushPayload(
      JSON.stringify(payload),
      subscription.keys.p256dh,
      subscription.keys.auth
    );

    const res = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        Authorization: `vapid t=${jwt}, k=${VAPID_PUBLIC_KEY}`,
        "Content-Encoding": "aes128gcm",
        "Content-Type": "application/octet-stream",
        TTL: "86400",
        Urgency: "high",
      },
      body: new Uint8Array(bodyBuffer),
      signal: AbortSignal.timeout(4000),
    });

    return {
      ok: res.ok,
      status: res.status,
      expired: res.status === 404 || res.status === 410,
    };
  } catch (err) {
    console.warn("⚠️ WebPush send error:", err);
    return { ok: false, status: 500 };
  }
}

export interface StationActivityStatus {
  username: string;
  unit_name: string;
  short_name: string;
  affiliation: string;
  vehicle_type: string;
  lastMissionDate: string | null;
  lastMissionName: string | null;
  daysInactive: number | null; // null = ยังไม่เคยลงภารกิจเลย
  isInactive5Days: boolean;
}

function parseNormalizedDateMs(dateVal: any): number {
  if (!dateVal) return 0;
  const s = String(dateVal).trim();
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    let yr = parseInt(isoMatch[1], 10);
    if (yr > 2400) yr -= 543;
    return new Date(`${yr}-${isoMatch[2]}-${isoMatch[3]}T00:00:00+07:00`).getTime();
  }
  const dt = new Date(s);
  if (!isNaN(dt.getTime())) {
    if (dt.getFullYear() > 2400) dt.setFullYear(dt.getFullYear() - 543);
    return dt.getTime();
  }
  return 0;
}

export function analyzeStationInactivity(missions: any[], users: any[] = SYSTEM_USERS): StationActivityStatus[] {
  // Get today's date in Asia/Bangkok at midnight for accurate day diff
  const nowBangkokStr = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Bangkok" });
  const todayMs = new Date(`${nowBangkokStr}T00:00:00+07:00`).getTime();

  const baseUsers = users && users.length > 0 ? users : SYSTEM_USERS;
  const seen = new Set<string>();
  const results: StationActivityStatus[] = [];

  for (const u of baseUsers) {
    const uname = String(u.username || "").trim().toLowerCase();
    if (!uname || seen.has(uname)) continue;
    seen.add(uname);

    const unitMissions = (missions || []).filter(
      (m: any) => String(m.vehicle_id || "").trim().toLowerCase() === uname
    );

    let latestMs = 0;
    let latestDateStr: string | null = null;
    let latestName: string | null = null;

    for (const m of unitMissions) {
      const ms = parseNormalizedDateMs(m.start_date || m.timestamp);
      if (ms > latestMs) {
        latestMs = ms;
        latestDateStr = String(m.start_date || m.timestamp || "").split("T")[0].split(" ")[0];
        latestName = m.mission_name || null;
      }
    }

    let daysInactive: number | null = null;
    if (latestMs > 0) {
      const diffDays = Math.floor((todayMs - latestMs) / (1000 * 60 * 60 * 24));
      daysInactive = Math.max(0, diffDays);
    }

    const isInactive5Days = daysInactive === null || daysInactive >= 5;

    results.push({
      username: uname,
      unit_name: u.unit_name || VEHICLE_UNIT_MAP[uname] || uname,
      short_name: VEHICLE_NAMES[uname] || uname,
      affiliation: u.affiliation || VEHICLE_AFFILIATIONS[uname] || "บช.ทท.",
      vehicle_type: u.vehicle_type || (uname.startsWith("uav") ? "UAV Mobile" : "CCOC Mobile"),
      lastMissionDate: latestDateStr,
      lastMissionName: latestName,
      daysInactive,
      isInactive5Days,
    });
  }

  return results;
}

export function buildNotificationForUnit(
  username: string,
  allStatuses: StationActivityStatus[],
  mode: "daily_1700" | "inactivity_check" = "daily_1700"
): NotificationPayload {
  const uname = String(username || "").trim().toLowerCase();
  const unitStatus = allStatuses.find((s) => s.username === uname);
  const inactiveList = allStatuses.filter((s) => s.isInactive5Days);

  // หากเป็น Admin หรือ บช.ทท. (stc01) ที่ดูแลภาพรวม
  if (uname === "admin") {
    return {
      title: "🔔 แจ้งเตือนประจำวัน 17:00 น. (สรุปภาพรวม บช.ทท.)",
      body: `พบหน่วยที่ไม่มีภารกิจเคลื่อนไหวเกิน 5 วัน จำนวน ${inactiveList.length} หน่วย — หากออกภารกิจวันนี้ อย่าลืมบันทึกข้อมูลนะครับ`,
      tag: `ccoc-daily-${mode}`,
      url: "/",
      requireInteraction: true,
    };
  }

  if (unitStatus && unitStatus.isInactive5Days) {
    const daysText =
      unitStatus.daysInactive === null
        ? "ยังไม่มีประวัติการลงภารกิจ"
        : `ไม่ได้บันทึกภารกิจมาแล้ว ${unitStatus.daysInactive} วัน (ล่าสุด ${unitStatus.lastMissionDate})`;
    return {
      title: `⚠️ แจ้งเตือน: ไม่มีภารกิจเคลื่อนไหวเกิน 5 วัน (${unitStatus.short_name})`,
      body: `${unitStatus.unit_name} ${daysText} — หากออกปฏิบัติภารกิจ อย่าลืมลงภารกิจในระบบนะครับ!`,
      tag: `ccoc-inactive5d-${uname}`,
      url: "/",
      requireInteraction: true,
    };
  }

  const displayUnit = unitStatus ? unitStatus.unit_name : uname.toUpperCase();
  return {
    title: `🔔 เตือนความจำประจำวัน 17:00 น. (${unitStatus?.short_name || uname.toUpperCase()})`,
    body: `วันนี้ออกภารกิจหรือไม่? หากออกปฏิบัติภารกิจ อย่าลืมลงบันทึกภารกิจในระบบนะครับ (${displayUnit})`,
    tag: `ccoc-daily-1700-${uname}`,
    url: "/",
    requireInteraction: false,
  };
}

