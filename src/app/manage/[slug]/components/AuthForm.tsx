'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import { useManageStore } from '../store/manageStore';
import { portalLogin } from '../lib/portalApi';
import ManageHeader from './ManageHeader';
import PoweredByFooter from './PoweredByFooter';

export default function AuthForm() {
  const params = useParams();
  const slug = params?.slug as string;

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  // Shown after a successful login request (intentionally vague to not reveal
  // whether the email exists in the system)
  const [submitted, setSubmitted] = useState(false);

  const { setCustomerEmail, setCurrentView, theme } = useManageStore();

  const validateEmail = (): boolean => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Vnesite veljaven email naslov.');
      return false;
    }
    setEmailError(undefined);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail() || loading) return;

    setLoading(true);
    try {
      await portalLogin(slug, email.trim());
      // Store email so VerificationPending can display it and use it for resend
      setCustomerEmail(email.trim());
      setSubmitted(true);
      // Transition to the "check your email" screen after a brief moment
      // so the success message is visible
      setTimeout(() => setCurrentView('verification'), 1200);
    } catch (err) {
      // Even on backend error we show the generic success message to avoid
      // leaking whether an email exists in the system
      setCustomerEmail(email.trim());
      setSubmitted(true);
      setTimeout(() => setCurrentView('verification'), 1200);
      // Suppress err — intentional. Backend errors are not surfaced here.
      void err;
    } finally {
      setLoading(false);
    }
  };

  const inputBorderStyle = (hasError?: string) => ({
    borderBottomColor: hasError ? '#EF4444' : '#E5E7EB',
  });

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderBottomColor = theme.primaryColor;
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>, hasError?: string) => {
    e.target.style.borderBottomColor = hasError ? '#EF4444' : '#E5E7EB';
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
        <div className="w-full max-w-md">
          <div className="text-center mb-12">
            <h2
              className="text-[2rem] font-medium text-gray-900 mb-3 leading-tight"
              style={{ fontFamily: "var(--font-playfair, 'Playfair Display', Georgia, serif)" }}
            >
              Upravljanje Terminov
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              Vnesite email za dostop do vaših terminov
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-10">
              <label className="block text-xs font-medium uppercase tracking-widest text-gray-400 mb-3">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError(undefined);
                }}
                onFocus={handleFocus}
                onBlur={(e) => handleBlur(e, emailError)}
                placeholder="janez@email.com"
                className="w-full bg-transparent border-0 border-b pb-3 text-base text-gray-900 placeholder-gray-300 focus:outline-none transition-colors duration-200"
                style={inputBorderStyle(emailError)}
                autoComplete="email"
                disabled={loading || submitted}
              />
              {emailError && (
                <p className="mt-2 text-xs text-red-500">{emailError}</p>
              )}
            </div>

            {submitted && (
              <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">
                Če email obstaja v sistemu, smo vam poslali povezavo za prijavo.
              </p>
            )}

            <button
              type="submit"
              disabled={loading || submitted}
              className="w-full py-4 rounded-xl text-white text-sm font-medium tracking-wide transition-opacity duration-200 hover:opacity-90 active:opacity-80 disabled:opacity-60"
              style={{
                background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
              }}
            >
              {loading ? 'Pošiljam...' : submitted ? 'Poslano ✓' : 'Nadaljuj'}
            </button>
          </form>
        </div>
      </div>

      <PoweredByFooter />
    </motion.div>
  );
}
