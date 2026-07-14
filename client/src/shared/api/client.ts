import axios, { AxiosInstance } from 'axios';

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';

/** Base URL for static images and WebSocket (server root). */
export const IMAGE_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');
/** WebSocket (Socket.io) server URL. */
export const SOCKET_URL = IMAGE_BASE_URL;

/**
 * Resolve image URL: use as-is for full URLs or data URLs, else prepend server base.
 */
export function getImageUrl(pathOrUrl: string | undefined | null): string {
  if (!pathOrUrl) return '';
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://') || pathOrUrl.startsWith('data:')) {
    return pathOrUrl;
  }
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : '/' + pathOrUrl;
  return IMAGE_BASE_URL + path;
}

/**
 * Initials from a display name: "Mohammad Mantach" → "MM"
 */
export function getInitials(name?: string | null): string {
  const parts = (name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Default avatar when the user has not uploaded a profile picture (initials). */
export function getDefaultAvatarUrl(name?: string | null): string {
  const initialsSource = (name || 'User').trim() || 'User';
  const label = encodeURIComponent(initialsSource.slice(0, 40));
  return `https://ui-avatars.com/api/?name=${label}&background=16a34a&color=fff&size=256&bold=true`;
}

/** Resolve avatar URL, falling back to initials avatar. */
export function getAvatarUrl(pathOrUrl: string | undefined | null, name?: string | null): string {
  const resolved = getImageUrl(pathOrUrl);
  return resolved || getDefaultAvatarUrl(name);
}

function getAuthHeader() {
  try {
    const token = localStorage.getItem('mashtal_token');
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  } catch {
    return {};
  }
}

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  Object.assign(config.headers, getAuthHeader());
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ??
      (typeof error.response?.data === 'string' ? error.response.data : null) ??
      error.message ??
      `Request failed with status ${error.response?.status ?? 'unknown'}`;
    return Promise.reject(new Error(message));
  }
);

export async function apiGet<T = unknown>(path: string): Promise<T> {
  const data = await api.get<T>(path);
  return data as T;
}

export async function apiPost<T = unknown>(path: string, body: unknown): Promise<T> {
  const data = await api.post<T>(path, body);
  return data as T;
}

export async function apiPut<T = unknown>(path: string, body: unknown): Promise<T> {
  const data = await api.put<T>(path, body);
  return data as T;
}

export async function apiPatch<T = unknown>(path: string, body: unknown): Promise<T> {
  const data = await api.patch<T>(path, body);
  return data as T;
}

export async function apiDelete(path: string): Promise<void> {
  await api.delete(path);
}

export { api };
