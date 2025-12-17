import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class GuestCleanupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(GuestCleanupService.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  private readonly retentionMs = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly intervalMs = 6 * 60 * 60 * 1000; // 6 hours

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) { }

  onModuleInit() {
    void this.runOnce();
    this.timer = setInterval(() => void this.runOnce(), this.intervalMs);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async runOnce() {
    if (this.running) {
      return;
    }
    this.running = true;

    try {
      const cutoff = new Date(Date.now() - this.retentionMs);
      const expiredGuests = await this.prisma.user.findMany({
        where: {
          isGuest: true,
          lastActiveAt: { lt: cutoff },
        },
        select: { id: true },
      });

      if (expiredGuests.length === 0) {
        return;
      }

      this.logger.warn(
        `Cleaning up ${expiredGuests.length} expired guest account(s) (lastActiveAt < ${cutoff.toISOString()})`,
      );

      for (const guest of expiredGuests) {
        try {
          await this.usersService.deleteAccount(guest.id);
        } catch (error) {
          this.logger.error(`Failed to delete guest user ${guest.id}`, error as any);
        }
      }
    } catch (error) {
      this.logger.error('Guest cleanup job failed', error as any);
    } finally {
      this.running = false;
    }
  }
}

