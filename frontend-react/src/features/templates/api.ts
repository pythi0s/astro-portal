import { apiClient } from '@/api/client';
import type { MessageTemplate, MessageChannel, TriggerType } from './types';

export interface TemplateListParams {
  channel?: MessageChannel;
  trigger_type?: TriggerType;
}

export async function listTemplates(params: TemplateListParams = {}): Promise<MessageTemplate[]> {
  const { data } = await apiClient.get<MessageTemplate[]>('/templates/', { params });
  return data;
}

export async function createTemplate(body: Record<string, unknown>): Promise<MessageTemplate> {
  const { data } = await apiClient.post<MessageTemplate>('/templates/', body);
  return data;
}

export async function updateTemplate(id: number, body: Record<string, unknown>): Promise<MessageTemplate> {
  const { data } = await apiClient.put<MessageTemplate>(`/templates/${id}`, body);
  return data;
}

export async function deactivateTemplate(id: number): Promise<{ detail: string }> {
  const { data } = await apiClient.delete<{ detail: string }>(`/templates/${id}`);
  return data;
}
