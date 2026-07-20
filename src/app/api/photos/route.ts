// src/app/api/photos/route.ts
// GET /api/photos — proxy ไปยัง Photo Server (API Key ซ่อนอยู่ฝั่ง server เท่านั้น)

import { type NextRequest } from 'next/server';

const PHOTO_API_URL = process.env.NEXT_PUBLIC_PHOTO_API_URL;
const PHOTO_API_KEY = process.env.PHOTO_API_KEY; // ไม่มี NEXT_PUBLIC_ → ไม่ถึง browser

export async function GET(request: NextRequest) {
  if (!PHOTO_API_URL || !PHOTO_API_KEY) {
    return Response.json({ error: 'Photo server not configured' }, { status: 503 });
  }

  // ส่งต่อ query string ทั้งหมดไปยัง Photo Server
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${PHOTO_API_URL}/api/photos${searchParams ? `?${searchParams}` : ''}`;

  // อ่าน vehicle_id จาก request header เพื่อส่งต่อ (ไม่ได้ใช้ role)
  const vehicleId = request.headers.get('x-vehicle-id') || '';

  try {
    const upstream = await fetch(url, {
      headers: {
        'x-api-key':     PHOTO_API_KEY,
        'x-vehicle-id':  vehicleId,
        'ngrok-skip-browser-warning': 'true',
      },
      cache: 'no-store',
    });

    const data = await upstream.json();
    return Response.json(data, { status: upstream.status });
  } catch (err) {
    console.error('[Proxy] GET /api/photos error:', err);
    return Response.json({ error: 'Photo server unreachable' }, { status: 502 });
  }
}
