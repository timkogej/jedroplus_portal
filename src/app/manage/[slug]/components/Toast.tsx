'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useManageStore } from '../store/manageStore';

export default function Toast() {
  const { toast, dismissToast } = useManageStore();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(dismissToast, 4000);
    return () => clearTimeout(timer);
  }, [toast, dismissToast]);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 pointer-events-none">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.message + toast.type}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
            className={`bg-white shadow-md rounded-lg px-4 py-3 text-sm text-gray-700 border-l-4 pointer-events-auto ${
              toast.type === 'success' ? 'border-green-500' : 'border-red-500'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
