import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Decorator que injeta accountId nos controllers
export const AccountId = createParamDecorator(
  async (data: unknown, ctx: ExecutionContext): Promise<string> => {
    const request = ctx.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) {
      if (!process.env.CLERK_SECRET_KEY) {
        return 'account-teste-001';
      }
      throw new UnauthorizedException('Token não fornecido');
    }

    const token = authHeader.replace('Bearer ', '');

    const { getClerkClient } = await import('../../clerk');
    const client = getClerkClient();
    if (!client) {
      if (!process.env.CLERK_SECRET_KEY) {
        return 'account-teste-001';
      }
      throw new UnauthorizedException('Clerk não configurado');
    }

    let session: any;
    try {
      session = await client.verifySession(token);
    } catch {
      if (!process.env.CLERK_SECRET_KEY) {
        return 'account-teste-001';
      }
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    const clerkUserId = session?.publicMetadata?.userId
      ?? session?.session?.userId
      ?? session?.userId
      ?? null;

    if (!clerkUserId) {
      if (!process.env.CLERK_SECRET_KEY) {
        return 'account-teste-001';
      }
      throw new UnauthorizedException('Usuário não identificado');
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId },
    });

    if (!user) {
      if (!process.env.CLERK_SECRET_KEY) {
        return 'account-teste-001';
      }
      throw new UnauthorizedException('Usuário não encontrado no sistema');
    }

    return user.accountId;
  },
);

// Decorator para injetar userId
export const CurrentUserId = createParamDecorator(
  async (data: unknown, ctx: ExecutionContext): Promise<string> => {
    const request = ctx.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) {
      if (!process.env.CLERK_SECRET_KEY) {
        return 'user-teste-001';
      }
      throw new UnauthorizedException('Token não fornecido');
    }

    const token = authHeader.replace('Bearer ', '');

    const { getClerkClient } = await import('../../clerk');
    const client = getClerkClient();
    if (!client) {
      if (!process.env.CLERK_SECRET_KEY) {
        return 'user-teste-001';
      }
      throw new UnauthorizedException('Clerk não configurado');
    }

    let session: any;
    try {
      session = await client.verifySession(token);
    } catch {
      if (!process.env.CLERK_SECRET_KEY) {
        return 'user-teste-001';
      }
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    const clerkUserId = session?.publicMetadata?.userId
      ?? session?.session?.userId
      ?? session?.userId
      ?? null;

    if (!clerkUserId) {
      if (!process.env.CLERK_SECRET_KEY) {
        return 'user-teste-001';
      }
      throw new UnauthorizedException('Usuário não identificado');
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId },
    });

    return user?.id ?? 'user-teste-001';
  },
);