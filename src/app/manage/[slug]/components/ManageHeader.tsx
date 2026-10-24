'use client';

import { useState } from 'react';

import { useManageStore } from '../store/manageStore';
import { portalText } from '../lib/portalLanguage';

export default function ManageHeader() {
  const { companyName, companyProfile, theme, language, setLanguage } = useManageStore();
  const [failedLogo, setFailedLogo] = useState<string | null>(null);
  const logo = companyProfile?.logoUrl;

  return (
    <header className="flex flex-col items-center text-center pt-9 pb-8 relative">
      <button type="button" onClick={() => setLanguage(language === 'sl' ? 'en' : 'sl')}
        className="absolute right-0 top-4 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700"
        aria-label={portalText(language, 'Preklopi v angleščino', 'Switch to Slovenian')}>
        {language === 'sl' ? 'EN' : 'SL'}
      </button>
      {logo && failedLogo !== logo && (
        // The logo is a validated public URL supplied by the company.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo}
          alt={`${portalText(language, 'Logotip', 'Logo of')} ${companyName || portalText(language, 'podjetja', 'the company')}`}
          className="mb-4 h-16 w-auto max-w-[180px] rounded-2xl border border-gray-100 bg-white object-contain p-2 shadow-sm"
          onError={() => setFailedLogo(logo)}
        />
      )}
      <h1
        className="text-2xl font-medium text-gray-900 tracking-wide"
        style={{ fontFamily: "var(--font-playfair, 'Playfair Display', Georgia, serif)" }}
      >
        {companyName || portalText(language, 'Portal za stranke', 'Customer portal')}
      </h1>
      <div className="mt-3 h-0.5 w-10 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
    </header>
  );
}
