'use client';

import { useManageStore } from '../store/manageStore';

interface TimeSlotsProps {
  slots: string[];
  selectedTime: string | null;
  onTimeSelect: (time: string) => void;
}

export default function TimeSlots({ slots, selectedTime, onTimeSelect }: TimeSlotsProps) {
  const { theme } = useManageStore();

  return (
    <div className="flex flex-wrap gap-2">
      {slots.map((slot) => {
        const selected = slot === selectedTime;

        return (
          <button
            key={slot}
            onClick={() => onTimeSelect(slot)}
            className="px-3.5 py-2 text-sm rounded-lg border font-medium transition-all duration-150"
            style={
              selected
                ? {
                    backgroundColor: theme.primaryColor,
                    borderColor: theme.primaryColor,
                    color: 'white',
                  }
                : {
                    backgroundColor: 'white',
                    borderColor: '#E5E7EB',
                    color: '#9CA3AF',
                  }
            }
            onMouseEnter={(e) => {
              if (!selected) {
                const el = e.currentTarget;
                el.style.borderColor = theme.primaryColor;
                el.style.color = theme.primaryColor;
              }
            }}
            onMouseLeave={(e) => {
              if (!selected) {
                const el = e.currentTarget;
                el.style.borderColor = '#E5E7EB';
                el.style.color = '#9CA3AF';
              }
            }}
          >
            {slot}
          </button>
        );
      })}
    </div>
  );
}
