import { Body, Controller, Post } from '@nestjs/common';
import { IsEmail, IsString, MinLength } from 'class-validator';

class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

@Controller('auth')
export class AuthController {
  @Post('login')
  login(@Body() body: LoginDto) {
    return {
      message: 'Auth placeholder. Provider integration pending.',
      userHint: body.email,
    };
  }

  @Post('logout')
  logout() {
    return {
      message: 'Logout placeholder.',
    };
  }
}
