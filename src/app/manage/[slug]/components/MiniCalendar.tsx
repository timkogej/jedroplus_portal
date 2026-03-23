'use client';

import { useState } from 'react';
import { useManageStore } from '../store/manageStore';

const MONTHS_SL = [
  'Januar', 'Februar', 'Marec', 'April', 'Maj', 'Junij',
  'Julij', 'Avgust', 'September', 'Oktober', 'November', 'December',
];

const DAYS_SL = ['Po', 'To', 'Sr', 'Če', 'Pe', 'So', 'Ne'];

interface MiniCalendarProps {
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
  minDate?: string;
}

export default function MiniCalendar({ selectedDate, onDateSelect, minDate }: MiniCalendarProps) {
  const { theme } = useManageStore();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear, setViewYear] = useState(() => {
    if (selectedDate) return parseInt(selectedDate.split('-')[0]);
    return today.getFullYear();
  });

  const [viewMonth, setViewMonth] = useState(() => {
    if (selectedDate) return parseInt(selectedDate.split('-')[1]) - 1;
    return today.getMonth();
  });

  const getDaysInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate();

  // Returns 0=Monday ... 6=Sunday
  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const isDisabled = (day: number) => {
    const date = new Date(viewYear, viewMonth, day);
    date.setHours(0, 0, 0, 0);
    if (minDate) {
      const min = new Date(minDate + 'T00:00:00');
      return date < min;
    }
    return date <= today;
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    const [sy, sm, sd] = selectedDate.split('-').map(Number);
    return sy === viewYear && sm - 1 === viewMonth && sd === day;
  };

  const isToday = (day: number) =>
    today.getFullYear() === viewYear &&
    today.getMonth() === viewMonth &&
    today.getDate() === day;

  const handleDayClick = (day: number) => {
    if (isDisabled(day)) return;
    const date = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onDateSelect(date);
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 select-none">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={handlePrevMonth}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-150 text-lg leading-none"
        >
          ‹
        </button>
        <h3
          className="text-xs font-medium uppercase tracking-widest text-gray-600"
        >
          {MONTHS_SL[viewMonth]} {viewYear}
        </h3>
        <button
          onClick={handleNextMonth}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-150 text-lg leading-none"
        >
          ›
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_SL.map((day) => (
          <div
            key={day}
            className="text-center text-xs text-gray-300 font-medium py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {Array.from({ length: totalCells }).map((_, idx) => {
          const day = idx - firstDay + 1;
          const valid = day >= 1 && day <= daysInMonth;

          if (!valid) return <div key={idx} />;

          const disabled = isDisabled(day);
          const selected = isSelected(day);
          const todayDay = isToday(day);

          return (
            <button
              key={idx}
              onClick={() => handleDayClick(day)}
              disabled={disabled}
              className={[
                'relative mx-auto w-8 h-8 text-xs rounded-full flex items-center justify-center transition-all duration-150',
                disabled ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer',
                selected ? 'text-white font-medium' : '',
                !selected && !disabled ? 'hover:bg-gray-100 text-gray-700' : '',
                todayDay && !selected ? 'font-semibold' : '',
              ].join(' ')}
              style={selected ? { backgroundColor: theme.primaryColor } : undefined}
            >
              {day}
              {todayDay && !selected && (
                <span
                  className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ backgroundColor: theme.primaryColor }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
