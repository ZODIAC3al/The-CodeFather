import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const emailExists = await this.usersService.findOneByEmail(dto.email);
    if (emailExists) throw new ConflictException('Email already taken');

    const usernameExists = await this.usersService.findOneByUsername(dto.username);
    if (usernameExists) throw new ConflictException('Username already taken');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.usersService.create(
      dto.email,
      dto.username,
      passwordHash,
      dto.role || 'STUDENT',
    );
    return this.generateTokens(user.id, user.username, user.role);
  }

  async validateUser(username: string, password: string) {
    const user = await this.usersService.findOneByUsername(username) || 
                 await this.usersService.findOneByEmail(username);
    if (!user) return null;
    const valid = await bcrypt.compare(password, user.passwordHash);
    return valid ? user : null;
  }

  async login(user: any) {
    return this.generateTokens(user.id, user.username, user.role);
  }

  async refresh(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('Invalid user session');
    return this.generateTokens(user.id, user.username, user.role);
  }

  private generateTokens(userId: string, username: string, role: string) {
    const payload = { sub: userId, username, role };
    return {
      access_token: this.jwt.sign(payload),
      refresh_token: this.jwt.sign(payload, {
        secret: this.config.get('JWT_REFRESH_SECRET') || 'default-refresh-secret',
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN') || '7d',
      }),
    };
  }
}
