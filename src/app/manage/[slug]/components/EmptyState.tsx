'use client';

import { useManageStore } from '../store/manageStore';
import { portalText } from '../lib/portalLanguage';

export default function EmptyState() {
  const { companyProfile, language } = useManageStore();

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20">
      <p className="text-gray-400 text-base mb-4">
        {portalText(language, 'Nimate prihajajočih terminov.', 'You have no upcoming appointments.')}
      </p>
      {companyProfile?.bookingEnabled === false && (
        <p className="text-sm text-gray-400 text-center">{portalText(language, 'Za nov termin stopite v stik s podjetjem.', 'Contact the company to book a new appointment.')}</p>
      )}
    </div>
  );
}
