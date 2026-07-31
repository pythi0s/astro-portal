import { apiClient } from '@/api/client';
import type { VisitRow, VisitWithSolutions } from './types';

export interface VisitListParams {
  customer_id?: number;
  payment_status?: string;
  date_from?: string;
  date_to?: string;
  include_inactive?: boolean;
  skip?: number;
  limit?: number;
}

export async function listVisits(params: VisitListParams = {}): Promise<VisitRow[]> {
  const { data } = await apiClient.get<VisitRow[]>('/visits/', { params });
  return data;
}

export async function getVisit(id: number): Promise<VisitWithSolutions> {
  const { data } = await apiClient.get<VisitWithSolutions>(`/visits/${id}`);
  return data;
}

export async function createVisit(body: Record<string, unknown>): Promise<VisitRow> {
  const { data } = await apiClient.post<VisitRow>('/visits/', body);
  return data;
}

export async function updateVisit(id: number, body: Record<string, unknown>): Promise<VisitRow> {
  const { data } = await apiClient.put<VisitRow>(`/visits/${id}`, body);
  return data;
}

export async function deactivateVisit(id: number): Promise<{ detail: string }> {
  const { data } = await apiClient.delete<{ detail: string }>(`/visits/${id}`);
  return data;
}
