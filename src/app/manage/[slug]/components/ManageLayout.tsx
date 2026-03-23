'use client';

import { useManageStore } from '../store/manageStore';
import Toast from './Toast';

export default function ManageLayout({ children }: { children: React.ReactNode }) {
  const { theme } = useManageStore();

  return (
    <div
      className="min-h-screen bg-[#FAFAFA]"
      style={
        {
          '--primary-color': theme.primaryColor,
          '--secondary-color': theme.secondaryColor,
          '--bg-from': theme.bgFrom,
          '--bg-to': theme.bgTo,
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
