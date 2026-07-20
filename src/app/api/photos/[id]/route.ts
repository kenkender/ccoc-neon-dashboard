// src/app/api/photos/[id]/route.ts
// GET  /api/photos/:id/thumb — proxy รูป thumbnail
// GET  /api/photos/:id/full  — proxy รูป full
// DELETE /api/photos/:id     — proxy ลบรูป (ใช้ USER key เสมอ — ตรวจ ownership ที่ Photo Server)

import { type NextRequest } from 'next/server';

const PHOTO_API_URL = process.env.NEXT_PUBLIC_PHOTO_API_URL;
const PHOTO_API_KEY = process.env.PHOTO_API_KEY;

type Context = { params: Promise<{ id: string }> };

// ─── Helper ──────────────────────────────────────────────────────────────────
async function proxyImageGet(photoId: string, size: 'thumb' | 'full', apiKey: string) {
  const url = `${PHOTO_API_URL}/api/photos/${photoId}/${size}`;
  const upstream = await fetch(url, {
    headers: { 'x-api-key': apiKey },
    cache: 'no-store',
  });

  if (!upstream.ok) {
    return new Response(null, { status: upstream.status });
  }

  const blob = await upstream.blob();
  return new Response(blob, {
    status: 200,
    headers: {
      'Content-Type':  'image/jpeg',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}

// ─── GET /api/photos/:id/thumb?size=thumb|full ────────────────────────────────
// รองรับ ?size=thumb หรือ ?size=full เพื่อให้ใช้ URL เดียวได้
export async function GET(request: NextRequest, { params }: Context) {
  if (!PHOTO_API_URL || !PHOTO_API_KEY) {
    return Response.json({ error: 'Photo server not configured' }, { status: 503 });
  }

  const { id } = await params;
  const size = (request.nextUrl.searchParams.get('size') as 'thumb' | 'full') || 'thumb';

  try {
    return await proxyImageGet(id, size, PHOTO_API_KEY);
  } catch (err) {
    console.error('[Proxy] GET photo error:', err);
    return new Response(null, { status: 502 });
  }
}

// ─── DELETE /api/photos/:id ───────────────────────────────────────────────────
export async function DELETE(request: NextRequest, { params }: Context) {
  if (!PHOTO_API_URL || !PHOTO_API_KEY) {
    return Response.json({ error: 'Photo server not configured' }, { status: 503 });
  }

  const { id } = await params;

  // อ่าน vehicle_id จาก header เพื่อส่งต่อ (ใช้ตรวจ ownership ที่ Photo Server)
  const vehicleId = request.headers.get('x-vehicle-id') || '';

  try {
    const upstream = await fetch(`${PHOTO_API_URL}/api/photos/${id}`, {
      method: 'DELETE',
      headers: {
        'x-api-key':    PHOTO_API_KEY, // USER key → Photo Server ตรวจ ownership เอง
        'x-vehicle-id': vehicleId,
      },
    });

    const data = await upstream.json();
    return Response.json(data, { status: upstream.status });
  } catch (err) {
    console.error('[Proxy] DELETE photo error:', err);
    return Response.json({ error: 'Photo server unreachable' }, { status: 502 });
  }
}
