import { apiClient } from './client';
import { Alert } from '../types';

export async function getAlerts(role: string): Promise<Alert[]> {
  return apiClient<Alert[]>(`/api/alerts?role=${encodeURIComponent(role)}`);
}
