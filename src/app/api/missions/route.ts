import { NextResponse } from "next/server";

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwsLqrtjt9fU7P5XOERxEqrM5QAW8MKPrsPw_F5A40LfrvtLYgkY3UnKEDH3db6C8HK/exec";

export async function GET() {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      redirect: "follow",
      cache: "no-store",
    });

    const text = await response.text();

    try {
      const data = JSON.parse(text);
      return NextResponse.json(data);
    } catch (parseErr) {
      console.error("⚠️ Proxy: Google Apps Script returned non-JSON:", text.slice(0, 200));
      return NextResponse.json(
        { status: "error", message: "Google Apps Script API returned HTML or non-JSON", raw: text.slice(0, 300) },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("⚠️ Proxy fetch error:", error);
    return NextResponse.json({ status: "error", message: error.toString() }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();

    try {
      const data = JSON.parse(text);
      return NextResponse.json(data);
    } catch (parseErr) {
      // GAS doPost returns no-cors mode text usually or JSON string
      return NextResponse.json({ status: "success", message: "Data posted to Google Apps Script", raw: text });
    }
  } catch (error: any) {
    console.error("⚠️ Proxy POST error:", error);
    return NextResponse.json({ status: "error", message: error.toString() }, { status: 500 });
  }
}
