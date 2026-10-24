import type { PortalLanguage } from '../store/manageStore';
import { portalLocale } from './portalLanguage';

export const formatDate = (dateString: string, language: PortalLanguage = 'sl'): string => {
  const date = new Date(dateString + 'T00:00:00');
  const formatted = new Intl.DateTimeFormat(portalLocale(language), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

export const formatTime = (timeString: string, language: PortalLanguage = 'sl'): string => {
  const [h, m] = timeString.split(':');
  return language === 'en' ? `${h}:${m}` : `${h}.${m}`;
};

/** Returns duration in minutes between two "HH:MM" or "HH:MM:SS" strings. */
export const calcDuration = (start: string, end: string): number => {
  const toMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  return toMinutes(end) - toMinutes(start);
};

export const formatDateShort = (dateString: string, language: PortalLanguage = 'sl'): string => {
  const date = new Date(dateString + 'T00:00:00');
  const formatted = new Intl.DateTimeFormat(portalLocale(language), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};
