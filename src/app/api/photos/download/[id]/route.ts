// src/app/api/photos/download/[id]/route.ts
// GET /api/photos/download/:id — proxy ดาวน์โหลดรูปเดี่ยว (full size)

import { type NextRequest } from 'next/server';

const PHOTO_API_URL = process.env.NEXT_PUBLIC_PHOTO_API_URL;
const PHOTO_API_KEY = process.env.PHOTO_API_KEY;

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  if (!PHOTO_API_URL || !PHOTO_API_KEY) {
    return Response.json({ error: 'Photo server not configured' }, { status: 503 });
  }

  const { id } = await params;

  try {
    const upstream = await fetch(`${PHOTO_API_URL}/api/download/${id}`, {
      headers: { 'x-api-key': PHOTO_API_KEY },
    });

    if (!upstream.ok) {
      return new Response(null, { status: upstream.status });
    }

    const blob = await upstream.blob();
    const contentDisposition = upstream.headers.get('Content-Disposition') || `attachment; filename="CCOC_${id.substring(0, 8)}.jpg"`;

    return new Response(blob, {
      status: 200,
      headers: {
        'Content-Type':        'image/jpeg',
        'Content-Disposition': contentDisposition,
      },
    });
  } catch (err) {
    console.error('[Proxy] GET download/:id error:', err);
    return new Response(null, { status: 502 });
  }
}
