export const portalAppointmentKeys = {
  mine: ['portal', 'appointments'] as const,
  availability: (day: string) => ['portal', 'availability', day] as const,
  profile: ['portal', 'profile'] as const,
};
