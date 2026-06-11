import * as bcrypt from 'bcrypt';

import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

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

    const usernameExists = await this.usersService.findOneByUsername(
      dto.username,
    );
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
    const user =
      (await this.usersService.findOneByUsername(username)) ||
      (await this.usersService.findOneByEmail(username));
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

  async googleLogin(credential: string, role: string = 'STUDENT') {
    let googleEmail: string;
    let googleName: string;
    let googleAvatar: string;
    let googleSub: string;

    const isMockCredential = credential.startsWith('mock_google_');

    if (isMockCredential) {
      // Developer simulation mode — parse mock_google_<email> token
      const mockEmail = credential.replace('mock_google_', '');
      if (!mockEmail || !mockEmail.includes('@')) {
        throw new UnauthorizedException(
          'Invalid mock Google credential format',
        );
      }
      googleEmail = mockEmail;
      googleName = mockEmail.split('@')[0].replace(/[._]/g, ' ');
      googleAvatar = `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(googleName)}`;
      googleSub = `mock_sub_${mockEmail}`;
    } else {
      // Production: verify token against Google's tokeninfo endpoint
      const googleClientId = this.config.get<string>('GOOGLE_CLIENT_ID');
      try {
        const response = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`,
        );
        if (!response.ok) {
          throw new UnauthorizedException('Google token verification failed');
        }
        const payload = await response.json();

        // Validate audience if client ID is configured
        if (googleClientId && payload.aud !== googleClientId) {
          throw new UnauthorizedException('Google token audience mismatch');
        }

        if (!payload.email_verified || payload.email_verified === 'false') {
          throw new UnauthorizedException('Google email not verified');
        }

        googleEmail = payload.email;
        googleName = payload.name || payload.email.split('@')[0];
        googleAvatar = payload.picture || '';
        googleSub = payload.sub;
      } catch (err: any) {
        if (err instanceof UnauthorizedException) throw err;
        throw new UnauthorizedException('Failed to verify Google credentials');
      }
    }

    // Find existing user by email
    const user = await this.usersService.findOneByEmail(googleEmail);

    if (user) {
      // Update avatar if user doesn't have one
      if (!user.avatar && googleAvatar) {
        await this.usersService.updateProfile(user._id.toString(), {
          avatar: googleAvatar,
          fullName: (user as any).fullName || googleName,
        });
      }
      return this.generateTokens(user._id.toString(), user.username, user.role);
    }

    // New user — register them automatically
    const baseUsername = googleEmail
      .split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .substring(0, 20);

    // Ensure unique username
    let username = baseUsername;
    let suffix = 0;
    while (await this.usersService.findOneByUsername(username)) {
      suffix++;
      username = `${baseUsername}_${suffix}`;
    }

    // Generate a random secure password hash (user won't log in via password)
    const randomPassword = `google_oauth_${googleSub}_${Date.now()}`;
    const passwordHash = await bcrypt.hash(randomPassword, 12);

    const newUser = await this.usersService.create(
      googleEmail,
      username,
      passwordHash,
      role,
    );

    // Set fullName and avatar from Google profile
    await this.usersService.updateProfile(newUser._id.toString(), {
      fullName: googleName,
      avatar: googleAvatar,
    });

    return this.generateTokens(
      newUser._id.toString(),
      newUser.username,
      newUser.role,
    );
  }

  private generateTokens(userId: string, username: string, role: string) {
    const payload = { sub: userId, username, role };
    return {
      access_token: this.jwt.sign(payload),
      refresh_token: this.jwt.sign(payload, {
        secret:
          this.config.get('JWT_REFRESH_SECRET') || 'default-refresh-secret',
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN') || '7d',
      }),
    };
  }
}
