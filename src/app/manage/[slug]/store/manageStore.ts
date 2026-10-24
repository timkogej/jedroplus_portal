import { create } from 'zustand';
import type { Appointment } from '../lib/mockData';
import type { CompanyProfile } from '../lib/companyProfile';

export type ViewState = 'auth' | 'verification' | 'dashboard';
export type PortalLanguage = 'sl' | 'en';

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
  themeReady: boolean;
  companyName: string;
  companySlug: string;
  companyProfile: CompanyProfile | null;

  currentView: ViewState;
  customerEmail: string;
  customerFirstName: string;
  language: PortalLanguage;
  isAuthenticated: boolean;

  allAppointments: Appointment[];
  upcomingAppointments: Appointment[];
  pastAppointments: Appointment[];
  isLoadingAppointments: boolean;
  appointmentsError: string | null;

  showPastAppointments: boolean;
  rescheduleModalOpen: boolean;
  cancelModalOpen: boolean;
  selectedAppointmentId: string | null;

  toast: Toast | null;

  setTheme: (theme: Theme) => void;
  setThemeReady: (ready: boolean) => void;
  setCompanyInfo: (name: string, slug: string) => void;
  setCompanyProfile: (profile: CompanyProfile | null) => void;
  setCurrentView: (view: ViewState) => void;
  setCustomerEmail: (email: string) => void;
  setCustomerFirstName: (name: string) => void;
  setLanguage: (language: PortalLanguage) => void;
  setAuthenticated: (value: boolean) => void;
  setAppointmentLists: (lists: { all: Appointment[]; upcoming: Appointment[]; past: Appointment[] }) => void;
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

export const DEFAULT_THEME: Theme = {
  primaryColor: '#374151',
  secondaryColor: '#4B5563',
  bgFrom: '#F9FAFB',
  bgTo: '#F3F4F6',
};

export const useManageStore = create<ManageStore>((set) => ({
  theme: DEFAULT_THEME,
  themeReady: false,
  companyName: '',
  companySlug: '',
  companyProfile: null,

  currentView: 'auth',
  customerEmail: '',
  customerFirstName: '',
  language: 'sl',
  isAuthenticated: false,

  allAppointments: [],
  upcomingAppointments: [],
  pastAppointments: [],
  isLoadingAppointments: false,
  appointmentsError: null,

  showPastAppointments: false,
  rescheduleModalOpen: false,
  cancelModalOpen: false,
  selectedAppointmentId: null,

  toast: null,

  setTheme: (theme) => set({ theme }),
  setThemeReady: (ready) => set({ themeReady: ready }),
  setCompanyInfo: (name, slug) => set({ companyName: name, companySlug: slug }),
  setCompanyProfile: (profile) => set({ companyProfile: profile }),
  setCurrentView: (view) => set({ currentView: view }),
  setCustomerEmail: (email) => set({ customerEmail: email }),
  setCustomerFirstName: (name) => set({ customerFirstName: name }),
  setLanguage: (language) => {
    try { localStorage.setItem('portal_language', language); } catch { /* unavailable */ }
    set({ language });
  },
  setAuthenticated: (value) => set({ isAuthenticated: value }),
  setAppointmentLists: ({ all, upcoming, past }) =>
    set({ allAppointments: all, upcomingAppointments: upcoming, pastAppointments: past }),
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
      allAppointments: [],
      upcomingAppointments: [],
      pastAppointments: [],
      appointmentsError: null,
      showPastAppointments: false,
      toast: null,
    }),
}));
