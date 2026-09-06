import { NextResponse } from "next/server";
import { SYSTEM_USERS } from "@/app/data/users";

// ✅ ห้าม Vercel cache response ของ API นี้ (Hobby plan compatible)
export const dynamic = "force-dynamic";

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwsLqrtjt9fU7P5XOERxEqrM5QAW8MKPrsPw_F5A40LfrvtLYgkY3UnKEDH3db6C8HK/exec";

// In-Memory Cache (Stale-While-Revalidate)
// หมายเหตุ: บน Vercel Serverless แต่ละ instance อาจไม่แชร์ cache กัน
// แต่ในทางปฏิบัติ warm instance มักถูกใช้ซ้ำ ทำให้ยังช่วยลด request ได้
let cachedData: any = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 120000; // แคชไว้ 2 นาที

let isFetching = false;

function combineAllMissions(data: any) {
  if (!data || !data.data) return data;

  const ccocMissions = Array.isArray(data.data.missions) ? data.data.missions : 
                       Array.isArray(data.data.ccoc_missions) ? data.data.ccoc_missions : [];
  const uavMissions = Array.isArray(data.data.uav_missions) ? data.data.uav_missions : [];

  const missionMap = new Map<string, any>();

  ccocMissions.forEach((m: any) => {
    if (m && m.timestamp) {
      const key = String(m.timestamp).trim();
      missionMap.set(key, {
        ...m,
        vehicle_type: m.vehicle_type || (String(m.vehicle_id || "").toLowerCase().includes("uav") ? "UAV Mobile" : "CCOC Mobile")
      });
    }
  });

  uavMissions.forEach((u: any) => {
    if (u && u.timestamp) {
      const key = String(u.timestamp).trim();
      missionMap.set(key, {
        ...u,
        vehicle_type: u.vehicle_type || "UAV Mobile"
      });
    }
  });

  const mergedList = Array.from(missionMap.values());
  mergedList.sort((a: any, b: any) => {
    const timeA = new Date(a.timestamp || 0).getTime();
    const timeB = new Date(b.timestamp || 0).getTime();
    return timeB - timeA;
  });

  return {
    ...data,
    data: {
      ...data.data,
      missions: mergedList,
    },
  };
}

