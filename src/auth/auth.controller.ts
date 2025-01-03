import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from '../utils/decorators';
import { RefreshTokenDto } from './user/dto/refresh.token.dto';

@Controller('auth')
export class AuthController {

  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('/login')
  signIn(@Body() signInDto: Record<string, any>) {
    return this.authService.signIn(signInDto.username, signInDto.password);
  }

  @Post('/refresh')
  @Public()
  refresh(@Body() refreshDto: RefreshTokenDto) {
    return this.authService.refresh(refreshDto);
  }

}
