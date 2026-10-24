import 'server-only';

export class PortalUnauthorizedError extends Error {}

export function portalServiceKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('Supabase service unavailable');
  return key;
}

export function portalSupabaseBase(): string {
  const base = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) throw new Error('Supabase service unavailable');
  return base.replace(/\/$/, '');
}

export async function portalSupabase(path: string, init?: RequestInit): Promise<unknown> {
  const key = portalServiceKey();
  const response = await fetch(`${portalSupabaseBase()}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key, Authorization: `Bearer ${key}`,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('Supabase request failed');
  const body = await response.text();
  return body ? JSON.parse(body) : null;
}

export async function portalCompanyForSession(slug: string, email: string, token: string): Promise<string> {
  if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(slug) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
      !token || token.length > 512) throw new PortalUnauthorizedError();
  const valid = await portalSupabase('rpc/portal_session_check', {
    method: 'POST', body: JSON.stringify({ p_slug: slug, p_email: email, p_token: token }),
  });
  if (valid !== true) throw new PortalUnauthorizedError();
  const query = new URLSearchParams({ select: 'ID Podjetja', slug: `eq.${slug}`, limit: '1' });
  const companies = await portalSupabase(`Podatki%20podjetij?${query}`) as Record<string, unknown>[];
  const companyId = companies[0]?.['ID Podjetja'];
  if (typeof companyId !== 'string' || !companyId) throw new Error('Company not found');
  return companyId;
}
