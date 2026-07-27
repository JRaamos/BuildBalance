import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../common/current-user.decorator';
import { Public } from '../common/public.decorator';
import { AuthUser } from '../common/auth.types';
import { ChangePasswordDto, LoginDto } from './auth.dto';
import { AuthService } from './auth.service';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.service.login(dto);
  }

  @ApiBearerAuth()
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return user;
  }

  @ApiBearerAuth()
  @Post('change-password')
  changePassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
    return this.service.changePassword(user.id, dto);
  }
}
