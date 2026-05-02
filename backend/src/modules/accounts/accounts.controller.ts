import { Controller, Post, Body, Get, Headers, UnauthorizedException } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { ClerkService } from './clerk.service';

@Controller('accounts')
export class AccountsController {
  constructor(
    private readonly accountsService: AccountsService,
    private readonly clerkService: ClerkService,
  ) {}

  // Webhook do Clerk — cria/actualiza usuário quando Clerk notifica
  @Post('webhooks/clerk')
  async clerkWebhook(@Body() body: any) {
    const event = body?.type;
    if (!event) return { received: true };

    if (event === 'user.created' || event === 'user.updated') {
      const clerkUser = body.data;
      await this.accountsService.upsertUserFromClerk(clerkUser.id, {
        email: clerkUser.email_addresses?.[0]?.email_address ?? '',
        name: [clerkUser.first_name, clerkUser.last_name].filter(Boolean).join(' ') || clerkUser.email_addresses?.[0]?.email_address,
        avatarUrl: clerkUser.image_url,
      });
    }

    return { received: true };
  }

  // Autenticar — recebe token Clerk, retorna dados do usuário + accountId
  @Get('me')
  async getMe(@Headers('authorization') auth: string) {
    if (!auth?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token não fornecido');
    }

    const token = auth.replace('Bearer ', '');
    const session = await this.clerkService.verifyToken(token);

    if (!session) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    const clerkUserId = session.publicMetadata?.userId
      ?? (session as any).session?.userId
      ?? (session as any).userId;

    if (!clerkUserId) {
      throw new UnauthorizedException('Não foi possível identificar o usuário');
    }

    const user = await this.accountsService.getUserByClerkId(clerkUserId);

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado no sistema');
    }

    return {
      userId: user.id,
      accountId: user.accountId,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }
}