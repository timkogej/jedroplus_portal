import test from 'node:test';
import assert from 'node:assert/strict';
import { appointmentStatus, splitAppointments } from '../src/app/manage/[slug]/lib/appointmentLists.ts';

test('recognizes database status variants', () => {
  for (const status of ['Odpovedan', 'odpovedano', 'cancelled']) {
    assert.equal(appointmentStatus(status), 'cancelled');
  }
  for (const status of ['Zaključen', 'zaključen', 'completed']) {
    assert.equal(appointmentStatus(status), 'completed');
  }
  assert.equal(appointmentStatus('Ni prišel'), 'no_show');
  assert.equal(appointmentStatus('scheduled'), 'active');
});

test('classifies by Ljubljana time and never offers an inactive appointment for editing', () => {
  const now = new Date('2026-10-22T08:00:00Z'); // 10:00 in Ljubljana
  const appointment = (id, time, status = 'scheduled') => ({
    id, date: '2026-10-22', time, status,
  });
  const all = [
    appointment('before', '09:30'),
    appointment('after', '10:30'),
    appointment('cancelled', '11:00', 'Odpovedan'),
    appointment('completed', '12:00', 'Zaključen'),
    appointment('no-show', '13:00', 'Ni prišel'),
  ];
  const result = splitAppointments(all, now);
  assert.deepEqual(result.upcoming.map((a) => a.id), ['after']);
  assert.deepEqual(result.past.map((a) => a.id), ['before', 'cancelled', 'completed', 'no-show']);
});

test('uses the winter offset after the daylight saving change', () => {
  const all = [
    { id: 'early', date: '2026-11-02', time: '09:30', status: 'scheduled' },
    { id: 'later', date: '2026-11-02', time: '10:30', status: 'scheduled' },
  ];
  const result = splitAppointments(all, new Date('2026-11-02T09:00:00Z'));
  assert.deepEqual(result.upcoming.map((a) => a.id), ['later']);
});
