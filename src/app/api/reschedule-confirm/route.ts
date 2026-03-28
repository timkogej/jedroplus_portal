import { NextRequest, NextResponse } from 'next/server';

const N8N_BASE =
  process.env.NEXT_PUBLIC_N8N_BASE_URL ?? 'https://tikej.app.n8n.cloud/webhook';

export async function POST(req: NextRequest) {
  const body = await req.json();

  let res: Response;
  try {
    res = await fetch(`${N8N_BASE}/customer-portal-reschedule-confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Napaka pri komunikaciji s strežnikom.' },
      { status: 502 }
    );
  }

  const data = await res.json().catch(() => ({ success: false }));
  return NextResponse.json(data, { status: res.status });
}
