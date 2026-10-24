import { NextRequest, NextResponse } from 'next/server';
import { portalCompanyForSession, PortalUnauthorizedError, portalSupabase } from '../../portalSessionServer';

type Row = Record<string, unknown>;

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  const slug = params.slug;
  if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(slug)) {
    return NextResponse.json({ error: 'Invalid company' }, { status: 400 });
  }
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const token = typeof body?.session_token === 'string' ? body.session_token : '';
  if (!email || email.length > 254 || !token || token.length > 512) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const companyId = await portalCompanyForSession(slug, email, token);

    // An email shared by two customer records cannot identify whose points
    // should be shown. Leave it for the salon to resolve.
    const escapedEmail = email.replace(/[\\%_]/g, '\\$&');
    const customerQuery = new URLSearchParams({
      select: 'ID stranke,Email stranke', 'ID Podjetja': `eq.${companyId}`,
      'Email stranke': `ilike.${escapedEmail}`, limit: '20',
    });
    const rows = await portalSupabase(`Stranke?${customerQuery}`) as Row[];
    const customers = rows.filter((row) => typeof row['Email stranke'] === 'string' && row['Email stranke'].trim().toLowerCase() === email);
    if (customers.length > 1) {
      return NextResponse.json({ ok: true, ambiguous: true }, { headers: { 'Cache-Control': 'no-store' } });
    }
    if (customers.length === 0 || typeof customers[0]['ID stranke'] !== 'string') {
      return NextResponse.json({ ok: true, loyalty: null }, { headers: { 'Cache-Control': 'no-store' } });
    }
    const loyalty = await portalSupabase('rpc/loyalty_summary', {
      method: 'POST', body: JSON.stringify({
        p_company_id: companyId, p_customer_id: customers[0]['ID stranke'],
      }),
    });
    return NextResponse.json({ ok: true, loyalty }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof PortalUnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Could not load loyalty' }, { status: 502 });
  }
}
