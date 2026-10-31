import axios, { AxiosError, type AxiosInstance } from 'axios';
import { usePortalAuthStore } from './store';
import type {
  Appointment,
  Availability,
  BookRequest,
  PortalAccount,
  PortalProfile,
  RegisterRequest,
} from './types';
import type { TokenResponse } from '@/types/api';

// Independent of the staff apiClient: no silent refresh and no redirect to the staff /login.
export const portalClient: AxiosInstance = axios.create({
  baseURL: '/api/portal',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

portalClient.interceptors.request.use((config) => {
  const token = usePortalAuthStore.getState().token;
  if (token) config.headers.set?.('Authorization', `Bearer ${token}`);
  return config;
});

portalClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    const url = error.config?.url ?? '';
    if (error.response?.status === 401 && !url.startsWith('/auth/')) {
      usePortalAuthStore.getState().clear();
    }
    return Promise.reject(error);
  },
);

/** `identifier` is the customer's mobile number (any common format) or email. */
export async function portalLogin(identifier: string, password: string): Promise<TokenResponse> {
  const { data } = await portalClient.post<TokenResponse>('/auth/login', { identifier, password });
  return data;
}

export async function portalRegister(body: RegisterRequest): Promise<TokenResponse> {
  const { data } = await portalClient.post<TokenResponse>('/auth/register', body);
  return data;
}

export async function portalMe(): Promise<PortalAccount> {
  const { data } = await portalClient.get<PortalAccount>('/auth/me');
  return data;
}

export async function getProfile(): Promise<PortalProfile> {
  const { data } = await portalClient.get<PortalProfile>('/profile');
  return data;
}

export async function updateProfile(body: Partial<PortalProfile>): Promise<PortalProfile> {
  const { data } = await portalClient.put<PortalProfile>('/profile', body);
  return data;
}

export async function getAvailability(day: string): Promise<Availability> {
  const { data } = await portalClient.get<Availability>('/availability', {
    params: { date: day },
  });
  return data;
}

export async function listMyAppointments(): Promise<Appointment[]> {
  const { data } = await portalClient.get<Appointment[]>('/appointments');
  return data;
}

export async function bookAppointment(body: BookRequest): Promise<Appointment> {
  const { data } = await portalClient.post<Appointment>('/appointments', body);
  return data;
}

export async function cancelAppointment(id: number): Promise<Appointment> {
  const { data } = await portalClient.post<Appointment>(`/appointments/${id}/cancel`);
  return data;
}