async function fetchFromGAS(timeoutMs = 25000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      redirect: "follow",
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const text = await response.text();
    const data = JSON.parse(text);
    return combineAllMissions(data);
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

async function refreshCacheInBackground() {
  if (isFetching) return;
  isFetching = true;
  try {
    const data = await fetchFromGAS(25000);
    if (data && data.status !== "error" && data.data?.missions) {
      const freshMissions = data.data.missions || [];
      if (cachedData?.data?.missions) {
        const localMissions = cachedData.data.missions;
        localMissions.forEach((loc: any) => {
          const existsInFresh = freshMissions.some(
            (f: any) => f.timestamp === loc.timestamp
          );
          if (!existsInFresh) {
            freshMissions.unshift(loc);
          }
        });
      }
      cachedData = {
        ...data,
        data: {
          ...data.data,
          missions: freshMissions,
        },
      };
      lastFetchTime = Date.now();
      console.log("✅ Background refresh from Google Apps Script succeeded.");
    }
  } catch (err: any) {
    console.warn("⚠️ Background refresh failed:", err?.message || err);
  } finally {
    isFetching = false;
  }
}

export async function GET() {
  const now = Date.now();

  // 1. ถ้ามีแคชอยู่แล้ว ตอบกลับทันที (Stale-While-Revalidate)
  if (cachedData) {
    if (now - lastFetchTime > CACHE_TTL_MS) {
      refreshCacheInBackground();
    }
    return NextResponse.json(cachedData);
  }

  // 2. ยังไม่มีแคช — ดึงข้อมูลตรงๆ
  try {
    const data = await fetchFromGAS(25000);
    cachedData = data;
    lastFetchTime = Date.now();
    return NextResponse.json(data);
  } catch (error: any) {
    console.warn(
      "⚠️ Proxy: Initial fetch from GAS failed/timed out. Reason:",
      error?.message || error
    );

    // 3. ป้องกัน 500 error — ส่งโครงสร้างว่างแล้วดึง background
    refreshCacheInBackground();

    return NextResponse.json({
      status: "success",
      data: {
        missions: [],
        users: SYSTEM_USERS,
        login_logs: [],
      },
    });
  }
}

// ✅ แก้ไขปัญหา GAS POST redirect บน Vercel
// Google Apps Script ส่ง 302 redirect กลับมา ซึ่งทำให้ POST ถูกแปลงเป็น GET
// วิธีแก้: ส่ง POST ไปยัง URL แล้วจัดการ redirect ด้วยตัวเอง
async function postToGAS(body: any, maxRetries = 2, timeoutMs = 25000) {
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      console.log(
        `🚀 Proxy: Sending POST to GAS (Attempt ${attempt}/${maxRetries})...`
      );

      const bodyStr = JSON.stringify(body);

      // ส่ง POST โดยไม่ follow redirect อัตโนมัติ เพื่อจัดการเอง
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        body: bodyStr,
        redirect: "follow", // ✅ follow redirect แต่ GAS จะ follow ไปยัง exec URL จริงๆ
        cache: "no-store",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const text = await response.text();
      console.log(
        `📥 GAS Response (attempt ${attempt}): status=${response.status}, body=${text.substring(0, 200)}`
      );

      // ตรวจสอบ status code
      if (response.status >= 500) {
        console.warn(
          `⚠️ GAS returned HTTP ${response.status} on attempt ${attempt}`
        );
        lastError = new Error(`HTTP ${response.status}: ${text.substring(0, 100)}`);
        continue;
      }

      // parse JSON response ถ้าได้
      try {
        const json = JSON.parse(text);
        if (json.status === "error") {
          console.warn(
            `⚠️ GAS returned error status on attempt ${attempt}:`,
            json.message
          );
          lastError = new Error(json.message || "GAS error response");
          continue;
        }
      } catch (pErr) {
        // Non-JSON response is OK as long as HTTP succeeded
      }

      console.log(
        `✅ Proxy: POST to GAS succeeded on attempt ${attempt}. HTTP ${response.status}`
      );
      return { success: true, text };
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastError = err;
      console.warn(
        `⚠️ Proxy: POST attempt ${attempt} failed: ${err?.message || err}`
      );

      // ถ้า abort (timeout) ไม่ต้อง retry อีก
      if (err?.name === "AbortError") {
        console.warn(`⏱️ Request timed out after ${timeoutMs}ms`);
        break;
      }
    }
  }

  return { success: false, error: lastError?.message || String(lastError) };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. ส่งข้อมูลไปยัง Google Apps Script
    const gasResult = await postToGAS(body, 2, 25000);

    // 2. ถ้า cachedData ยังไม่มี (เช่น Vercel instance เพิ่งขึ้นใหม่) ให้ดึงข้อมูลเต็มจาก GAS ก่อน
    if (!cachedData || !cachedData.data || !Array.isArray(cachedData.data.missions)) {
      try {
        const fullData = await fetchFromGAS(15000);
        if (fullData && fullData.data?.missions) {
          cachedData = fullData;
        }
      } catch (err) {
        console.warn("⚠️ Failed to pre-fetch cache during POST:", err);
        cachedData = {
          status: "success",
          data: { missions: [], users: SYSTEM_USERS, login_logs: [] },
        };
      }
    }

    if (cachedData && cachedData.data && Array.isArray(cachedData.data.missions)) {
      if (body.action === "add" && body.data) {
        const newRecord = {
          ...body.data,
          timestamp: body.timestamp || new Date().toISOString(),
          vehicle_type: (body.sheet === "uav_missions" || String(body.data.vehicle_id || "").toLowerCase().includes("uav") || Boolean(body.data.drone_id))
            ? "UAV Mobile"
            : (body.data.vehicle_type || "CCOC Mobile")
        };
        const exists = cachedData.data.missions.some(
          (m: any) => m.timestamp === newRecord.timestamp
        );
        if (!exists) {
          cachedData.data.missions.unshift(newRecord);
        }
      } else if (body.action === "edit" && body.data) {
        cachedData.data.missions = cachedData.data.missions.map((m: any) =>
          m.timestamp === body.timestamp ? { ...m, ...body.data } : m
        );
      } else if (body.action === "delete" && body.timestamp) {
        cachedData.data.missions = cachedData.data.missions.filter(
          (m: any) => m.timestamp !== body.timestamp
        );
      }
    }

    // ✅ ไม่ invalidate cache หลัง POST เพราะจะทำให้ GET ครั้งต่อไป fetch ใหม่จาก GAS แล้วอาจได้ข้อมูลไม่ครบ
    // cache จะ expire เองตาม CACHE_TTL_MS (2 นาที) ตามปกติ

    return NextResponse.json({
      status: gasResult.success ? "success" : "warning",
      gasSuccess: gasResult.success,
      message: gasResult.success
        ? "Data saved to Google Sheets successfully"
        : `Google Sheets sync warning: ${gasResult.error}`,
    });
  } catch (error: any) {
    console.error("⚠️ Proxy POST error:", error);
    return NextResponse.json(
      { status: "error", gasSuccess: false, message: error.toString() },
      { status: 500 }
    );
  }
}
