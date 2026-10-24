import type { NormalisedAppointment } from './portalApi';

export function appointmentStatus(status: string): 'active' | 'cancelled' | 'no_show' | 'completed' {
  const value = status.toLowerCase().trim();
  if (/cancel|odpoved|preklic|storn/.test(value)) return 'cancelled';
  if (/no.?show|ni.?prišel|ni.?prisel/.test(value)) return 'no_show';
  if (/complet|zaklju|končan|koncan|done/.test(value)) return 'completed';
  return 'active';
}

export function splitAppointments(all: NormalisedAppointment[], nowDate = new Date()) {
  // The database stores salon dates and times as local wall time.
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Ljubljana',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(nowDate);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? '';
  const now = `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}`;
  const upcoming = all.filter((appointment) =>
    appointmentStatus(appointment.status) === 'active' &&
    `${appointment.date.slice(0, 10)}T${appointment.time.slice(0, 5)}` >= now
  );
  const upcomingIds = new Set(upcoming.map((appointment) => appointment.id));
  return {
    upcoming,
    past: all.filter((appointment) => !upcomingIds.has(appointment.id)),
  };
}
