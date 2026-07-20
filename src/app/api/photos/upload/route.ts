// src/app/api/photos/upload/route.ts
// POST /api/photos/upload — proxy อัปโหลดรูปไปยัง Photo Server

import { type NextRequest } from 'next/server';

const PHOTO_API_URL = process.env.NEXT_PUBLIC_PHOTO_API_URL;
const PHOTO_API_KEY = process.env.PHOTO_API_KEY;

export async function POST(request: NextRequest) {
  if (!PHOTO_API_URL || !PHOTO_API_KEY) {
    return Response.json({ error: 'Photo server not configured' }, { status: 503 });
  }

  // อ่าน vehicle_id จาก header (ระบุว่ารถคันไหนกำลังอัปโหลด)
  const vehicleId = request.headers.get('x-vehicle-id') || '';

  try {
    // อ่าน FormData จาก request แล้วส่งต่อตรงๆ ไปยัง Photo Server
    const formData = await request.formData();

    const upstream = await fetch(`${PHOTO_API_URL}/api/upload`, {
      method: 'POST',
      headers: {
        'x-api-key':    PHOTO_API_KEY,
        'x-vehicle-id': vehicleId,
        'ngrok-skip-browser-warning': 'true',
        // ไม่ต้องส่ง x-user-role — Photo Server กำหนด role จาก API Key เอง
      },
      body: formData,
    });

    const data = await upstream.json();
    return Response.json(data, { status: upstream.status });
  } catch (err) {
    console.error('[Proxy] POST upload error:', err);
    return Response.json({ error: 'Photo server unreachable' }, { status: 502 });
  }
}
