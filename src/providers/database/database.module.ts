import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { typeOrmAsyncConfig } from 'src/database/config/database.config';

@Module({
  imports: [TypeOrmModule.forRootAsync(typeOrmAsyncConfig)],
})
export class DatabaseModule extends TypeOrmModule {
  constructor() {
    super();
  }
}