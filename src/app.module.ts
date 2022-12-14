import { Module, ValidationPipe } from '@nestjs/common';
import { APP_PIPE, APP_FILTER } from '@nestjs/core';
import { CqrsModule } from '@nestjs/cqrs';

import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './providers/database/database.module';
import { CacheModule } from './providers/cache/cache.module';
import { AwsModule } from './providers/aws/aws.module';
import { GcpModule } from './providers/gcp/gcp.module';
import { EmailModule } from './providers/email/email.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { VideoTreeModule } from './modules/video-tree/video-tree.module';
import { CategoryModule } from './modules/category/category.module';
import { ChannelModule } from './modules/channel/channel.module';
import { HistoryModule } from './modules/history/history.module';
import { BounceModule } from './modules/bounce/bounce.module';
import { UploadModule } from './modules/upload/upload.module';
import { PaymentModule } from './modules/payment/payment.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

const GlobalValidationPipe = {
  provide: APP_PIPE,
  useValue: new ValidationPipe({ transform: true, whitelist: true }),
};

const GlobalHttpExceptionFilter = {
  provide: APP_FILTER,
  useClass: HttpExceptionFilter,
};

@Module({
  imports: [
    CqrsModule,
    ConfigModule,
    DatabaseModule,
    CacheModule,
    AwsModule,
    GcpModule,
    EmailModule,
    AuthModule,
    UserModule,
    VideoTreeModule,
    CategoryModule,
    ChannelModule,
    HistoryModule,
    BounceModule,
    PaymentModule,
    UploadModule,
  ],
  providers: [GlobalValidationPipe, GlobalHttpExceptionFilter],
})
export class AppModule {}
