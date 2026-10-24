/**
 * Portal API service — all customer-portal webhook calls go through here.
 * Base URL is read from NEXT_PUBLIC_N8N_BASE_URL or falls back to the
 * known production domain.
 */

import { clearPortalSession, getPortalSession } from './portalSession';
import { splitAppointments } from './appointmentLists';

/** Thrown when the backend no longer accepts the stored session. */
export class PortalSessionExpiredError extends Error {
  constructor() {
    super('Seja je potekla. Prosimo, prijavite se znova.');
    this.name = 'PortalSessionExpiredError';
  }
}

const N8N_BASE =
  process.env.NEXT_PUBLIC_N8N_BASE_URL ?? 'https://n8n.jedroplus.com/webhook';

// ─── Shared types ────────────────────────────────────────────────────────────

interface BaseResponse {
  success: boolean;
  message?: string;
  code?: string;
}

/** Raw appointment shape as returned by the backend (snake_case or camelCase). */
interface RawAppointment {
  id: string;
  // Backend may use either casing
  serviceName?: string;
  service_name?: string;
  employeeName?: string;
  employee_name?: string;
  date: string;
  time: string;
  end_time?: string;
  durationMinutes?: number;
  duration_minutes?: number;
  status?: string;
  belezi_termin?: boolean;
  deleted_at?: string | null;
  notes?: string;
  price?: number | null;
  final_price?: number | null;
  paid?: boolean;
  location?: string;
}

/** Normalised appointment shape used throughout the frontend. */
export interface NormalisedAppointment {
  id: string;
  serviceName: string;
  employeeName: string;
  date: string;
  time: string;
  endTime: string;
  durationMinutes: number;
  status: string;
  notes: string;
  price: number | null;
  finalPrice: number | null;
  paid: boolean;
  location: string;
}

function normaliseAppointment(raw: RawAppointment): NormalisedAppointment {
  return {
    id: raw.id,
    serviceName: raw.serviceName ?? raw.service_name ?? '',
    employeeName: raw.employeeName ?? raw.employee_name ?? '',
    date: raw.date,
    time: raw.time,
    endTime: raw.end_time ?? '',
    durationMinutes: raw.durationMinutes ?? raw.duration_minutes ?? 0,
    status: raw.status ?? '',
    notes: raw.notes ?? '',
    price: raw.price ?? null,
    finalPrice: raw.final_price ?? null,
    paid: raw.paid ?? false,
    location: raw.location ?? '',
  };
}

// ─── Core fetch helper ───────────────────────────────────────────────────────

/**
 * POST to a customer-portal n8n webhook.
 * Throws with the backend's `message` if success === false or HTTP error.
 */
