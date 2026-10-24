import { NextRequest, NextResponse } from 'next/server';

const EMPTY = { company: null, theme: null };

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function color(value: unknown): string | null {
  const candidate = text(value);
  return /^#[0-9a-f]{6}$/i.test(candidate) ? candidate : null;
}

function publicUrl(value: unknown): string | null {
  let candidate = text(value);
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(?::\d+)?(?:\/.*)?$/i.test(candidate)) {
    candidate = `https://${candidate}`;
  }
  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' && candidate.length <= 2048 ? url.toString() : null;
  } catch {
    return null;
  }
}

function enabled(value: unknown): boolean {
  return value === true || ['yes', 'true', '1', 'da'].includes(text(value).toLowerCase());
}

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const slug = params.slug;
  if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(slug)) {
    return NextResponse.json(EMPTY, { status: 400 });
  }

  const base = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) {
    return NextResponse.json(EMPTY, { status: 503 });
  }

  const url = new URL(`${base.replace(/\/$/, '')}/rest/v1/Podatki%20podjetij`);
  url.searchParams.set('select', '*');
  url.searchParams.set('slug', `eq.${slug}`);
  url.searchParams.set('limit', '1');

  try {
    const response = await fetch(url, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: 'no-store',
    });
    if (!response.ok) throw new Error('company lookup failed');
    const rows = (await response.json()) as Record<string, unknown>[];
    const row = rows[0];
    if (!row) return NextResponse.json(EMPTY, { status: 404 });

    const company = {
      name: text(row['Naziv podjetja']) || text(row['Naziv Podjetja']),
      slug,
      phone: text(row['Kontaktni telefon']),
      email: text(row['Kontaktni_email']),
      address: text(row['Naslov podjetja']),
      website: publicUrl(row['Spletna stran']),
      logoUrl: publicUrl(row['logo_url']),
      bookingEnabled: enabled(row['booking_omogocen']),
    };
    const theme = {
      primaryColor: color(row['Booking_primary']),
      secondaryColor: color(row['Booking_secondary']),
      bgFrom: color(row['Booking_bg_from']),
      bgTo: color(row['Booking_bg_to']),
    };
    return NextResponse.json({ company, theme }, {
      headers: { 'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch {
    return NextResponse.json(EMPTY, { status: 502 });
  }
}
