'use client';

import { useState } from 'react';
import { useManageStore } from '../store/manageStore';
import type { Appointment } from '../lib/mockData';
import { formatDate, formatTime, calcDuration } from '../lib/utils';
import { downloadCalendarInvite } from '../lib/calendarInvite';
import { portalText } from '../lib/portalLanguage';

interface AppointmentCardProps {
  appointment: Appointment;
}

export default function AppointmentCard({ appointment }: AppointmentCardProps) {
  const { openRescheduleModal, openCancelModal, theme, companyName, companySlug, showToast, language } = useManageStore();
  const [rescheduleHover, setRescheduleHover] = useState(false);

  return (
    <div
      className="bg-white rounded-xl p-6 border border-gray-100 border-l-[3px] shadow-sm hover:shadow-md transition-shadow duration-300"
      style={{ borderLeftColor: theme.primaryColor }}
    >
      <div className="mb-4">
        <h3
          className="text-lg font-medium text-gray-900 mb-1"
          style={{ fontFamily: "var(--font-playfair, 'Playfair Display', Georgia, serif)" }}
        >
          {appointment.serviceName}
        </h3>
        <p className="text-sm text-gray-400">{appointment.employeeName}</p>
      </div>

      <div className="mb-5">
        <p className="text-sm text-gray-700 font-medium mb-0.5">
          {formatDate(appointment.date, language)}
        </p>
        <p className="text-sm text-gray-400">
          {formatTime(appointment.time, language)}
          {appointment.endTime
            ? ` · ${calcDuration(appointment.time, appointment.endTime)} min`
            : appointment.durationMinutes
              ? ` · ${appointment.durationMinutes} min`
              : ''}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 pt-4 border-t border-gray-50">
        <button
          type="button"
          onClick={() => { if (!downloadCalendarInvite(appointment, companyName, companySlug)) showToast(portalText(language, 'Koledarske datoteke ni mogoče pripraviti.', 'The calendar file could not be created.'), 'error'); }}
          className="text-sm font-medium underline underline-offset-2"
          style={{ color: theme.primaryColor }}
        >
          {portalText(language, 'Dodaj v koledar (.ics)', 'Add to calendar (.ics)')}
        </button>
        <button
          onClick={() => openRescheduleModal(appointment.id)}
          className="text-sm font-medium transition-colors duration-200"
          style={{ color: rescheduleHover ? theme.primaryColor : '#9CA3AF' }}
          onMouseEnter={() => setRescheduleHover(true)}
          onMouseLeave={() => setRescheduleHover(false)}
        >
          {portalText(language, 'Prestavi termin', 'Reschedule')}
        </button>
        <button
          onClick={() => openCancelModal(appointment.id)}
          className="text-sm font-medium text-gray-400 hover:text-red-400 transition-colors duration-200"
        >
          {portalText(language, 'Odpovej termin', 'Cancel appointment')}
        </button>
      </div>
    </div>
  );
}
