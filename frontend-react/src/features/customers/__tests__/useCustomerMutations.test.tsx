import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw';
import {
  useUpdateCustomer,
  useUploadKundali,
  useUploadPhoto,
} from '@/features/customers/hooks/useCustomerMutations';
import { customerKeys } from '@/features/customers/queryKeys';
import type {
  Customer,
  CustomerSolutionBrief,
  VisitBrief,
} from '@/features/customers/types';

/**
 * Regression coverage for the schema-split cache-merge fix.
 *
 * After the backend split CustomerRead into a slim (POST/PUT/photo/kundali)
 * and a detail (GET-by-id) schema, the success handlers in
 * `useCustomerMutations` overwriting the detail cache with the slim response
 * would erase `visits` and `customer_solutions` — which `CustomerDetailPage`
 * reads for tab badge counts. The fix changed the writes to a shallow merge
 * with the previous cached value. These tests pin that merge invariant.
 */

const visits: VisitBrief[] = [
  {
    id: 9,
    visit_date: '2026-05-01',
    consultation_type: 'follow_up',
    fees: '0.00',
    payment_status: 'pending',
    payment_method: null,
    problems_discussed: null,
    analysis: null,
    recommendations: null,
    follow_up_date: null,
    notes: null,
    created_at: '2026-05-01T10:00:00Z',
  },
];

const customerSolutions: CustomerSolutionBrief[] = [
  {
    id: 7,
    solution_id: 3,
    visit_id: 9,
    given_date: '2026-05-01',
    status: 'active',
    notes: null,
    created_at: '2026-05-01T10:00:00Z',
    solution: { id: 3, name: 'Daily Pooja', category: 'ritual' },
  },
];

function seededDetail(id: number, patch: Partial<Customer> = {}): Customer {
  return {
    id,
    name: 'Seeded Customer',
    email: null,
    phone: null,
    gender: null,
    date_of_birth: null,
    birth_time: null,
    birth_place: null,
    occupation: null,
    marital_status: null,
    address: null,
    city: null,
    state: null,
    pincode: null,
    rashi: null,
    nakshatra: null,
    gotra: null,
    lagna: null,
    photo_path: null,
    kundali_file_path: null,
    kundali_original_name: null,
    notes: null,
    is_active: true,
    created_by: 1,
    created_at: '2026-05-01T00:00:00Z',
    updated_at: '2026-05-01T00:00:00Z',
    visits,
    customer_solutions: customerSolutions,
    ...patch,
  };
}

/** Slim payload as returned by POST/PUT/photo/kundali — no relationship keys. */
function slimResponse(id: number, patch: Partial<Customer> = {}): Customer {
  return {
    id,
    name: 'Seeded Customer',
    email: null,
    phone: null,
    gender: null,
    date_of_birth: null,
    birth_time: null,
    birth_place: null,
    occupation: null,
    marital_status: null,
    address: null,
    city: null,
    state: null,
    pincode: null,
    rashi: null,
    nakshatra: null,
    gotra: null,
    lagna: null,
    photo_path: null,
    kundali_file_path: null,
    kundali_original_name: null,
    notes: null,
    is_active: true,
    created_by: 1,
    created_at: '2026-05-01T00:00:00Z',
    updated_at: '2026-05-12T10:00:00Z',
    ...patch,
  };
}

function freshClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

function makeWrapper(qc: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

describe('useUpdateCustomer cache merge', () => {
  it('preserves visits and customer_solutions in the detail cache after a slim PUT response', async () => {
    const qc = freshClient();
    qc.setQueryData<Customer>(customerKeys.detail(1), seededDetail(1));

    server.use(
      http.put('/customers/1', () =>
        HttpResponse.json(slimResponse(1, { name: 'Updated Name', city: 'Bengaluru' })),
      ),
    );

    const { result } = renderHook(() => useUpdateCustomer(1), { wrapper: makeWrapper(qc) });

    await act(async () => {
      await result.current.mutateAsync({ name: 'Updated Name', city: 'Bengaluru' });
    });

    await waitFor(() => {
      const cached = qc.getQueryData<Customer>(customerKeys.detail(1));
      expect(cached).toBeDefined();
      expect(cached?.name).toBe('Updated Name');
      expect(cached?.city).toBe('Bengaluru');
      // The merge invariant: relationship arrays from the prior GET survive
      // the PUT success handler.
      expect(cached?.visits).toHaveLength(1);
      expect(cached?.customer_solutions).toHaveLength(1);
    });
  });
});

describe('useUploadPhoto cache merge', () => {
  it('preserves visits and customer_solutions after a slim photo upload response', async () => {
    const qc = freshClient();
    qc.setQueryData<Customer>(customerKeys.detail(1), seededDetail(1));

    server.use(
      http.post('/customers/1/photo', () =>
        HttpResponse.json(slimResponse(1, { photo_path: '/uploads/photos/x.jpg' })),
      ),
    );

    const { result } = renderHook(() => useUploadPhoto(1), { wrapper: makeWrapper(qc) });

    const file = new File([new Uint8Array([1, 2, 3])], 'me.jpg', { type: 'image/jpeg' });

    await act(async () => {
      await result.current.mutateAsync(file);
    });

    await waitFor(() => {
      const cached = qc.getQueryData<Customer>(customerKeys.detail(1));
      expect(cached?.photo_path).toBe('/uploads/photos/x.jpg');
      expect(cached?.visits).toHaveLength(1);
      expect(cached?.customer_solutions).toHaveLength(1);
    });
  });
});

describe('useUploadKundali cache merge', () => {
  it('preserves visits and customer_solutions after a slim kundali upload response', async () => {
    const qc = freshClient();
    qc.setQueryData<Customer>(customerKeys.detail(1), seededDetail(1));

    server.use(
      http.post('/customers/1/kundali', () =>
        HttpResponse.json(
          slimResponse(1, {
            kundali_file_path: '/uploads/kundali/k.pdf',
            kundali_original_name: 'k.pdf',
          }),
        ),
      ),
    );

    const { result } = renderHook(() => useUploadKundali(1), { wrapper: makeWrapper(qc) });

    const file = new File([new Uint8Array([1, 2, 3])], 'k.pdf', { type: 'application/pdf' });

    await act(async () => {
      await result.current.mutateAsync(file);
    });

    await waitFor(() => {
      const cached = qc.getQueryData<Customer>(customerKeys.detail(1));
      expect(cached?.kundali_file_path).toBe('/uploads/kundali/k.pdf');
      expect(cached?.kundali_original_name).toBe('k.pdf');
      expect(cached?.visits).toHaveLength(1);
      expect(cached?.customer_solutions).toHaveLength(1);
    });
  });
});
