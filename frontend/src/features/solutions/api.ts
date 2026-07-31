import { apiClient } from '@/api/client';
import type { Solution } from './types';

export interface SolutionListParams {
  category?: string;
  is_active?: boolean;
  search?: string;
  skip?: number;
  limit?: number;
}

export async function listSolutions(params: SolutionListParams = {}): Promise<Solution[]> {
  const { data } = await apiClient.get<Solution[]>('/solutions/', { params });
  return data;
}

export async function getSolution(id: number): Promise<Solution> {
  const { data } = await apiClient.get<Solution>(`/solutions/${id}`);
  return data;
}

export async function createSolution(body: Record<string, unknown>): Promise<Solution> {
  const { data } = await apiClient.post<Solution>('/solutions/', body);
  return data;
}

export async function updateSolution(id: number, body: Record<string, unknown>): Promise<Solution> {
  const { data } = await apiClient.put<Solution>(`/solutions/${id}`, body);
  return data;
}

export async function deactivateSolution(id: number): Promise<{ detail: string }> {
  const { data } = await apiClient.delete<{ detail: string }>(`/solutions/${id}`);
  return data;
}
