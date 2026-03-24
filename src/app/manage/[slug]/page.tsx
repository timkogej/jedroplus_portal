'use client';

import { useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { useManageStore } from './store/manageStore';
import ManageLayout from './components/ManageLayout';
import AuthForm from './components/AuthForm';
import VerificationPending from './components/VerificationPending';
import AppointmentsDashboard from './components/AppointmentsDashboard';
import { getPortalAppointments, portalVerify } from './lib/portalApi';
import {
  getPortalSession,
  savePortalSession,
  clearPortalSession,
} from './lib/portalSession';
import type { NormalisedAppointment } from './lib/portalApi';
import type { Appointment } from './lib/mockData';

const DEFAULT_THEME = {
  primaryColor: '#8B5CF6',
  secondaryColor: '#A78BFA',
  bgFrom: '#7C3AED',
  bgTo: '#4F46E5',
};

export default function ManagePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params?.slug as string;

  const {
    setTheme,
    setCompanyInfo,
    setAppointmentLists,
    setLoadingAppointments,
    setAppointmentsError,
    setCustomerEmail,
    setCustomerFirstName,
    setAuthenticated,
    setCurrentView,
    showToast,
    currentView,
  } = useManageStore();

  /** Fetch appointments from backend and update store. */
  const loadAppointments = async (companySlug: string, email: string) => {
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
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Napaka pri nalaganju terminov.';
      setAppointmentsError(msg);
    } finally {
      setLoadingAppointments(false);
    }
  };

  // ── 1. Fetch company theme/info ──────────────────────────────────────────
  useEffect(() => {
    if (!slug) return;
    const init = async () => {
      try {
        const res = await fetch(
          `https://tikej.app.n8n.cloud/webhook/booking?action=init&companySlug=${slug}`
        );
        if (!res.ok) throw new Error('init failed');
        const data = await res.json();
        if (data.theme) setTheme(data.theme);
        setCompanyInfo(data.company?.name ?? slug, data.company?.slug ?? slug);
      } catch {
        setTheme(DEFAULT_THEME);
        setCompanyInfo(slug, slug);
      }
    };
    init();
  }, [slug, setTheme, setCompanyInfo]);

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
          savePortalSession(slug, emailParam);
          setCustomerEmail(emailParam);
          if (firstName) setCustomerFirstName(firstName);
          setAuthenticated(true);
          await loadAppointments(slug, emailParam);
          setCurrentView('dashboard');
          // Remove token/email from URL without triggering a navigation
          window.history.replaceState({}, '', `/manage/${slug}`);
        } catch (err) {
          const msg =
            err instanceof Error
              ? err.message
              : 'Napaka pri preverjanju povezave.';
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
      loadAppointments(slug, session.email).catch(() => {
        // Session may be stale — clear it and send to login
        clearPortalSession(slug);
        setAuthenticated(false);
        setCurrentView('auth');
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, searchParams]);

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
