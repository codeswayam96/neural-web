import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const NEURAL_API = process.env.NEXT_PUBLIC_NEURAL_API_URL || 'http://localhost:3006';

async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const url = new URL(`${NEURAL_API}/${path.join('/')}${req.nextUrl.search}`);

  const cookieStore = await cookies();
  const token = cookieStore.get('Authentication')?.value;

  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const body = req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined;

  const res = await fetch(url, {
    method: req.method,
    headers,
    body,
    cache: 'no-store',
  });

  const data = await res.text();
  return new NextResponse(data, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' },
  });
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
