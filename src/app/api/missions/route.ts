import { NextResponse } from "next/server";
import { SYSTEM_USERS } from "@/app/data/users";

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwsLqrtjt9fU7P5XOERxEqrM5QAW8MKPrsPw_F5A40LfrvtLYgkY3UnKEDH3db6C8HK/exec";

// In-Memory Cache (Stale-While-Revalidate)
let cachedData: any = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 120000; // แคชไว้ 2 นาที (120 วินาที)

let isFetching = false;

async function fetchFromGAS(timeoutMs = 30000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      redirect: "follow",
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const text = await response.text();
    const data = JSON.parse(text);
    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

async function refreshCacheInBackground() {
  if (isFetching) return;
  isFetching = true;
  try {
    const data = await fetchFromGAS(30000);
    if (data && data.status !== "error" && data.data?.missions) {
      const freshMissions = data.data.missions || [];
      if (cachedData?.data?.missions) {
        const localMissions = cachedData.data.missions;
        localMissions.forEach((loc: any) => {
          const existsInFresh = freshMissions.some((f: any) => f.timestamp === loc.timestamp);
          if (!existsInFresh) {
            freshMissions.unshift(loc);
          }
        });
      }
      cachedData = {
        ...data,
        data: {
          ...data.data,
          missions: freshMissions
        }
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

  // 1. ถ้ามีแคชอยู่แล้ว ตอบกลับทันที 0ms (Stale-While-Revalidate)
  if (cachedData) {
    // ถ้าแคชหมดอายุ ให้สั่งแอบดึงใน Background โดยไม่ต้องให้ผู้ใช้รอหน้าจอค้าง
    if (now - lastFetchTime > CACHE_TTL_MS) {
      refreshCacheInBackground();
    }
    return NextResponse.json(cachedData);
  }

  // 2. ถ้ายังไม่มีแคชเลย (เพิ่งเปิดเซิฟเวอร์ครั้งแรก) ดึงข้อมูลตรงๆ
  try {
    const data = await fetchFromGAS(30000);
    cachedData = data;
    lastFetchTime = Date.now();
    return NextResponse.json(data);
  } catch (error: any) {
    console.warn("⚠️ Proxy: Initial fetch from Google Apps Script failed/timed out. Reason:", error?.message || error);

    // 3. ป้องกัน 500 error ด้วยการส่งโครงสร้างเบื้องต้นและแอบดึงใน Background
    refreshCacheInBackground();

    return NextResponse.json({
      status: "success",
      data: {
        missions: [],
        users: SYSTEM_USERS,
        login_logs: []
      }
    });
  }
}

async function postToGAS(body: any, maxRetries = 3, timeoutMs = 35000) {
  let lastError: any = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      console.log(`🚀 Proxy: Sending POST to Google Apps Script (Attempt ${attempt}/${maxRetries})...`);
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        body: JSON.stringify(body),
        redirect: "follow",
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const text = await response.text();
      try {
        const json = JSON.parse(text);
        if (json.status === "error") {
          console.warn(`⚠️ GAS returned error status on attempt ${attempt}:`, json.message);
          lastError = new Error(json.message || "GAS error response");
          continue;
        }
      } catch (pErr) {
        // Non-JSON text response is fine as long as HTTP request completed
      }
      console.log(`✅ Proxy: POST to Google Apps Script succeeded on attempt ${attempt}.`);
      return { success: true, text };
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastError = err;
      console.warn(`⚠️ Proxy: POST attempt ${attempt} failed: ${err?.message || err}`);
    }
  }
  return { success: false, error: lastError?.message || String(lastError) };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Send to Google Apps Script with retry mechanism
    const gasResult = await postToGAS(body, 3, 35000);

    // 2. Update server memory cache (ensure cachedData exists)
    if (!cachedData) {
      cachedData = { status: "success", data: { missions: [], users: SYSTEM_USERS, login_logs: [] } };
    }

    if (cachedData && cachedData.data && Array.isArray(cachedData.data.missions)) {
      if (body.action === "add" && body.data) {
        const newRecord = { ...body.data, timestamp: body.timestamp || new Date().toISOString() };
        const exists = cachedData.data.missions.some((m: any) => m.timestamp === newRecord.timestamp);
        if (!exists) {
          cachedData.data.missions.unshift(newRecord);
        }
      } else if (body.action === "edit" && body.data) {
        cachedData.data.missions = cachedData.data.missions.map((m: any) => 
          m.timestamp === body.timestamp ? { ...m, ...body.data } : m
        );
      } else if (body.action === "delete" && body.timestamp) {
        cachedData.data.missions = cachedData.data.missions.filter((m: any) => m.timestamp !== body.timestamp);
      }
    }

    return NextResponse.json({ 
      status: gasResult.success ? "success" : "warning", 
      gasSuccess: gasResult.success,
      message: gasResult.success 
        ? "Data saved to Google Sheets and local cache" 
        : `Google Sheets sync warning: ${gasResult.error}`
    });
  } catch (error: any) {
    console.error("⚠️ Proxy POST error:", error);
    return NextResponse.json({ status: "error", gasSuccess: false, message: error.toString() }, { status: 500 });
  }
}

