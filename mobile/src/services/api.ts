/**
 * Mobile API service — mirrors frontend/src/services/api.ts
 * Uses SecureStore for token instead of localStorage.
 * All requests go to the same backend endpoints.
 */
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'auth_token';

// ─── Token management ─────────────────────────────────────────────────────────
// expo-secure-store has no web implementation; fall back to localStorage on web.

export async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(TOKEN_KEY, token);
    return;
  }
  return SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function removeToken(): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(TOKEN_KEY);
    return;
  }
  return SecureStore.deleteItemAsync(TOKEN_KEY);
}

// ─── Core request helper ──────────────────────────────────────────────────────

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: Record<string, unknown>;
  auth?: boolean; // default: true
}

export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, auth = true } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (auth) {
    const token = await getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || `Request failed: ${response.status}`);
  }

  return data as T;
}

// ─── Typed API calls (mirrors web api.ts) ────────────────────────────────────

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  subscription?: { plan: string; status: string };
  profilePicture?: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<AuthResponse>('/auth/login', { method: 'POST', body: { email, password }, auth: false }),

  register: (name: string, email: string, password: string) =>
    apiRequest<AuthResponse>('/auth/register', { method: 'POST', body: { name, email, password }, auth: false }),

  me: () =>
    apiRequest<{ success: boolean; data: User }>('/auth/me'),
};

// Interview
export const interviewApi = {
  start: (body: {
    role: string;
    experienceLevel: string;
    mode: 'text' | 'voice' | 'hybrid';
    interviewMode?: string;
  }) => apiRequest('/interview/start', { method: 'POST', body }),

  nextQuestion: (sessionId: string, answer: string) =>
    apiRequest('/interview/next', { method: 'POST', body: { sessionId, answer } }),

  end: (sessionId: string) =>
    apiRequest('/interview/end', { method: 'POST', body: { sessionId } }),

  sessions: (limit = 20) =>
    apiRequest(`/interview/sessions?limit=${limit}`),

  report: (sessionId: string) =>
    apiRequest(`/interview/report/${sessionId}`),
};

// Analytics
export const analyticsApi = {
  stats: () => apiRequest('/analytics/stats'),
  leaderboard: () => apiRequest('/leaderboard'),
};

// User
export const userApi = {
  update: (body: { name?: string; email?: string }) =>
    apiRequest('/user/profile', { method: 'PUT', body }),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiRequest('/user/change-password', { method: 'PUT', body: { currentPassword, newPassword } }),
};
