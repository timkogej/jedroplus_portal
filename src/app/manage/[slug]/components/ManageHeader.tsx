'use client';

import { useManageStore } from '../store/manageStore';

export default function ManageHeader() {
  const { companyName } = useManageStore();

  return (
    <header className="text-center pt-10 pb-6">
      <h1
        className="text-2xl font-medium text-gray-900 tracking-wide"
        style={{ fontFamily: "var(--font-playfair, 'Playfair Display', Georgia, serif)" }}
      >
        {companyName || '\u00A0'}
      </h1>
    </header>
  );
}
