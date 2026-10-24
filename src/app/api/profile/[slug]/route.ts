import { NextRequest, NextResponse } from 'next/server';
import { portalCompanyForSession, PortalUnauthorizedError, portalSupabase } from '../../portalSessionServer';

type CustomerRow = Record<string, unknown>;
const noStore = { 'Cache-Control': 'no-store' };

async function authorized(request: NextRequest, slug: string) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const token = typeof body?.session_token === 'string' ? body.session_token : '';
  const companyId = await portalCompanyForSession(slug, email, token);
  return { body, email, companyId };
}

async function findCustomer(companyId: string, email: string) {
  const escapedEmail = email.replace(/[\\%_]/g, '\\$&');
  const query = new URLSearchParams({
    select: '"ID stranke",Ime,Priimek,"Email stranke","Telefonska številka",marketing_consent,marketing_opt_out_at',
    'ID Podjetja': `eq.${companyId}`,
    'Email stranke': `ilike.${escapedEmail}`,
    limit: '20',
  });
  const rows = await portalSupabase(`Stranke?${query}`) as CustomerRow[];
  return rows.filter((row) => String(row['Email stranke'] ?? '').trim().toLowerCase() === email);
}

function publicProfile(row: CustomerRow) {
  return {
    firstName: String(row.Ime ?? ''),
    lastName: String(row.Priimek ?? ''),
    email: String(row['Email stranke'] ?? ''),
    phone: String(row['Telefonska številka'] ?? ''),
    marketingConsent: row.marketing_consent === true && !row.marketing_opt_out_at,
  };
}

function unavailable(count: number) {
  return NextResponse.json({ error: count > 1 ? 'ambiguous_customer' : 'customer_not_found' }, { status: 409, headers: noStore });
}

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { companyId, email } = await authorized(request, params.slug);
    const matches = await findCustomer(companyId, email);
    if (matches.length !== 1) return unavailable(matches.length);
    return NextResponse.json({ profile: publicProfile(matches[0]) }, { headers: noStore });
  } catch (error) {
    if (error instanceof PortalUnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Could not load profile' }, { status: 502 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { body, companyId, email } = await authorized(request, params.slug);
    const firstName = typeof body?.firstName === 'string' ? body.firstName.trim() : '';
    const lastName = typeof body?.lastName === 'string' ? body.lastName.trim() : '';
    const phone = typeof body?.phone === 'string' ? body.phone.trim() : '';
    if (!firstName || firstName.length > 50 || lastName.length > 50 ||
        (phone && !/^[\d\s+\-().]{6,20}$/.test(phone)) || typeof body?.marketingConsent !== 'boolean') {
      return NextResponse.json({ error: 'invalid_profile' }, { status: 400, headers: noStore });
    }
    const matches = await findCustomer(companyId, email);
    if (matches.length !== 1) return unavailable(matches.length);
    const id = matches[0]['ID stranke'];
    if (typeof id !== 'string' || !id) return unavailable(0);
    const escapedEmail = email.replace(/[\\%_]/g, '\\$&');
    const query = new URLSearchParams({
      select: 'Ime,Priimek,"Email stranke","Telefonska številka",marketing_consent,marketing_opt_out_at',
      'ID stranke': `eq.${id}`, 'ID Podjetja': `eq.${companyId}`, 'Email stranke': `ilike.${escapedEmail}`,
    });
    const updated = await portalSupabase(`Stranke?${query}`, {
      method: 'PATCH', headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        Ime: firstName, Priimek: lastName, 'Telefonska številka': phone || null,
        marketing_consent: body.marketingConsent,
        marketing_opt_out_at: body.marketingConsent ? null
          : matches[0].marketing_opt_out_at || (matches[0].marketing_consent === true ? new Date().toISOString() : null),
      }),
    }) as CustomerRow[];
    if (updated.length !== 1) return unavailable(0);
    return NextResponse.json({ profile: publicProfile(updated[0]) }, { headers: noStore });
  } catch (error) {
    if (error instanceof PortalUnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Could not save profile' }, { status: 502 });
  }
}
