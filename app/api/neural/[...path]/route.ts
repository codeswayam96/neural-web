import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Use server-side var first, fall back to public var, then localhost
const NEURAL_API =
  process.env.NEURAL_API_URL ||
  process.env.NEXT_PUBLIC_NEURAL_API_URL ||
  'http://localhost:3006';

async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const url = new URL(`${NEURAL_API}/${path.join('/')}${req.nextUrl.search}`);

  const cookieStore = await cookies();
  const token = cookieStore.get('Authentication')?.value;

  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  // Forward API key header for SDK-authenticated calls
  const apiKey = req.headers.get('x-api-key');
  if (apiKey) headers.set('x-api-key', apiKey);

  const body = req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined;

  try {
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
  } catch (err: any) {
    const isConnRefused = err?.cause?.code === 'ECONNREFUSED' || err?.cause?.code === 'ETIMEDOUT';
    return NextResponse.json(
      { message: isConnRefused ? 'NeuralAPI is offline or unreachable' : 'Proxy error', detail: err?.message },
      { status: 503 },
    );
  }
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
