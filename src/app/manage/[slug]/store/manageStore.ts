import { create } from 'zustand';
import type { Appointment } from '../lib/mockData';

export type ViewState = 'auth' | 'verification' | 'dashboard';

export interface Theme {
  primaryColor: string;
  secondaryColor: string;
  bgFrom: string;
  bgTo: string;
}

interface Toast {
  message: string;
  type: 'success' | 'error';
}

interface ManageStore {
  theme: Theme;
  companyName: string;
  companySlug: string;

  currentView: ViewState;
  customerEmail: string;
  customerFirstName: string;
  isAuthenticated: boolean;

  appointments: Appointment[];
  isLoadingAppointments: boolean;
  appointmentsError: string | null;

  showPastAppointments: boolean;
  rescheduleModalOpen: boolean;
  cancelModalOpen: boolean;
  selectedAppointmentId: string | null;

  toast: Toast | null;

  setTheme: (theme: Theme) => void;
  setCompanyInfo: (name: string, slug: string) => void;
  setCurrentView: (view: ViewState) => void;
  setCustomerEmail: (email: string) => void;
  setCustomerFirstName: (name: string) => void;
  setAuthenticated: (value: boolean) => void;
  setAppointments: (appointments: Appointment[]) => void;
  setLoadingAppointments: (loading: boolean) => void;
  setAppointmentsError: (error: string | null) => void;
  togglePastAppointments: () => void;
  openRescheduleModal: (appointmentId: string) => void;
  closeRescheduleModal: () => void;
  openCancelModal: (appointmentId: string) => void;
  closeCancelModal: () => void;
  showToast: (message: string, type: 'success' | 'error') => void;
  dismissToast: () => void;
  logout: () => void;
}

const DEFAULT_THEME: Theme = {
  primaryColor: '#8B5CF6',
  secondaryColor: '#A78BFA',
  bgFrom: '#7C3AED',
  bgTo: '#4F46E5',
};

export const useManageStore = create<ManageStore>((set) => ({
  theme: DEFAULT_THEME,
  companyName: '',
  companySlug: '',

  currentView: 'auth',
  customerEmail: '',
  customerFirstName: '',
  isAuthenticated: false,

  appointments: [],
  isLoadingAppointments: false,
  appointmentsError: null,

  showPastAppointments: false,
  rescheduleModalOpen: false,
  cancelModalOpen: false,
  selectedAppointmentId: null,

  toast: null,

  setTheme: (theme) => set({ theme }),
  setCompanyInfo: (name, slug) => set({ companyName: name, companySlug: slug }),
  setCurrentView: (view) => set({ currentView: view }),
  setCustomerEmail: (email) => set({ customerEmail: email }),
  setCustomerFirstName: (name) => set({ customerFirstName: name }),
  setAuthenticated: (value) => set({ isAuthenticated: value }),
  setAppointments: (appointments) => set({ appointments }),
  setLoadingAppointments: (loading) => set({ isLoadingAppointments: loading }),
  setAppointmentsError: (error) => set({ appointmentsError: error }),
  togglePastAppointments: () =>
    set((state) => ({ showPastAppointments: !state.showPastAppointments })),
  openRescheduleModal: (appointmentId) =>
    set({ rescheduleModalOpen: true, selectedAppointmentId: appointmentId, cancelModalOpen: false }),
  closeRescheduleModal: () =>
    set({ rescheduleModalOpen: false, selectedAppointmentId: null }),
  openCancelModal: (appointmentId) =>
    set({ cancelModalOpen: true, selectedAppointmentId: appointmentId, rescheduleModalOpen: false }),
  closeCancelModal: () =>
    set({ cancelModalOpen: false, selectedAppointmentId: null }),
  showToast: (message, type) => set({ toast: { message, type } }),
  dismissToast: () => set({ toast: null }),
  logout: () =>
    set({
      currentView: 'auth',
      customerEmail: '',
      customerFirstName: '',
      isAuthenticated: false,
      appointments: [],
      appointmentsError: null,
      showPastAppointments: false,
      toast: null,
    }),
}));
