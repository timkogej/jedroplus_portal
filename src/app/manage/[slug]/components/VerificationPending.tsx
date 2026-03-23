'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import { useManageStore } from '../store/manageStore';
import { portalLogin } from '../lib/portalApi';
import ManageHeader from './ManageHeader';
import PoweredByFooter from './PoweredByFooter';

export default function VerificationPending() {
  const params = useParams();
  const slug = params?.slug as string;

  const { customerEmail, theme } = useManageStore();

  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  const handleResend = async () => {
    if (resending || !customerEmail) return;
    setResending(true);
    setResendError(null);
    try {
      await portalLogin(slug, customerEmail);
    } catch {
      // Same as login — show generic message regardless of backend response
    }
    setResent(true);
    setResending(false);
    // Reset the "Poslano ✓" indicator after 4 s
    setTimeout(() => setResent(false), 4000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }}
      exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
      className="flex flex-col flex-1"
    >
      <ManageHeader />

      <div className="flex-1 flex flex-col items-center justify-center pb-16">
        <div className="w-full max-w-md text-center">
          <h2
            className="text-[2rem] font-medium text-gray-900 mb-5 leading-tight"
            style={{ fontFamily: "var(--font-playfair, 'Playfair Display', Georgia, serif)" }}
          >
            Potrdite Vaš Email
          </h2>

          <p className="text-sm text-gray-500 leading-relaxed mb-1">
            Na{' '}
            <span className="text-gray-800 font-medium">{customerEmail}</span>{' '}
            smo poslali potrditveno povezavo.
          </p>
          <p className="text-sm text-gray-400 mb-12">
            Preverite svoj email nabiralnik.
          </p>

          <p className="text-sm text-gray-400 mb-2">
            Niste prejeli emaila?{' '}
            <button
              onClick={handleResend}
              disabled={resending}
              className="font-medium transition-colors duration-200 hover:underline disabled:opacity-50"
              style={{ color: resent ? theme.primaryColor : '#374151' }}
            >
              {resending ? 'Pošiljam...' : resent ? 'Poslano ✓' : 'Pošlji ponovno'}
            </button>
          </p>

          {resendError && (
            <p className="text-xs text-red-500 mt-1">{resendError}</p>
          )}
        </div>
      </div>

      <PoweredByFooter />
    </motion.div>
  );
}
