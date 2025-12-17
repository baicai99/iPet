import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { hash } from 'bcrypt';
import { normalizeEmail } from '../utils/sanitizers';
import { AccountInfo } from '@shared/types/user';

@Injectable()
export class UsersService {
  private readonly saltRounds = 12;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) { }

  async register(createUserDto: CreateUserDto) {
    const normalizedEmail = normalizeEmail(createUserDto.email);

    const passwordHash = await hash(createUserDto.password, this.saltRounds);
    try {
      const user = await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
        },
        select: {
          id: true,
          email: true,
          createdAt: true,
        },
      });
      return user;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Email is already registered');
      }
      throw error;
    }
  }

  async findById(id: string): Promise<AccountInfo | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        isGuest: true,
        createdAt: true,
        updatedAt: true,
        realName: true,
        displayName: true,
        avatar: true,
        membershipLevel: true,
        membershipExpireAt: true,
        points: true,
        isVerified: true,
        bio: true,
        mbti: true,
        tags: true,
      },
    });

    if (!user) {
      return null;
    }

    // Transform to match frontend AccountInfo type
    const fallbackName = user.email ? user.email.split('@')[0] : `游客${user.id.slice(0, 6)}`;
    return {
      id: user.id,
      uid: user.id,
      displayName: user.realName || user.displayName || fallbackName,
      avatar: user.avatar || '',
      updatedAt: user.updatedAt.getTime(),
      bio: user.bio || '',
      mbti: user.mbti || '',
      tags: user.tags ? (typeof user.tags === 'string' ? JSON.parse(user.tags) : user.tags) : [],
      email: user.email || '',
      isGuest: user.isGuest,
      membership: {
        level: user.membershipLevel || '普通会员',
        expireAt: user.membershipExpireAt ? user.membershipExpireAt.toISOString().split('T')[0] : '2099-12-31',
      },
      points: user.points,
      isVerified: user.isVerified,
    };
  }

  async verifyIdentity(userId: string, realName: string, idCard: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        realName,
        idCard,
        isVerified: true,
      },
    });
  }



  async updateSettings(userId: string, settings: any) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        settings: JSON.stringify(settings),
      },
    });
  }


  async updateProfile(userId: string, dto: UpdateUserProfileDto) {
    // Check if avatar is being updated and delete old one if necessary
    if (dto.avatar) {
      const currentUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { avatar: true },
      });

      if (currentUser?.avatar && currentUser.avatar !== dto.avatar) {
        await this.storageService.deleteFile(currentUser.avatar);
      }
    }

    const data: Prisma.UserUpdateInput = {
      ...(dto.displayName && { displayName: dto.displayName }),
      ...(dto.avatar && { avatar: dto.avatar }),
      ...(dto.bio && { bio: dto.bio }),
      ...(dto.mbti && { mbti: dto.mbti }),
    };

    if (dto.tags) {
      data.tags = JSON.stringify(dto.tags);
    }

    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data,
        select: {
          id: true,
          displayName: true,
          avatar: true,
          bio: true,
          mbti: true,
          tags: true,
          updatedAt: true,
        }
      });

      return {
        ...updatedUser,
        id: updatedUser.id,
        tags: typeof updatedUser.tags === 'string' ? JSON.parse(updatedUser.tags) : updatedUser.tags,
        updatedAt: updatedUser.updatedAt.getTime()
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }

  async deleteAccount(userId: string) {
    try {
      // 0. Fetch user and pets to get file paths
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { pets: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Delete User Avatar
      if (user.avatar) {
        await this.storageService.deleteFile(user.avatar);
      }

      // Delete Pet Avatars
      for (const pet of user.pets) {
        if (pet.avatar) {
          await this.storageService.deleteFile(pet.avatar);
        }
      }

      return await this.prisma.$transaction(async (tx) => {
        // 1. Delete associated Pets (this will cascade to HealthRecord, CalendarEvent, PinnedMetric due to schema)
        await tx.pet.deleteMany({
          where: { userId },
        });

        // 4. Delete SyncState
        await tx.userSyncState.deleteMany({
          where: { userId },
        });

        // 5. Finally delete the User
        return await tx.user.delete({
          where: { id: userId },
        });
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }
}
