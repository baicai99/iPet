import { Body, Controller, Post, Req, HttpCode, UnauthorizedException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Throttle({ default: { limit: 3, ttl: 60 } })
  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: any) {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    return this.authService.login(dto, ip);
  }

  @Post('logout')
  @HttpCode(200)
  async logout() {
    return { message: 'Logged out successfully' };
  }

  // 修改重点：去掉了 @UseGuards(JwtAuthGuard)，允许过期 Token 进入尝试刷新
  @Throttle({ default: { limit: 5, ttl: 60 } }) // Slightly more relaxed than login but still protected
  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body() body: { refreshToken: string }) {
    if (!body || !body.refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }
    return this.authService.refreshToken(body.refreshToken);
  }
}
