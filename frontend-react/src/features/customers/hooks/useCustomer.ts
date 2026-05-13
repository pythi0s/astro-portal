import { useQuery } from '@tanstack/react-query';
import { getCustomer, getCustomerSolutions, getCustomerVisits } from '../api';
import { customerKeys } from '../queryKeys';

export function useCustomer(id: number | undefined) {
  return useQuery({
    queryKey: id ? customerKeys.detail(id) : customerKeys.details(),
    queryFn: () => getCustomer(id as number),
    enabled: id !== undefined && Number.isFinite(id),
  });
}

export function useCustomerVisits(id: number | undefined) {
  return useQuery({
    queryKey: id ? customerKeys.visits(id) : ['customers', 'visits', 'disabled'],
    queryFn: () => getCustomerVisits(id as number),
    enabled: id !== undefined && Number.isFinite(id),
  });
}

export function useCustomerSolutions(id: number | undefined) {
  return useQuery({
    queryKey: id ? customerKeys.solutions(id) : ['customers', 'solutions', 'disabled'],
    queryFn: () => getCustomerSolutions(id as number),
    enabled: id !== undefined && Number.isFinite(id),
  });
}
