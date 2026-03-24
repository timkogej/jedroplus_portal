'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'next/navigation';
import { useManageStore } from '../store/manageStore';
import {
  getPortalRescheduleSlots,
  confirmPortalReschedule,
  getPortalAppointments,
} from '../lib/portalApi';
import MiniCalendar from './MiniCalendar';
import TimeSlots from './TimeSlots';
import { formatDate, formatDateShort } from '../lib/utils';
import type { Appointment } from '../lib/mockData';

export default function RescheduleModal() {
  const params = useParams();
  const slug = params?.slug as string;

  const {
    rescheduleModalOpen,
    closeRescheduleModal,
    selectedAppointmentId,
    allAppointments,
    customerEmail,
    setAppointmentLists,
    setCustomerFirstName,
    showToast,
    theme,
  } = useManageStore();

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  // Slots fetched from backend for the chosen date
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const appointment = allAppointments.find((a) => a.id === selectedAppointmentId);

  const handleClose = () => {
    closeRescheduleModal();
    setSelectedDate(null);
    setSelectedTime(null);
    setSlots([]);
    setSlotsError(null);
  };

  /** Called when the user picks a new date — fetches available slots. */
  const handleDateSelect = async (date: string) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setSlots([]);
    setSlotsError(null);

    if (!appointment) return;

    setLoadingSlots(true);
    try {
      const available = await getPortalRescheduleSlots(
        slug,
        customerEmail,
        appointment.id,
        date
      );
      setSlots(available);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Napaka pri nalaganju terminov.';
      setSlotsError(msg);
    } finally {
      setLoadingSlots(false);
    }
  };

  /** Called when the user confirms the new date + time. */
  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime || !appointment || confirming) return;
    setConfirming(true);
    try {
      await confirmPortalReschedule(
        slug,
        customerEmail,
        appointment.id,
        selectedDate,
        selectedTime
      );
      showToast(
        `Termin uspešno prestavljen na ${formatDateShort(selectedDate)} ob ${selectedTime}.`,
        'success'
      );
      handleClose();
      // Refresh the appointments list from backend
      const result = await getPortalAppointments(slug, customerEmail);
      setAppointmentLists({
        all: result.all as unknown as Appointment[],
        upcoming: result.upcoming as unknown as Appointment[],
        past: result.past as unknown as Appointment[],
      });
      if (result.customerFirstName) setCustomerFirstName(result.customerFirstName);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Napaka pri prestavitveni termina.';
      showToast(msg, 'error');
    } finally {
      setConfirming(false);
    }
  };

  const canConfirm = !!selectedDate && !!selectedTime && !confirming && !loadingSlots;

  return (
    <AnimatePresence>
      {rescheduleModalOpen && appointment && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/25 z-40 backdrop-blur-[2px]"
            onClick={handleClose}
          />

          {/* Modal — bottom sheet on mobile, centered on desktop */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.32, 0.72, 0, 1] } }}
            exit={{ opacity: 0, y: 40, transition: { duration: 0.2 } }}
            className="fixed inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center z-50"
          >
            <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-[520px] shadow-2xl max-h-[92vh] overflow-y-auto mx-0 sm:mx-4">
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
                <h2
                  className="text-lg font-medium text-gray-900"
                  style={{ fontFamily: "var(--font-playfair, 'Playfair Display', Georgia, serif)" }}
                >
                  Prestavi Termin
                </h2>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-50 text-xl leading-none"
                  aria-label="Zapri"
                >
                  ×
                </button>
              </div>

              <div className="px-6 py-5 space-y-6">
                {/* Current appointment info */}
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {appointment.serviceName} z {appointment.employeeName}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Trenutno: {formatDate(appointment.date)} ob {appointment.time}
                  </p>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-50" />

                {/* Date picker */}
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-3">
                    Izberite nov datum
                  </p>
                  <MiniCalendar
                    selectedDate={selectedDate}
                    onDateSelect={handleDateSelect}
                  />
                </div>

                {/* Time slots — shown after a date is chosen */}
                <AnimatePresence>
                  {selectedDate && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0, transition: { duration: 0.25 } }}
                      exit={{ opacity: 0, y: 4, transition: { duration: 0.15 } }}
                    >
                      <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-3">
                        Prosti termini za {formatDateShort(selectedDate)}
                      </p>

                      {loadingSlots && (
                        <p className="text-sm text-gray-400">Nalagam termine...</p>
                      )}

                      {!loadingSlots && slotsError && (
                        <p className="text-sm text-red-500">{slotsError}</p>
                      )}

                      {!loadingSlots && !slotsError && slots.length === 0 && (
                        <p className="text-sm text-gray-400">
                          Za izbrani datum ni prostih terminov.
                        </p>
                      )}

                      {!loadingSlots && !slotsError && slots.length > 0 && (
                        <TimeSlots
                          slots={slots}
                          selectedTime={selectedTime}
                          onTimeSelect={setSelectedTime}
                        />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Confirm button */}
                <button
                  onClick={handleConfirm}
                  disabled={!canConfirm}
                  className="w-full py-3.5 rounded-xl text-white text-sm font-medium tracking-wide transition-opacity duration-200"
                  style={{
                    background: `linear-gradient(135deg, ${theme.bgFrom}, ${theme.bgTo})`,
                    opacity: canConfirm ? 1 : 0.35,
                  }}
                >
                  {confirming ? 'Posodabljam...' : 'Potrdi spremembo'}
                </button>

                {/* Bottom safe area on mobile */}
                <div className="h-2 sm:hidden" />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