async function portalPost<T extends BaseResponse>(
  path: string,
  payload: Record<string, string>
): Promise<T> {
  // Every call after login carries the session token from verify; the
  // backend no longer trusts company_slug + email alone.
  const slug = payload.company_slug;
  const sessionToken = slug ? getPortalSession(slug)?.sessionToken : undefined;
  const body = sessionToken && !payload.session_token ? { ...payload, session_token: sessionToken } : payload;
  let res: Response;
  try {
    res = await fetch(`${N8N_BASE}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Napaka pri komunikaciji s strežnikom.');
  }

  let data: T;
  try {
    data = (await res.json()) as T;
  } catch {
    throw new Error('Strežnik je vrnil nepričakovan odgovor.');
  }

  if (data.code === 'SESSION_INVALID') {
    if (slug) clearPortalSession(slug);
    throw new PortalSessionExpiredError();
  }

  if (!res.ok || data.success === false) {
    throw new Error(data.message ?? 'Prišlo je do napake. Poskusite znova.');
  }

  return data;
}

// ─── Public API functions ─────────────────────────────────────────────────────

/** Step 1 — send magic-link email. */
export async function portalLogin(
  companySlug: string,
  email: string
): Promise<void> {
  await portalPost<BaseResponse>('customer-portal-login', {
    company_slug: companySlug,
    email,
  });
}

/** Step 2 — verify magic-link token; returns customer info if available. */
export interface VerifyResponse extends BaseResponse {
  /** Session token for the calls that follow (save with savePortalSession). */
  session_token?: string;
  customer?: {
    firstName?: string;
    first_name?: string;
    email?: string;
  };
}

export async function portalVerify(
  companySlug: string,
  email: string,
  token: string
): Promise<VerifyResponse> {
  return portalPost<VerifyResponse>('customer-portal-verify', {
    company_slug: companySlug,
    email,
    token,
  });
}

/** Fetch all appointments for the verified customer. */
export interface AppointmentsResponse extends BaseResponse {
  company_name?: string;
  customer?: {
    firstName?: string;
    first_name?: string;
    email?: string;
  };
  appointments?: {
    all?: RawAppointment[];
    upcoming?: RawAppointment[];
    past?: RawAppointment[];
  };
}

export interface FetchedAppointments {
  all: NormalisedAppointment[];
  upcoming: NormalisedAppointment[];
  past: NormalisedAppointment[];
  customerFirstName: string;
  companyName: string;
}

export async function getPortalAppointments(
  companySlug: string,
  email: string
): Promise<FetchedAppointments> {
  const data = await portalPost<AppointmentsResponse>(
    'customer-portal-appointments',
    { company_slug: companySlug, email }
  );

  // The backend's pre-split lists have historically misclassified Slovenian
  // statuses. Always classify from the complete list in salon local time.
  const raw = data.appointments?.all ?? [
    ...(data.appointments?.upcoming ?? []),
    ...(data.appointments?.past ?? []),
  ];
  const all = raw
    .filter((a) => a.belezi_termin !== false && !a.deleted_at && a.date && a.time)
    .map(normaliseAppointment);
  const { upcoming: resolvedUpcoming, past: resolvedPast } = splitAppointments(all);

  const customerFirstName =
    data.customer?.firstName ?? data.customer?.first_name ?? '';
  const companyName = data.company_name ?? '';

  return {
    all,
    upcoming: resolvedUpcoming,
    past: resolvedPast,
    customerFirstName,
    companyName,
  };
}

export interface LoyaltySummary {
  enabled: boolean;
  visits: number;
  points: number;
  reward_threshold: number;
  reward_name: string;
  redeemed_points: number;
}

export async function getPortalLoyalty(companySlug: string, email: string): Promise<{
  loyalty: LoyaltySummary | null;
  ambiguous: boolean;
}> {
  const sessionToken = getPortalSession(companySlug)?.sessionToken;
  if (!sessionToken) throw new PortalSessionExpiredError();
  const response = await fetch(`/api/loyalty/${encodeURIComponent(companySlug)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, session_token: sessionToken }),
    cache: 'no-store',
  });
  if (response.status === 401) {
    clearPortalSession(companySlug);
    throw new PortalSessionExpiredError();
  }
  if (!response.ok) throw new Error('Kartice zvestobe trenutno ni mogoče naložiti.');
  const data = await response.json() as { loyalty?: LoyaltySummary | null; ambiguous?: boolean };
  return { loyalty: data.loyalty ?? null, ambiguous: data.ambiguous === true };
}

export interface PortalAnnouncement {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  published_at: string;
  read_at: string | null;
}

async function portalAnnouncementRequest(
  companySlug: string, email: string, method: 'POST' | 'PATCH', announcementId?: string,
): Promise<Response> {
  const sessionToken = getPortalSession(companySlug)?.sessionToken;
  if (!sessionToken) throw new PortalSessionExpiredError();
  const response = await fetch(`/api/announcements/${encodeURIComponent(companySlug)}`, {
    method, headers: { 'Content-Type': 'application/json' }, cache: 'no-store',
    body: JSON.stringify({ email, session_token: sessionToken, ...(announcementId ? { announcement_id: announcementId } : {}) }),
  });
  if (response.status === 401) {
    clearPortalSession(companySlug);
    throw new PortalSessionExpiredError();
  }
  if (!response.ok) throw new Error('Obvestil trenutno ni mogoče naložiti.');
  return response;
}

export async function getPortalAnnouncements(companySlug: string, email: string): Promise<PortalAnnouncement[]> {
  const response = await portalAnnouncementRequest(companySlug, email, 'POST');
  const data = await response.json() as { announcements?: PortalAnnouncement[] };
  return data.announcements ?? [];
}

export async function markPortalAnnouncementRead(companySlug: string, email: string, announcementId: string): Promise<void> {
  await portalAnnouncementRequest(companySlug, email, 'PATCH', announcementId);
}

export interface PortalProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  marketingConsent: boolean;
}

export class PortalProfileConflictError extends Error {
  constructor(public reason: 'ambiguous_customer' | 'customer_not_found') {
    super(reason);
  }
}

