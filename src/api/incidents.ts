import { apiClient } from './client';
import { DisruptionIncident } from '../types';

export async function getIncidents(): Promise<DisruptionIncident[]> {
  return apiClient<DisruptionIncident[]>('/api/incidents');
}

export async function getIncident(incidentId: string): Promise<DisruptionIncident> {
  return apiClient<DisruptionIncident>(`/api/incidents/${encodeURIComponent(incidentId)}`);
}

export async function updateIncidentStatus(incidentId: string, status: string): Promise<DisruptionIncident> {
  return apiClient<DisruptionIncident>(`/api/incidents/${encodeURIComponent(incidentId)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
