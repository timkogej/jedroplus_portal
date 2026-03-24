export interface Appointment {
  id: string;
  serviceName: string;
  employeeName: string;
  date: string;
  time: string;
  endTime?: string;
  durationMinutes: number;
  status: 'upcoming' | 'past' | 'cancelled';
  notes?: string;
  price?: number | null;
  finalPrice?: number | null;
  paid?: boolean;
  location?: string;
}

export interface CustomerData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export const mockCustomer: CustomerData = {
  firstName: 'Janez',
  lastName: 'Novak',
  email: 'janez@email.com',
  phone: '041 123 456',
};

export const mockAppointments: Appointment[] = [
  {
    id: '1',
    serviceName: 'Striženje',
    employeeName: 'Ana Kovač',
    date: '2026-03-12',
    time: '10:30',
    durationMinutes: 45,
    status: 'upcoming',
  },
  {
    id: '2',
    serviceName: 'Barvanje las',
    employeeName: 'Maja Turk',
    date: '2026-03-28',
    time: '14:00',
    durationMinutes: 120,
    status: 'upcoming',
  },
  {
    id: '3',
    serviceName: 'Striženje',
    employeeName: 'Ana Kovač',
    date: '2026-02-15',
    time: '10:00',
    durationMinutes: 45,
    status: 'past',
  },
  {
    id: '4',
    serviceName: 'Styling',
    employeeName: 'Maja Turk',
    date: '2026-02-02',
    time: '14:30',
    durationMinutes: 30,
    status: 'past',
  },
];

export const mockTimeSlots: string[] = [
  '09:00', '09:30', '10:00', '10:30', '11:00',
  '11:30', '14:00', '14:30', '15:00', '15:30',
];