async function profileRequest(companySlug: string, email: string, method: 'POST' | 'PATCH', profile?: PortalProfile): Promise<PortalProfile> {
  const sessionToken = getPortalSession(companySlug)?.sessionToken;
  if (!sessionToken) throw new PortalSessionExpiredError();
  const response = await fetch(`/api/profile/${encodeURIComponent(companySlug)}`, {
    method, headers: { 'Content-Type': 'application/json' }, cache: 'no-store',
    body: JSON.stringify({ email, session_token: sessionToken, ...(profile ? {
      firstName: profile.firstName, lastName: profile.lastName, phone: profile.phone,
      marketingConsent: profile.marketingConsent,
    } : {}) }),
  });
  if (response.status === 401) {
    clearPortalSession(companySlug);
    throw new PortalSessionExpiredError();
  }
  const data = await response.json().catch(() => ({})) as { profile?: PortalProfile; error?: string };
  if (response.status === 409 && (data.error === 'ambiguous_customer' || data.error === 'customer_not_found')) {
    throw new PortalProfileConflictError(data.error);
  }
  if (!response.ok || !data.profile) throw new Error('Profila trenutno ni mogoče shraniti ali naložiti.');
  return data.profile;
}

export function getPortalProfile(companySlug: string, email: string) {
  return profileRequest(companySlug, email, 'POST');
}

export function savePortalProfile(companySlug: string, email: string, profile: PortalProfile) {
  return profileRequest(companySlug, email, 'PATCH', profile);
}

/** Cancel a specific appointment. */
export async function cancelPortalAppointment(
  companySlug: string,
  email: string,
  appointmentId: string
): Promise<void> {
  await portalPost<BaseResponse>('customer-portal-cancel', {
    company_slug: companySlug,
    email,
    appointment_id: appointmentId,
  });
}

/** Fetch available time slots for rescheduling. */
export interface SlotsResponse extends BaseResponse {
  slots?: string[];
  requested_date?: string;
}

export async function getPortalRescheduleSlots(
  companySlug: string,
  email: string,
  appointmentId: string,
  newDate: string
): Promise<string[]> {
  const data = await portalPost<SlotsResponse>(
    'customer-portal-reschedule-slots',
    {
      company_slug: companySlug,
      email,
      appointment_id: appointmentId,
      new_date: newDate,
    }
  );
  return data.slots ?? [];
}

/** Payload for the reschedule-confirm webhook. */
export interface RescheduleConfirmPayload {
  companySlug: string;
  date: string;
  time: string;
  customerEmail: string;
  original_appointment_id: string;
  appointment_row_id?: string;
  serviceId?: string;
  employeeId?: string;
  customerName?: string;
  customerPhone?: string;
  customerGender?: string;
  customerNote?: string;
}

/** Confirm the chosen date/time for rescheduling.
 *  Routes through the Next.js API proxy to avoid CORS preflight issues. */
export async function confirmPortalReschedule(
  p: RescheduleConfirmPayload
): Promise<void> {
  const sessionToken = getPortalSession(p.companySlug)?.sessionToken;
  const body: Record<string, string> = {
    company_slug: p.companySlug,
    email: p.customerEmail,
    ...(sessionToken ? { session_token: sessionToken } : {}),
    appointment_id: p.original_appointment_id,
    ...(p.appointment_row_id ? { appointment_row_id: p.appointment_row_id } : {}),
    new_date: p.date,
    new_time: p.time,
    ...(p.serviceId ? { service_id: p.serviceId } : {}),
    ...(p.employeeId ? { employee_id: p.employeeId } : {}),
    ...(p.customerName ? { customer_name: p.customerName } : {}),
    ...(p.customerPhone ? { customer_phone: p.customerPhone } : {}),
    ...(p.customerGender ? { customer_gender: p.customerGender } : {}),
    ...(p.customerNote ? { customer_note: p.customerNote } : {}),
  };

  let res: Response;
  try {
    res = await fetch('/api/reschedule-confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Napaka pri komunikaciji s strežnikom.');
  }

  let data: BaseResponse;
  try {
    data = (await res.json()) as BaseResponse;
  } catch {
    throw new Error('Strežnik je vrnil nepričakovan odgovor.');
  }

  if (data.code === 'SESSION_INVALID') {
    clearPortalSession(p.companySlug);
    throw new PortalSessionExpiredError();
  }

  if (!res.ok || data.success === false) {
    throw new Error(data.message ?? 'Prišlo je do napake. Poskusite znova.');
  }
}
