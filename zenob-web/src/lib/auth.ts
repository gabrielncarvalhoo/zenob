import { auth } from '@clerk/nextjs';

export async function getAuthHeader(): Promise<string> {
  const { session } = await auth();
  if (!session) return '';
  return `Bearer ${session}`;
}