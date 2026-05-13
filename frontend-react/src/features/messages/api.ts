import { apiClient } from '@/api/client';
import type { MessageLog } from './types';

export interface LogListParams {
  customer_id?: number;
  channel?: string;
  skip?: number;
  limit?: number;
}

export async function listLogs(params: LogListParams = {}): Promise<MessageLog[]> {
  const { data } = await apiClient.get<MessageLog[]>('/messages/log', { params });
  return data;
}

export async function sendEmail(body: {
  customer_id: number;
  template_id?: number;
  visit_id?: number;
  subject?: string | null;
  body?: string | null;
}): Promise<MessageLog> {
  const { data } = await apiClient.post<MessageLog>('/messages/send-email', body);
  return data;
}

export async function sendWhatsApp(body: {
  customer_id: number;
  template_id: number;
  visit_id?: number;
}): Promise<MessageLog> {
  const { data } = await apiClient.post<MessageLog>('/messages/send-whatsapp', body);
  return data;
}
