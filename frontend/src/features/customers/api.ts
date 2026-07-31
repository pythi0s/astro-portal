import { apiClient } from '@/api/client';
import { uploadFile } from '@/api/upload';
import type {
  Customer,
  CustomerListRow,
  CustomerSolutionHistory,
  VisitFull,
} from './types';

export interface CustomerListParams {
  search?: string;
  is_active?: boolean;
  skip?: number;
  limit?: number;
}

export async function listCustomers(params: CustomerListParams = {}): Promise<CustomerListRow[]> {
  const { data } = await apiClient.get<CustomerListRow[]>('/customers/', { params });
  return data;
}

export async function getCustomer(id: number): Promise<Customer> {
  const { data } = await apiClient.get<Customer>(`/customers/${id}`);
  return data;
}

export async function createCustomer(body: Record<string, unknown>): Promise<Customer> {
  const { data } = await apiClient.post<Customer>('/customers/', body);
  return data;
}

export async function updateCustomer(id: number, body: Record<string, unknown>): Promise<Customer> {
  const { data } = await apiClient.put<Customer>(`/customers/${id}`, body);
  return data;
}

/** Soft-delete; returns { detail: string } from the backend. */
export async function deactivateCustomer(id: number): Promise<{ detail: string }> {
  const { data } = await apiClient.delete<{ detail: string }>(`/customers/${id}`);
  return data;
}

export async function uploadPhoto(id: number, file: File): Promise<Customer> {
  return uploadFile<Customer>(`/customers/${id}/photo`, { fieldName: 'file', file });
}

export async function uploadKundali(id: number, file: File): Promise<Customer> {
  return uploadFile<Customer>(`/customers/${id}/kundali`, { fieldName: 'file', file });
}

export async function getCustomerVisits(id: number): Promise<VisitFull[]> {
  const { data } = await apiClient.get<VisitFull[]>(`/customers/${id}/visits`);
  return data;
}

export async function getCustomerSolutions(id: number): Promise<CustomerSolutionHistory[]> {
  const { data } = await apiClient.get<CustomerSolutionHistory[]>(`/customers/${id}/solutions`);
  return data;
}
