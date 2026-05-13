import { useQuery } from '@tanstack/react-query';
import { listCustomers, type CustomerListParams } from '../api';
import { customerKeys } from '../queryKeys';

export function useCustomerList(params: CustomerListParams) {
  return useQuery({
    queryKey: customerKeys.list(params as Record<string, unknown>),
    queryFn: () => listCustomers(params),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}
