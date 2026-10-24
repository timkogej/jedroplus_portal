'use client';

import { useParams } from 'next/navigation';
import { bookingUrl, buttonTextColor } from '../lib/companyProfile';
import { useManageStore } from '../store/manageStore';
import { portalText } from '../lib/portalLanguage';

export default function BookingButton({ compact = false }: { compact?: boolean }) {
  const params = useParams();
  const { companyProfile, theme, language } = useManageStore();
  const slug = (params?.slug as string) || companyProfile?.slug || '';
  if (!slug || companyProfile?.bookingEnabled === false) return null;

  return (
    <a
      href={bookingUrl(slug)}
      className={`inline-flex items-center justify-center rounded-xl font-medium transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${compact ? 'px-5 py-3 text-sm' : 'w-full px-6 py-4 text-sm'}`}
      style={{
        backgroundColor: theme.primaryColor,
        color: buttonTextColor(theme.primaryColor),
        boxShadow: `0 10px 25px color-mix(in srgb, ${theme.primaryColor} 17%, transparent)`,
        outlineColor: theme.primaryColor,
      }}
    >
      {portalText(language, 'Rezerviraj nov termin', 'Book a new appointment')} <span aria-hidden="true" className="ml-2">↗</span>
    </a>
  );
}
