/**
 * Portal session helpers — persist the verified customer session in localStorage
 * so the dashboard survives a page refresh.
 *
 * The session is keyed by company slug so a session for company A is never
 * reused when the user navigates to company B's portal.
 */

interface PortalSession {
  email: string;
  companySlug: string;
  verified: boolean;
  verifiedAt: string; // ISO 8601
}

const sessionKey = (slug: string) => `portal_session_${slug}`;

export function savePortalSession(slug: string, email: string): void {
  const session: PortalSession = {
    email,
    companySlug: slug,
    verified: true,
    verifiedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(sessionKey(slug), JSON.stringify(session));
  } catch {
    // localStorage may be unavailable in private-browsing or SSR context
  }
}

/** Returns a valid session for the given slug, or null if none exists. */
export function getPortalSession(slug: string): PortalSession | null {
  try {
    const raw = localStorage.getItem(sessionKey(slug));
    if (!raw) return null;
    const session = JSON.parse(raw) as PortalSession;
    // Guard: session must belong to exactly this slug and be verified
    if (session.companySlug !== slug || !session.verified || !session.email) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function clearPortalSession(slug: string): void {
  try {
    localStorage.removeItem(sessionKey(slug));
  } catch {
    // ignore
  }
}
