import test from 'node:test';
import assert from 'node:assert/strict';
import { bookingUrl, buttonTextColor } from '../src/app/manage/[slug]/lib/companyProfile.ts';

test('booking link uses the real reservation site', () => {
  assert.equal(bookingUrl('brinails'), 'https://rezervacije.jedroplus.com/brinails');
});

test('button label stays readable for light and dark company colours', () => {
  assert.equal(buttonTextColor('#F8E96A'), '#111827');
  assert.equal(buttonTextColor('#24507A'), '#FFFFFF');
});
