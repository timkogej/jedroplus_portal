'use client';

import { useManageStore } from '../store/manageStore';
import Toast from './Toast';

export default function ManageLayout({ children }: { children: React.ReactNode }) {
  const { theme } = useManageStore();

  return (
    <div
      className="min-h-screen"
      style={
        {
          '--primary-color': theme.primaryColor,
          '--secondary-color': theme.secondaryColor,
          '--bg-from': theme.bgFrom,
          '--bg-to': theme.bgTo,
          background: `linear-gradient(180deg, color-mix(in srgb, ${theme.primaryColor} 6%, #FAFAFA) 0%, #FAFAFA 38%)`,
          fontFamily: "var(--font-inter, 'Inter', -apple-system, sans-serif)",
        } as React.CSSProperties
      }
    >
      <Toast />
      <div className="mx-auto max-w-[600px] px-5 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  );
}
