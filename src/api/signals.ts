import { apiClient } from './client';

export async function getDomainSignals(domain: string, lineId?: string): Promise<any> {
  const url = new URL(`/api/domains/${encodeURIComponent(domain)}/signals`, 'http://localhost');
  if (lineId) {
    url.searchParams.append('line_id', lineId);
  }
  // Remove the domain part, return just path + query
  return apiClient<any>(`${url.pathname}${url.search}`);
}
