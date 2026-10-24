'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'next/navigation';
import { useManageStore } from '../store/manageStore';
import { cancelPortalAppointment, getPortalAppointments } from '../lib/portalApi';
import { formatDate, formatTime } from '../lib/utils';
import type { Appointment } from '../lib/mockData';
import { portalText } from '../lib/portalLanguage';

export default function CancelModal() {
  const params = useParams();
  const slug = params?.slug as string;

  const {
    cancelModalOpen,
    closeCancelModal,
    selectedAppointmentId,
    allAppointments,
    customerEmail,
    setAppointmentLists,
    setCustomerFirstName,
    showToast,
    language,
  } = useManageStore();

  const [loading, setLoading] = useState(false);

  const appointment = allAppointments.find((a) => a.id === selectedAppointmentId);

  const handleConfirm = async () => {
    if (!appointment || loading) return;
    setLoading(true);
    try {
      await cancelPortalAppointment(slug, customerEmail, appointment.id);
      showToast(portalText(language, 'Termin je bil uspešno odpovedan.', 'Appointment cancelled.'), 'success');
      closeCancelModal();
      // Refresh the appointments list from backend
      const result = await getPortalAppointments(slug, customerEmail);
      setAppointmentLists({
        all: result.all as unknown as Appointment[],
        upcoming: result.upcoming as unknown as Appointment[],
        past: result.past as unknown as Appointment[],
      });
      if (result.customerFirstName) setCustomerFirstName(result.customerFirstName);
    } catch (err) {
      const msg = language === 'en' ? 'Could not cancel the appointment.'
        : err instanceof Error ? err.message : 'Napaka pri odpovedi termina.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {cancelModalOpen && appointment && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/25 z-40 backdrop-blur-[2px]"
            onClick={closeCancelModal}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }}
            exit={{ opacity: 0, scale: 0.97, y: 10, transition: { duration: 0.2 } }}
            className="fixed inset-0 flex items-center justify-center z-50 px-4"
          >
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-gray-100">
                <h2
                  className="text-lg font-medium text-gray-900"
                  style={{ fontFamily: "var(--font-playfair, 'Playfair Display', Georgia, serif)" }}
                >
                  {portalText(language, 'Odpoved termina', 'Cancel appointment')}
                </h2>
                <button
                  onClick={closeCancelModal}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-50 text-xl leading-none"
                  aria-label={portalText(language, 'Zapri', 'Close')}
                >
                  ×
                </button>
              </div>

              <div className="px-6 py-6">
                <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                  {portalText(language, 'Ali ste prepričani, da želite odpovedati termin?', 'Are you sure you want to cancel this appointment?')}
                </p>

                <div className="bg-gray-50 rounded-xl px-4 py-4 mb-6">
                  <p className="text-sm font-medium text-gray-800 mb-0.5">
                    {appointment.serviceName}
                  </p>
                  <p className="text-sm text-gray-500 mb-2">{appointment.employeeName}</p>
                  <p className="text-xs text-gray-400">
                    {formatDate(appointment.date, language)} {portalText(language, 'ob', 'at')} {formatTime(appointment.time, language)}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={closeCancelModal}
                    disabled={loading}
                    className="flex-1 py-3 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
                  >
                    {portalText(language, 'Prekliči', 'Keep appointment')}
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={loading}
                    className="flex-1 py-3 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors duration-200 disabled:opacity-60"
                  >
                    {loading ? portalText(language, 'Odpovedovanje...', 'Cancelling...') : portalText(language, 'Odpovej termin', 'Cancel appointment')}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
