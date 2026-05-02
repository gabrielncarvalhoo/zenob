import { auth } from '@clerk/nextjs';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

export async function fetchWithAuth(path: string, options: RequestInit = {}) {
  const { session } = await auth();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };

  // Em dev sem Clerk, usa fallback
  if (process.env.NODE_ENV === 'development' && !process.env.CLERK_SECRET_KEY) {
    headers['x-account-id'] = 'account-teste-001';
  } else if (session) {
    const token = await session.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
}