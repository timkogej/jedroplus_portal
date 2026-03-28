/**
 * Portal API service — all customer-portal webhook calls go through here.
 * Base URL is read from NEXT_PUBLIC_N8N_BASE_URL or falls back to the
 * known production domain.
 */

const N8N_BASE =
  process.env.NEXT_PUBLIC_N8N_BASE_URL ?? 'https://tikej.app.n8n.cloud/webhook';

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
  status: 'upcoming' | 'past' | 'cancelled';
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
  status: 'upcoming' | 'past' | 'cancelled';
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
    status: raw.status,
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
  let res: Response;
  try {
    res = await fetch(`${N8N_BASE}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
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
}

export async function getPortalAppointments(
  companySlug: string,
  email: string
): Promise<FetchedAppointments> {
  const data = await portalPost<AppointmentsResponse>(
    'customer-portal-appointments',
    { company_slug: companySlug, email }
  );

  const all = (data.appointments?.all ?? []).map(normaliseAppointment);
  const upcoming = (data.appointments?.upcoming ?? []).map(normaliseAppointment);
  const past = (data.appointments?.past ?? []).map(normaliseAppointment);

  // Derive lists from `all` if the backend only returns that field
  const resolvedUpcoming =
    upcoming.length > 0
      ? upcoming
      : all.filter((a) => a.status === 'upcoming');
  const resolvedPast =
    past.length > 0 ? past : all.filter((a) => a.status === 'past');

  const customerFirstName =
    data.customer?.firstName ?? data.customer?.first_name ?? '';

  return {
    all,
    upcoming: resolvedUpcoming,
    past: resolvedPast,
    customerFirstName,
  };
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

/** Confirm the chosen date/time for rescheduling. */
export async function confirmPortalReschedule(
  p: RescheduleConfirmPayload
): Promise<void> {
  const body: Record<string, string> = {
    company_slug: p.companySlug,
    email: p.customerEmail,
    appointment_id: p.original_appointment_id,
    appointment_row_id: p.appointment_row_id ?? p.original_appointment_id,
    new_date: p.date,
    new_time: p.time,
    ...(p.serviceId ? { service_id: p.serviceId } : {}),
    ...(p.employeeId ? { employee_id: p.employeeId } : {}),
    ...(p.customerName ? { customer_name: p.customerName } : {}),
    ...(p.customerPhone ? { customer_phone: p.customerPhone } : {}),
    ...(p.customerGender ? { customer_gender: p.customerGender } : {}),
    ...(p.customerNote ? { customer_note: p.customerNote } : {}),
  };
  await portalPost<BaseResponse>('customer-portal-reschedule-confirm', body);
}
