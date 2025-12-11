import { Body, Controller, Delete, Get, Post, Put, Req, UseGuards, NotFoundException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { UsersService } from './users.service';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService
  ) { }

  @Throttle({ default: { limit: 3, ttl: 60 } })
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.register(createUserDto);
    const tokenResult = this.authService.generateToken(user);
    return {
      ...tokenResult,
      // Ensure user structure matches what frontend expects if needed, although tokenResult.user should suffice
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@Req() req: AuthenticatedRequest) {
    const uid = req.user?.uid;
    if (!uid) {
      throw new NotFoundException('User ID not found in token');
    }

    const userId = uid;

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
  @Post('verify')
  @UseGuards(JwtAuthGuard)
  async verifyIdentity(@Req() req: AuthenticatedRequest, @Body() body: { realName: string; idCard: string }) {
    const userId = req.user?.uid;
    if (!userId) throw new NotFoundException('User ID not found');
    return this.usersService.verifyIdentity(userId, body.realName, body.idCard);
  }



  @Post('settings')
  @UseGuards(JwtAuthGuard)
  async updateSettings(@Req() req: AuthenticatedRequest, @Body() body: { settings: any }) {
    const userId = req.user?.uid;
    if (!userId) throw new NotFoundException('User ID not found');
    return this.usersService.updateSettings(userId, body.settings);
  }
  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Req() req: AuthenticatedRequest, @Body() dto: UpdateUserProfileDto) {
    const userId = req.user?.uid;
    if (!userId) {
      throw new NotFoundException('Invalid user ID');
    }
    return this.usersService.updateProfile(userId, dto);
  }

  @Delete('account')
  @UseGuards(JwtAuthGuard)
  async deleteAccount(@Req() req: AuthenticatedRequest) {
    const userId = req.user?.uid;
    if (!userId) throw new NotFoundException('User ID not found');
    return this.usersService.deleteAccount(userId);
  }
}
