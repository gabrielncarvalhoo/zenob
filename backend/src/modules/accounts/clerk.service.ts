import { Injectable } from '@nestjs/common';
import { getClerkClient } from '../../clerk';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class ClerkService {
  async verifyToken(token: string) {
    const client = getClerkClient();
    if (!client) return null;
    try {
      return await client.verifySession(token);
    } catch {
      return null;
    }
  }

  async getUser(clerkUserId: string) {
    const client = getClerkClient();
    if (!client) return null;
    try {
      return await client.users.getUser(clerkUserId);
    } catch {
      return null;
    }
  }

  async extractClerkUserId(session: any): Promise<string | null> {
    return session?.publicMetadata?.userId
      ?? session?.session?.userId
      ?? session?.userId
      ?? null;
  }
}