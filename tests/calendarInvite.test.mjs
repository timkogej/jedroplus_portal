import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarInvite } from '../src/app/manage/[slug]/lib/calendarInvite.ts';

test('exports a Ljubljana appointment with a stable event id and safe text', () => {
  const event = {
    id: 'appointment-123', serviceName: 'Hair, nails; care', employeeName: 'Ana\nKovač',
    date: '2026-11-02', time: '09:30', endTime: '10:15', durationMinutes: 45,
    status: 'scheduled', location: 'Ljubljana, center',
  };
  const ics = calendarInvite(event, 'Salon A', 'salon-a');
  assert.ok(ics);
  assert.match(ics, /DTSTART;TZID=Europe\/Ljubljana:20261102T093000/);
  assert.match(ics, /DTEND;TZID=Europe\/Ljubljana:20261102T101500/);
  assert.match(ics, /BEGIN:VTIMEZONE\r\n/);
  assert.match(ics, /UID:appointment-123-salon-a@portal\.jedroplus\.com/);
  assert.match(ics, /SUMMARY:Hair\\, nails\\; care – Salon A/);
  assert.match(ics, /LOCATION:Ljubljana\\, center/);
  assert.match(ics, /DESCRIPTION:Ana\\nKovač/);
  assert.ok(ics.endsWith('\r\n'));
});

test('rejects impossible dates', () => {
  assert.equal(calendarInvite({ id: '1', date: '2026-02-30', time: '09:00', durationMinutes: 30, serviceName: 'Visit', employeeName: '', status: '' }, '', 'shop'), null);
});
