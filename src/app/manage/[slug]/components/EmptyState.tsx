'use client';

import { useManageStore } from '../store/manageStore';

export default function EmptyState() {
  const { companySlug } = useManageStore();

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20">
      <p className="text-gray-400 text-base mb-4">
        Nimate prihajajočih terminov.
      </p>
      <a
        href={`/book/${companySlug}`}
        className="text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors duration-200"
      >
        Rezervirajte termin →
      </a>
    </div>
  );
}
