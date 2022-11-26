import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService as BaseJwtService } from '@nestjs/jwt';

import { CacheService } from 'src/cache/services/cache.service';
import {
  JWTPayload,
  JWTSignOptions,
  JWTVerifyOptions,
  JWTInvalidation,
} from '../interfaces/jwt.interface';

@Injectable()
export class JWTService {
  constructor(
    private readonly jwtService: BaseJwtService,
    private readonly cacheService: CacheService,
  ) {}

  sign(userId: string, options: JWTSignOptions) {
    return this.jwtService.sign(
      {
        userId,
      },
      {
        expiresIn: options.exp,
        subject: options.sub,
      },
    );
  }

  verify(token: string, options?: JWTVerifyOptions) {
    try {
      const result = this.jwtService.verify<JWTPayload>(token, {
        subject: options?.sub,
        ignoreExpiration: options?.ignoreExp,
      });

      return result;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  signAuthToken(userId: string) {
    const refreshToken = this.sign(userId, { sub: 'refresh', exp: '7d' });
    const accessToken = this.sign(userId, { sub: 'access', exp: '15m' });

    return { refreshToken, accessToken };
  }

  async invalidateRefreshToken(
    refreshToken: string,
    next: string | null,
    exp: number,
  ) {
    const ttl = exp - Math.round(new Date().getTime() / 1000);
    await this.cacheService.set<JWTInvalidation>(refreshToken, { next }, ttl);
  }

  async rotateRefreshToken(refreshToken: string) {
    // Verify refresh token
    const { userId, exp } = await this.verifyRefreshToken(refreshToken);

    // Sign new auth token
    const token = this.signAuthToken(userId);

    // Invalidate previous refresh token
    const next = token.refreshToken;
    await this.invalidateRefreshToken(refreshToken, next, exp);

    return token;
  }

  async verifyRefreshToken(refreshToken: string) {
    // Check if it's expired
    const result = this.verify(refreshToken, { sub: 'refresh' });

    // Check if it's invalidated
    const invalidatedToken = await this.cacheService.get<JWTInvalidation>(
      refreshToken,
    );

    // If not invalidated, return payload
    if (!invalidatedToken) {
      return result;
    }

    // If invalidated, also invalidate active token from this family
    let currentToken = invalidatedToken.next;

    while (currentToken) {
      const result = await this.cacheService.get<JWTInvalidation>(currentToken);

      if (!result) {
        const { exp } = this.verify(currentToken, { sub: 'refresh' });
        await this.invalidateRefreshToken(currentToken, null, exp);
        break;
      }

      currentToken = result.next;
    }

    throw new UnauthorizedException('Invalid or expired token');
  }
}