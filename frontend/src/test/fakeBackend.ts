import { http, HttpResponse } from 'msw';
import { fakeAdminUser } from './msw';

const ts = '2026-03-15T10:00:00Z';

export const fx = {
  customer: {
    id: 1,
    name: 'Aarav Sharma',
    email: 'aarav@example.com',
    phone: '+919000000001',
    gender: 'male',
    date_of_birth: '1990-01-01',
    birth_time: '06:30:00',
    birth_place: 'Pune',
    occupation: 'Engineer',
    marital_status: 'single',
    address: null,
    city: 'Pune',
    state: 'MH',
    pincode: '411001',
    rashi: 'Mesha',
    nakshatra: 'Ashwini',
    gotra: null,
    lagna: null,
    photo_path: null,
    kundali_file_path: null,
    kundali_original_name: null,
    notes: null,
    is_active: true,
    created_by: 1,
    created_at: ts,
    updated_at: ts,
  },
  visit: {
    id: 1,
    customer_id: 1,
    visited_by: 1,
    visit_date: '2026-03-15',
    consultation_type: 'first_visit',
    problems_discussed: 'Career',
    analysis: null,
    recommendations: null,
    fees: '500.00',
    payment_status: 'paid',
    payment_method: 'upi',
    follow_up_date: null,
    notes: null,
    created_at: ts,
    updated_at: ts,
  },
  solution: {
    id: 1,
    name: 'Ruby',
    category: 'gemstone',
    description: 'Wear on Sunday',
    instructions: null,
    typical_duration: '3 months',
    is_active: true,
    created_at: ts,
    updated_at: ts,
  },
  template: {
    id: 1,
    name: 'Welcome',
    channel: 'email',
    trigger_type: 'first_visit',
    subject: 'Welcome {{customer_name}}',
    body: 'Hello {{customer_name}}',
    is_active: true,
    created_at: ts,
    updated_at: ts,
  },
  message: {
    id: 1,
    customer_id: 1,
    template_id: 1,
    visit_id: null,
    channel: 'email',
    recipient: 'aarav@example.com',
    subject: 'Welcome',
    body_snapshot: 'Hello',
    status: 'sent',
    error_message: null,
    sent_at: ts,
    created_at: ts,
  },
  rule: {
    id: 1,
    name: 'Follow-up reminder',
    trigger: 'follow_up_due',
    template_id: 1,
    channel: 'email',
    offset_days: 1,
    is_active: true,
    filter: null,
    timezone: 'Asia/Kolkata',
    send_window_start_hour: 9,
    send_window_end_hour: 18,
    created_at: ts,
    updated_at: ts,
  },
};

export const fakeOverview = {
  today: '2026-03-15',
  appointments_today: 2,
  remaining_today: 1,
  next_appointment: {
    id: 1,
    customer_id: 1,
    customer_name: 'Aarav Sharma',
    start_at: '2026-03-15T14:00:00',
    end_at: '2026-03-15T14:30:00',
    duration_minutes: 30,
  },
  upcoming_7_days: 5,
  appointments_this_month: 12,
  appointments_total: 40,
  collected_this_month: '15000.00',
  collected_last_month: '12000.00',
  collected_change_pct: 25,
  collected_daily: [
    { day: '2026-03-01', amount: '5000.00' },
    { day: '2026-03-02', amount: '10000.00' },
  ],
  outstanding_total: '2500.00',
  new_customers_this_month: 3,
  recent_customers: [
    { id: 1, name: 'Aarav Sharma', phone: '+919000000001', created_at: ts, self_registered: true },
    { id: 2, name: 'Priya Nair', phone: null, created_at: ts, self_registered: false },
  ],
  follow_ups_due: [
    { visit_id: 9, customer_id: 2, customer_name: 'Priya Nair', customer_phone: '+919000000002', follow_up_date: '2026-03-14' },
  ],
};

type Resolver = (url: URL) => unknown;

// Ordered: first matching pattern wins.
const routes: [RegExp, Resolver][] = [
  [/^\/auth\/me$/, () => fakeAdminUser],
  [/^\/customers\/$/, () => [fx.customer]],
  [/^\/customers\/\d+$/, () => ({ ...fx.customer, visits: [fx.visit], customer_solutions: [] })],
  [/^\/customers\/\d+\/visits$/, () => [fx.visit]],
  [/^\/customers\/\d+\/solutions$/, () => []],
  [/^\/timeline\/\d+$/, () => []],
  [/^\/visits\/$/, () => [fx.visit]],
  [/^\/visits\/\d+$/, () => ({ ...fx.visit, solutions: [] })],
  [/^\/solutions\/$/, () => [fx.solution]],
  [/^\/solutions\/\d+$/, () => fx.solution],
  [/^\/templates\/$/, () => [fx.template]],
  [/^\/messages\/log$/, () => [fx.message]],
  [/^\/admin\/users$/, () => [fakeAdminUser]],
  [/^\/admin\/users\/\d+$/, () => fakeAdminUser],
  [/^\/admin\/stats$/, () => ({ total_users: 1, active_users: 1, admin_count: 1 })],
  [/^\/admin\/automation-rules\/$/, () => [fx.rule]],
  [/^\/admin\/automation-rules\/runs$/, () => []],
  [/^\/admin\/automation-rules\/\d+$/, () => fx.rule],
  [/^\/appointments\/$/, () => []],
  [/^\/dashboard\/overview$/, () => fakeOverview],
  [
    /^\/dashboard\/revenue$/,
    () => ({
      from_date: '2026-03-01',
      to_date: '2026-03-30',
      collected: '500.00',
      outstanding: '0.00',
      waived: '0.00',
      gross: '500.00',
      visit_count: 1,
      avg_fee: '500.00',
      collection_rate: 100,
    }),
  ],
  [
    /^\/dashboard\/earnings$/,
    () => ({
      period: 'daily',
      start_date: '2026-03-01',
      end_date: '2026-03-30',
      breakdown: [],
      grand_total: '0.00',
    }),
  ],
  [
    /^\/dashboard\/revenue-by-category$/,
    () => ({ from_date: '2026-03-01', to_date: '2026-03-30', rows: [], grand_total: '0.00' }),
  ],
];

/** Collects any API path the fake backend did not know how to answer. */
export const unknownRequests: string[] = [];

export const fakeBackendHandler = http.all('/api/*', ({ request }) => {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api/, '');
  if (request.method !== 'GET') return HttpResponse.json({});
  const match = routes.find(([re]) => re.test(path));
  if (!match) {
    unknownRequests.push(`${request.method} ${path}`);
    return HttpResponse.json({ detail: 'not mocked' }, { status: 404 });
  }
  return HttpResponse.json(match[1](url) as Record<string, unknown>);
});
