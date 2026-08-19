const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const DEFAULT_TIMEOUT = 10000;

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Ensure no double slashes if BASE_URL ends with / and endpoint starts with /
  const cleanBase = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${cleanBase}${cleanEndpoint}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new ApiError(`Request failed with status ${response.status}`, response.status);
    }

    if (response.status === 204) {
      return {} as T;
    }

    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    try {
      return JSON.parse(text);
    } catch (e) {
      throw new ApiError('Failed to parse JSON response');
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new ApiError(`Request timed out after ${DEFAULT_TIMEOUT}ms`);
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(`Network error: ${error.message}`);
  } finally {
    clearTimeout(timeoutId);
  }
}
