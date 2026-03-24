'use client';

import { useState } from 'react';
import { useManageStore } from '../store/manageStore';
import type { Appointment } from '../lib/mockData';
import { formatDate, formatTime, calcDuration } from '../lib/utils';

interface AppointmentCardProps {
  appointment: Appointment;
}

export default function AppointmentCard({ appointment }: AppointmentCardProps) {
  const { openRescheduleModal, openCancelModal, theme } = useManageStore();
  const [rescheduleHover, setRescheduleHover] = useState(false);

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
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
          {formatDate(appointment.date)}
        </p>
        <p className="text-sm text-gray-400">
          {formatTime(appointment.time)}
          {appointment.endTime
            ? ` · ${calcDuration(appointment.time, appointment.endTime)} min`
            : appointment.durationMinutes
              ? ` · ${appointment.durationMinutes} min`
              : ''}
        </p>
      </div>

      <div className="flex items-center gap-5 pt-4 border-t border-gray-50">
        <button
          onClick={() => openRescheduleModal(appointment.id)}
          className="text-sm font-medium transition-colors duration-200"
          style={{ color: rescheduleHover ? theme.primaryColor : '#9CA3AF' }}
          onMouseEnter={() => setRescheduleHover(true)}
          onMouseLeave={() => setRescheduleHover(false)}
        >
          Prestavi termin
        </button>
        <span className="text-gray-200 select-none">·</span>
        <button
          onClick={() => openCancelModal(appointment.id)}
          className="text-sm font-medium text-gray-400 hover:text-red-400 transition-colors duration-200"
        >
          Odpovej termin
        </button>
      </div>
    </div>
  );
}
