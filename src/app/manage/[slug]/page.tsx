'use client';

import { useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { DEFAULT_THEME, useManageStore } from './store/manageStore';
import { getCompanyProfile } from './lib/companyProfile';
import ManageLayout from './components/ManageLayout';
import AuthForm from './components/AuthForm';
import VerificationPending from './components/VerificationPending';
import AppointmentsDashboard from './components/AppointmentsDashboard';
import { getPortalAppointments, portalVerify, PortalSessionExpiredError } from './lib/portalApi';
import {
  getPortalSession,
  savePortalSession,
} from './lib/portalSession';
import type { Appointment } from './lib/mockData';
import { portalText } from './lib/portalLanguage';

export default function ManagePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params?.slug as string;

  const {
    setTheme,
    setThemeReady,
    themeReady,
    companySlug,
    setCompanyInfo,
    setCompanyProfile,
    setAppointmentLists,
    setLoadingAppointments,
    setAppointmentsError,
    setCustomerEmail,
    setCustomerFirstName,
    setAuthenticated,
    setCurrentView,
    showToast,
    currentView,
    setLanguage,
    language,
  } = useManageStore();

  useEffect(() => {
    try { if (localStorage.getItem('portal_language') === 'en') setLanguage('en'); } catch { /* unavailable */ }
  }, [setLanguage]);

  useEffect(() => { document.documentElement.lang = language; }, [language]);

  /** Fetch appointments from backend and update store. */
  const loadAppointments = async (companySlug: string, email: string): Promise<boolean> => {
    setLoadingAppointments(true);
    setAppointmentsError(null);
    try {
      const result = await getPortalAppointments(companySlug, email);
      setAppointmentLists({
        all: result.all as unknown as Appointment[],
        upcoming: result.upcoming as unknown as Appointment[],
        past: result.past as unknown as Appointment[],
      });
      if (result.customerFirstName) {
        setCustomerFirstName(result.customerFirstName);
      }
      if (result.companyName) {
        setCompanyInfo(result.companyName, companySlug);
      }
      return true;
    } catch (err) {
      if (err instanceof PortalSessionExpiredError) {
        setAuthenticated(false);
        setCurrentView('auth');
        return false;
      }
      const msg =
        language === 'en' ? 'Could not load appointments.' : err instanceof Error ? err.message : 'Napaka pri nalaganju terminov.';
      setAppointmentsError(msg);
      return true;
    } finally {
      setLoadingAppointments(false);
    }
  };

  // ── 1. Load public company profile before the customer signs in ──────────
  useEffect(() => {
    if (!slug) return;
    setTheme(DEFAULT_THEME);
    setCompanyInfo('', slug);
    setCompanyProfile(null);
    setThemeReady(false);
    let active = true;
    const init = async () => {
      try {
        const data = await getCompanyProfile(slug);
        if (!active) return;
        if (data.theme) setTheme({
          primaryColor: data.theme.primaryColor ?? DEFAULT_THEME.primaryColor,
          secondaryColor: data.theme.secondaryColor ?? data.theme.primaryColor ?? DEFAULT_THEME.secondaryColor,
          bgFrom: data.theme.bgFrom ?? DEFAULT_THEME.bgFrom,
          bgTo: data.theme.bgTo ?? DEFAULT_THEME.bgTo,
        });
        if (data.company) {
          setCompanyProfile(data.company);
          setCompanyInfo(data.company.name, slug);
        }
      } catch {
        // The neutral theme remains usable when public company data is unavailable.
      } finally {
        if (active) setThemeReady(true);
      }
    };
    void init();
    return () => { active = false; };
  }, [slug, setTheme, setThemeReady, setCompanyInfo, setCompanyProfile]);

  // ── 2. Handle magic-link token OR restore existing session ───────────────
  useEffect(() => {
    if (!slug) return;

    const token = searchParams?.get('token') ?? null;
    const emailParam = searchParams?.get('email') ?? null;

    if (token && emailParam) {
      // Incoming magic-link click — verify token automatically
      setCustomerEmail(emailParam);
      setCurrentView('verification'); // show "checking…" state while we verify

      const verify = async () => {
        try {
          const data = await portalVerify(slug, emailParam, token);
          const firstName =
            data.customer?.firstName ?? data.customer?.first_name ?? '';
          savePortalSession(slug, emailParam, data.session_token);
          setCustomerEmail(emailParam);
          if (firstName) setCustomerFirstName(firstName);
          setAuthenticated(true);
          if (await loadAppointments(slug, emailParam)) setCurrentView('dashboard');
          // Remove token/email from URL without triggering a navigation
          window.history.replaceState({}, '', `/manage/${slug}`);
        } catch (err) {
          const msg = language === 'en' ? 'Could not verify the sign-in link.'
            : err instanceof Error ? err.message : 'Napaka pri preverjanju povezave.';
          showToast(msg, 'error');
          setCurrentView('auth');
        }
      };
      verify();
      return;
    }

    // Check for a persisted session (page refresh scenario)
    const session = getPortalSession(slug);
    if (session) {
      setCustomerEmail(session.email);
      setAuthenticated(true);
      setCurrentView('dashboard');
      void loadAppointments(slug, session.email);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, searchParams]);

  // Never paint an email button in another company's (or the fallback) colour
  // while the public profile is still loading.
  if (!themeReady || companySlug !== slug) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <p className="text-sm text-gray-400">{portalText(language, 'Nalagam portal...', 'Loading portal...')}</p>
      </div>
    );
  }

  return (
    <ManageLayout>
      <AnimatePresence mode="wait">
        {currentView === 'auth' && <AuthForm key="auth" />}
        {currentView === 'verification' && <VerificationPending key="verification" />}
        {currentView === 'dashboard' && <AppointmentsDashboard key="dashboard" />}
      </AnimatePresence>
    </ManageLayout>
  );
}
