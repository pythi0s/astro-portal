import type { Appointment, AppointmentStatus } from '@/portal/types';

export type { AppointmentStatus };

export const APPOINTMENT_STATUSES: readonly AppointmentStatus[] = ['booked', 'completed', 'cancelled'];

export interface StaffAppointment extends Appointment {
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
}
