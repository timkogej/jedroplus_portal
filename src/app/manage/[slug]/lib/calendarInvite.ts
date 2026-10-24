import type { Appointment } from './mockData';

const localDateTime = (date: string, time: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}(?::\d{2})?$/.test(time)) return null;
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const value = new Date(Date.UTC(year, month - 1, day, hour, minute));
  if (value.getUTCFullYear() !== year || value.getUTCMonth() !== month - 1 || value.getUTCDate() !== day || hour > 23 || minute > 59) return null;
  return value;
};

const stamp = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
const localStamp = (date: Date) => stamp(date).slice(0, -1);
const escapeText = (text: string) => text.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');

function fold(line: string): string {
  const parts: string[] = [];
  let current = '';
  let bytes = 0;
  for (const character of line) {
    const size = new TextEncoder().encode(character).length;
    if (bytes + size > 73 && current) { parts.push(current); current = ' '; bytes = 1; }
    current += character;
    bytes += size;
  }
  parts.push(current);
  return parts.join('\r\n');
}

export function calendarInvite(appointment: Appointment, companyName: string, companySlug: string): string | null {
  const start = localDateTime(appointment.date, appointment.time);
  if (!start) return null;
  const end = appointment.endTime ? localDateTime(appointment.date, appointment.endTime) : null;
  const computedEnd = end && end > start ? end : new Date(start.getTime() + Math.max(1, appointment.durationMinutes || 60) * 60000);
  const safeId = appointment.id.replace(/[^a-zA-Z0-9_-]/g, '');
  const safeSlug = companySlug.replace(/[^a-zA-Z0-9-]/g, '');
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Jedroplus//Customer Portal//EN',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VTIMEZONE', 'TZID:Europe/Ljubljana',
    'BEGIN:DAYLIGHT', 'TZOFFSETFROM:+0100', 'TZOFFSETTO:+0200',
    'TZNAME:CEST', 'DTSTART:19700329T020000', 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU', 'END:DAYLIGHT',
    'BEGIN:STANDARD', 'TZOFFSETFROM:+0200', 'TZOFFSETTO:+0100',
    'TZNAME:CET', 'DTSTART:19701025T030000', 'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU', 'END:STANDARD',
    'END:VTIMEZONE', 'BEGIN:VEVENT',
    `UID:${safeId}-${safeSlug}@portal.jedroplus.com`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART;TZID=Europe/Ljubljana:${localStamp(start)}`,
    `DTEND;TZID=Europe/Ljubljana:${localStamp(computedEnd)}`,
    `SUMMARY:${escapeText([appointment.serviceName, companyName].filter(Boolean).join(' – '))}`,
    ...(appointment.location ? [`LOCATION:${escapeText(appointment.location)}`] : []),
    ...(appointment.employeeName ? [`DESCRIPTION:${escapeText(appointment.employeeName)}`] : []),
    'END:VEVENT', 'END:VCALENDAR',
  ];
  return lines.map(fold).join('\r\n') + '\r\n';
}

export function downloadCalendarInvite(appointment: Appointment, companyName: string, companySlug: string): boolean {
  const content = calendarInvite(appointment, companyName, companySlug);
  if (!content) return false;
  const url = URL.createObjectURL(new Blob([content], { type: 'text/calendar;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `termin-${appointment.date}-${appointment.time.replace(':', '')}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
