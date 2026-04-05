'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import { useManageStore } from '../store/manageStore';
import { getPortalAppointments } from '../lib/portalApi';
import { clearPortalSession } from '../lib/portalSession';
import ManageHeader from './ManageHeader';
import AppointmentCard from './AppointmentCard';
import PastAppointments from './PastAppointments';
import EmptyState from './EmptyState';
import PoweredByFooter from './PoweredByFooter';
import RescheduleModal from './RescheduleModal';
import CancelModal from './CancelModal';
import type { Appointment } from '../lib/mockData';

const cardContainer = {
  animate: {
    transition: { staggerChildren: 0.08 },
  },
};

const cardItem = {
  initial: { opacity: 0, y: 15 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

export default function AppointmentsDashboard() {
  const params = useParams();
  const slug = params?.slug as string;

  const {
    allAppointments,
    upcomingAppointments,
    pastAppointments,
    customerEmail,
    customerFirstName,
    isLoadingAppointments,
    appointmentsError,
    setAppointmentLists,
    setLoadingAppointments,
    setAppointmentsError,
    setCustomerFirstName,
    setCurrentView,
    setAuthenticated,
    setCompanyInfo,
    logout,
  } = useManageStore();

  // Fetch appointments when dashboard mounts (covers the session-restore path
  // where page.tsx already called loadAppointments, but this is a safety net
  // for cases where appointments are still empty after mount).
  useEffect(() => {
    const hasAppointments =
      allAppointments.length > 0 ||
      upcomingAppointments.length > 0 ||
      pastAppointments.length > 0;
    if (!slug || !customerEmail || hasAppointments || isLoadingAppointments) return;
    const fetch = async () => {
      setLoadingAppointments(true);
      setAppointmentsError(null);
      try {
        const result = await getPortalAppointments(slug, customerEmail);
        setAppointmentLists({
          all: result.all as unknown as Appointment[],
          upcoming: result.upcoming as unknown as Appointment[],
          past: result.past as unknown as Appointment[],
        });
        if (result.customerFirstName) setCustomerFirstName(result.customerFirstName);
        if (result.companyName) setCompanyInfo(result.companyName, slug);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Napaka pri nalaganju terminov.';
        setAppointmentsError(msg);
      } finally {
        setLoadingAppointments(false);
      }
    };
    fetch();
  }, [slug, customerEmail]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = () => {
    clearPortalSession(slug);
    logout();
  };

  const displayName = customerFirstName || customerEmail.split('@')[0] || '';

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }}
        exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
        className="flex flex-col flex-1"
      >
        <ManageHeader />

        {/* Greeting row */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm font-medium text-gray-800">
            Pozdravljeni{displayName ? `, ${displayName}` : ''}
          </p>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            Odjava ↗
          </button>
        </div>

        <div className="border-t border-gray-100 mb-8" />

        {/* Loading state */}
        {isLoadingAppointments && (
          <div className="flex-1 flex items-center justify-center py-16">
            <p className="text-sm text-gray-400">Nalagam termine...</p>
          </div>
        )}

        {/* Error state */}
        {!isLoadingAppointments && appointmentsError && (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-red-500 mb-4">{appointmentsError}</p>
            <button
              onClick={() => {
                clearPortalSession(slug);
                setAuthenticated(false);
                setCurrentView('auth');
              }}
              className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors duration-200"
            >
              Nazaj na prijavo
            </button>
          </div>
        )}

        {/* Appointment lists — only shown once loaded without error */}
        {!isLoadingAppointments && !appointmentsError && (
          <>
            {/* Upcoming appointments */}
            {upcomingAppointments.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                <div className="mb-4">
                  <h2 className="text-xs font-medium uppercase tracking-widest text-gray-400">
                    Prihajajoči termini
                  </h2>
                </div>
                <motion.div
                  variants={cardContainer}
                  initial="initial"
                  animate="animate"
                  className="space-y-3"
                >
                  {upcomingAppointments.map((apt) => (
                    <motion.div key={apt.id} variants={cardItem}>
                      <AppointmentCard appointment={apt} />
                    </motion.div>
                  ))}
                </motion.div>
              </>
            )}

            {/* Past appointments */}
            <PastAppointments appointments={pastAppointments} />
          </>
        )}

        <PoweredByFooter />
      </motion.div>

      {/* Modals rendered at dashboard level to stay above layout */}
      <RescheduleModal />
      <CancelModal />
    </>
  );
}
