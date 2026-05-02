import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class AccountsService {
  async getAccountIdFromClerkUser(clerkUserId: string): Promise<string | null> {
    const user = await prisma.user.findUnique({
      where: { clerkUserId },
      include: { account: true },
    });
    return user?.accountId ?? null;
  }

  async getUserByClerkId(clerkUserId: string) {
    return prisma.user.findUnique({
      where: { clerkUserId },
      include: { account: true },
    });
  }

  async upsertUserFromClerk(clerkUserId: string, data: {
    email: string;
    name: string;
    avatarUrl?: string;
  }) {
    const existing = await prisma.user.findUnique({
      where: { clerkUserId },
    });

    if (existing) {
      return prisma.user.update({
        where: { clerkUserId },
        data: { email: data.email, name: data.name, avatarUrl: data.avatarUrl },
      });
    }

    // Cria account + user juntos na primeira vez
    const account = await prisma.account.create({
      data: {
        billingEmail: data.email,
        users: {
          create: {
            clerkUserId,
            email: data.email,
            name: data.name,
            avatarUrl: data.avatarUrl,
          },
        },
      },
      include: { users: true },
    });

    return account.users[0];
  }

  async updateUserClerkId(userId: string, clerkUserId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { clerkUserId },
    });
  }

  async linkClerkUserToAccount(clerkUserId: string, accountId: string, userData: {
    email: string;
    name: string;
    avatarUrl?: string;
  }) {
    // Verifica se já existe user com esse clerkUserId
    const existing = await prisma.user.findUnique({
      where: { clerkUserId },
    });

    if (existing) {
      if (existing.accountId !== accountId) {
        throw new BadRequestException('Usuário Clerk já vinculado a outra conta');
      }
      return existing;
    }

    // Verifica se já existe user com mesmo email nessa account
    const existingEmail = await prisma.user.findFirst({
      where: { accountId, email: userData.email },
    });

    if (existingEmail) {
      return prisma.user.update({
        where: { id: existingEmail.id },
        data: { clerkUserId, avatarUrl: userData.avatarUrl },
      });
    }

    return prisma.user.create({
      data: {
        accountId,
        clerkUserId,
        email: userData.email,
        name: userData.name,
        avatarUrl: userData.avatarUrl,
      },
    });
  }
}