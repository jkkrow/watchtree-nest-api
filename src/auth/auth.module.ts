import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { ConfigService } from 'src/config/services/config.service';
import { CacheModule } from 'src/cache/cache.module';
import { JWTService } from './services/jwt.service';
import { EncryptService } from './services/encrypt.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET_KEY'),
        signOptions: {
          issuer: config.get('DOMAIN_URL'),
        },
        verifyOptions: {
          issuer: config.get('DOMAIN_URL'),
        },
      }),
    }),
    CacheModule,
  ],
  providers: [JWTService, EncryptService],
  exports: [JWTService, EncryptService],
})
export class AuthModule {}
