import { NextRequest, NextResponse } from 'next/server';
import { portalCompanyForSession, PortalUnauthorizedError, portalServiceKey, portalSupabase, portalSupabaseBase } from '../../portalSessionServer';

type Row = Record<string, unknown>;
const noStore = { 'Cache-Control': 'no-store' };

async function imageUrl(path: unknown): Promise<string | null> {
  if (typeof path !== 'string' || !path || !/^[a-zA-Z0-9/_-]+\.(png|jpg|webp)$/.test(path)) return null;
  const key = portalServiceKey();
  const encoded = path.split('/').map(encodeURIComponent).join('/');
  const response = await fetch(`${portalSupabaseBase()}/storage/v1/object/sign/portal-announcements/${encoded}`, {
    method: 'POST', headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ expiresIn: 3600 }), cache: 'no-store',
  });
  if (!response.ok) return null;
  const data = await response.json() as { signedURL?: string };
  if (!data.signedURL) return null;
  if (data.signedURL.startsWith('http')) return data.signedURL;
  if (data.signedURL.startsWith('/storage/v1/')) return `${portalSupabaseBase()}${data.signedURL}`;
  return `${portalSupabaseBase()}/storage/v1/${data.signedURL.replace(/^\/+/, '')}`;
}

async function authorized(request: NextRequest, slug: string) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const token = typeof body?.session_token === 'string' ? body.session_token : '';
  const companyId = await portalCompanyForSession(slug, email, token);
  return { companyId, email, body };
}

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { companyId, email } = await authorized(request, params.slug);
    const base = { select: 'id,title,body,image_path,published_at,audience', company_id: `eq.${companyId}`,
      status: 'eq.published', published_at: `lte.${new Date().toISOString()}`, limit: '30', order: 'published_at.desc' };
    const allQuery = new URLSearchParams({ ...base, audience: 'eq.all' });
    const directQuery = new URLSearchParams({ ...base, audience: 'eq.customer', recipient_email: `eq.${email}` });
    const [all, direct] = await Promise.all([
      portalSupabase(`portal_announcements?${allQuery}`) as Promise<Row[]>,
      portalSupabase(`portal_announcements?${directQuery}`) as Promise<Row[]>,
    ]);
    const announcements = [...all, ...direct]
      .sort((a, b) => String(b.published_at).localeCompare(String(a.published_at))).slice(0, 30);
    const ids = announcements.map((row) => String(row.id));
    const reads = ids.length ? await portalSupabase(`portal_announcement_reads?${new URLSearchParams({
      select: 'announcement_id,read_at', email: `eq.${email}`, announcement_id: `in.(${ids.join(',')})`,
    })}`) as Row[] : [];
    const readAt = new Map(reads.map((row) => [row.announcement_id, row.read_at]));
    const result = await Promise.all(announcements.map(async (row) => ({
      id: row.id, title: row.title, body: row.body, published_at: row.published_at,
      read_at: readAt.get(row.id) ?? null,
      image_url: await imageUrl(row.image_path),
    })));
    return NextResponse.json({ ok: true, announcements: result }, { headers: noStore });
  } catch (error) {
    if (error instanceof PortalUnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Could not load announcements' }, { status: 502 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { companyId, email, body } = await authorized(request, params.slug);
    const id = body?.announcement_id;
    if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)) {
      return NextResponse.json({ error: 'Invalid announcement' }, { status: 400 });
    }
    const query = new URLSearchParams({
      select: 'id,audience,recipient_email', company_id: `eq.${companyId}`,
      id: `eq.${id}`, status: 'eq.published', published_at: `lte.${new Date().toISOString()}`, limit: '1',
    });
    const rows = await portalSupabase(`portal_announcements?${query}`) as Row[];
    const item = rows[0];
    if (!item || (item.audience !== 'all' && item.recipient_email !== email)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    await portalSupabase('portal_announcement_reads?on_conflict=announcement_id,email', {
      method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' },
      body: JSON.stringify({ announcement_id: id, email }),
    });
    return NextResponse.json({ ok: true }, { headers: noStore });
  } catch (error) {
    if (error instanceof PortalUnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Could not mark announcement read' }, { status: 502 });
  }
}
