// src/app/api/photos/download/route.ts
// POST /api/photos/download — proxy bulk ZIP download

import { type NextRequest } from 'next/server';

const PHOTO_API_URL = process.env.NEXT_PUBLIC_PHOTO_API_URL;
const PHOTO_API_KEY = process.env.PHOTO_API_KEY;

export async function POST(request: NextRequest) {
  if (!PHOTO_API_URL || !PHOTO_API_KEY) {
    return Response.json({ error: 'Photo server not configured' }, { status: 503 });
  }

  try {
    const body = await request.json();

    const upstream = await fetch(`${PHOTO_API_URL}/api/download/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key':    PHOTO_API_KEY,
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify(body),
    });

    if (!upstream.ok) {
      const data = await upstream.json().catch(() => ({ error: 'Download failed' }));
      return Response.json(data, { status: upstream.status });
    }

    // Stream ZIP ส่งต่อ
    const zipName = `CCOC_Photos_Export_${new Date().toISOString().split('T')[0]}.zip`;
    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type':        'application/zip',
        'Content-Disposition': `attachment; filename="${zipName}"`,
      },
    });
  } catch (err) {
    console.error('[Proxy] POST download/bulk error:', err);
    return Response.json({ error: 'Photo server unreachable' }, { status: 502 });
  }
}
