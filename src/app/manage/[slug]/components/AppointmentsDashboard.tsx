'use client';

import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import { useManageStore } from '../store/manageStore';
import { clearPortalSession } from '../lib/portalSession';
import ManageHeader from './ManageHeader';
import AppointmentCard from './AppointmentCard';
import PastAppointments from './PastAppointments';
import EmptyState from './EmptyState';
import PoweredByFooter from './PoweredByFooter';
import RescheduleModal from './RescheduleModal';
import CancelModal from './CancelModal';
import BookingButton from './BookingButton';
import CompanyContact from './CompanyContact';
import LoyaltyCard from './LoyaltyCard';
import Announcements from './Announcements';
import CustomerProfile from './CustomerProfile';
import { portalText } from '../lib/portalLanguage';

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
    upcomingAppointments,
    pastAppointments,
    customerEmail,
    isLoadingAppointments,
    appointmentsError,
    setCurrentView,
    setAuthenticated,
    logout,
    language,
  } = useManageStore();

  const handleLogout = () => {
    clearPortalSession(slug);
    logout();
  };

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
        <div className="flex items-center justify-between mb-6 gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-800">{portalText(language, 'Pozdravljeni', 'Welcome')}</p>
            {customerEmail && (
              <p className="text-xs text-gray-400 truncate">{customerEmail}</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <a href="#profile-title" className="text-sm font-medium underline underline-offset-2 text-gray-600">
              {portalText(language, 'Moj profil', 'My profile')}
            </a>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              {portalText(language, 'Odjava', 'Sign out')} ↗
            </button>
          </div>
        </div>

        <div className="border-t border-gray-100 mb-8" />

        <div className="mb-9">
          <BookingButton />
        </div>

        <Announcements />
        <LoyaltyCard />

        {/* Loading state */}
        {isLoadingAppointments && (
          <div className="flex-1 flex items-center justify-center py-16">
            <p className="text-sm text-gray-400">{portalText(language, 'Nalagam termine...', 'Loading appointments...')}</p>
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
              {portalText(language, 'Nazaj na prijavo', 'Back to sign in')}
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
                    {portalText(language, 'Prihajajoči termini', 'Upcoming appointments')}
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

        <div className="mt-9"><CustomerProfile /></div>
        <CompanyContact />
        <PoweredByFooter />
      </motion.div>

      {/* Modals rendered at dashboard level to stay above layout */}
      <RescheduleModal />
      <CancelModal />
    </>
  );
}
