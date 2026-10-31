export type AppointmentStatus = 'booked' | 'completed' | 'cancelled';

export interface PortalAccount {
  id: number;
  customer_id: number;
  phone: string;
  email: string | null;
  name: string;
}

export type Gender = 'male' | 'female' | 'other';

/** Optional self-reported details captured at sign-up and editable later. */
export interface PortalProfileFields {
  email?: string | null;
  gender?: Gender | null;
  date_of_birth?: string | null;
  birth_time?: string | null;
  birth_place?: string | null;
  occupation?: string | null;
  marital_status?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  rashi?: string | null;
  nakshatra?: string | null;
  gotra?: string | null;
}

export interface PortalProfile extends PortalProfileFields {
  name: string;
  phone: string;
  reminders_opt_in: boolean;
}

export interface Appointment {
  id: number;
  customer_id: number;
  /** Naive wall-clock ISO string in the practice timezone, e.g. 2026-11-02T10:00:00 */
  start_at: string;
  end_at: string;
  duration_minutes: number;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
}

export interface BusyRange {
  start_at: string;
  end_at: string;
}

export interface Availability {
  day: string;
  open_time: string;
  close_time: string;
  min_duration: number;
  max_duration: number;
  slot_step_minutes: number;
  now: string;
  busy: BusyRange[];
}

export interface RegisterRequest extends PortalProfileFields {
  name: string;
  phone: string;
  password: string;
  reminders_opt_in?: boolean;
}

export interface BookRequest {
  start_at: string;
  duration_minutes: number;
  notes?: string;
}
