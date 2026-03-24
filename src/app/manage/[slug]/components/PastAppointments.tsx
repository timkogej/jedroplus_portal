'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useManageStore } from '../store/manageStore';
import type { Appointment } from '../lib/mockData';
import { formatDateShort, formatTime } from '../lib/utils';

interface PastAppointmentsProps {
  appointments: Appointment[];
}

export default function PastAppointments({ appointments }: PastAppointmentsProps) {
  const { showPastAppointments, togglePastAppointments } = useManageStore();

  if (appointments.length === 0) return null;

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-medium uppercase tracking-widest text-gray-400">
          Pretekli termini
        </h2>
        <button
          onClick={togglePastAppointments}
          className="text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors duration-200"
        >
          {showPastAppointments ? 'Skrij ↑' : 'Prikaži ↓'}
        </button>
      </div>

      <AnimatePresence>
        {showPastAppointments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } }}
            exit={{ height: 0, opacity: 0, transition: { duration: 0.2 } }}
            style={{ overflow: 'hidden' }}
          >
            <div className="space-y-2">
              {appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="bg-white rounded-xl px-5 py-4 border border-gray-100 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-500">
                      {apt.serviceName}
                    </span>
                    <span className="text-gray-300">·</span>
                    <span className="text-sm text-gray-400">{apt.employeeName}</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {formatDateShort(apt.date)} · {formatTime(apt.time)}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
