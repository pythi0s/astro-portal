import { apiClient } from '@/api/client';
import type { AppointmentStatus, StaffAppointment } from './types';

export interface AppointmentListParams {
  date_from?: string;
  date_to?: string;
  status?: string;
  customer_id?: number;
  skip?: number;
  limit?: number;
}

export async function listAppointments(params: AppointmentListParams = {}): Promise<StaffAppointment[]> {
  const { data } = await apiClient.get<StaffAppointment[]>('/appointments/', { params });
  return data;
}

export async function updateAppointment(
  id: number,
  body: { status?: AppointmentStatus; notes?: string },
): Promise<StaffAppointment> {
  const { data } = await apiClient.patch<StaffAppointment>(`/appointments/${id}`, body);
  return data;
}
