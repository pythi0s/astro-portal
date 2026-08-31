import { apiClient } from '@/api/client';
import type { AutomationRule, AutomationRun } from './types';

const basePath = '/admin/automation-rules';

export async function listAutomationRules(): Promise<AutomationRule[]> {
  const { data } = await apiClient.get<AutomationRule[]>(`${basePath}/`);
  return data;
}

export async function getAutomationRule(id: number): Promise<AutomationRule> {
  const { data } = await apiClient.get<AutomationRule>(`${basePath}/${id}`);
  return data;
}

export async function createAutomationRule(
  body: Record<string, unknown>,
): Promise<AutomationRule> {
  const { data } = await apiClient.post<AutomationRule>(`${basePath}/`, body);
  return data;
}

export async function updateAutomationRule(
  id: number,
  body: Record<string, unknown>,
): Promise<AutomationRule> {
  const { data } = await apiClient.put<AutomationRule>(`${basePath}/${id}`, body);
  return data;
}

export async function deactivateAutomationRule(id: number): Promise<{ detail: string }> {
  const { data } = await apiClient.delete<{ detail: string }>(`${basePath}/${id}`);
  return data;
}

export async function listAutomationRuns(ruleId?: number): Promise<AutomationRun[]> {
  const { data } = await apiClient.get<AutomationRun[]>(`${basePath}/runs`, {
    params: ruleId ? { rule_id: ruleId } : undefined,
  });
  return data;
}
