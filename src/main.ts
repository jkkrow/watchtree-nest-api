import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { mw } from 'request-ip';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';
import { ConfigService } from './config/services/config.service';

export async function bootstrap(server = true) {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);
  const port = config.get('PORT') || 5000;
  const origin = config.get('CLIENT_URL');
  const appName = config.get('APPLICATION_NAME');

  const documentOptions = new DocumentBuilder()
    .setTitle(`${appName} API`)
    .setDescription(`A REST API for ${appName}`)
    .addBearerAuth()
    .addBasicAuth()
    .addApiKey()
    .addCookieAuth()
    .build();

  const document = SwaggerModule.createDocument(app, documentOptions);

  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      defaultModelsExpandDepth: false,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      persistAuthorization: true,
    },
  });

  app.enableCors({ origin, credentials: true });
  app.use(cookieParser());
  app.use(helmet());
  app.use(mw({ attributeName: 'ip' }));

  if (server) {
    await app.listen(port);

    if (process.env.NODE_ENV === 'development') {
      const { updateDevelopmentWebhooks } = await import('./devtools');
      await updateDevelopmentWebhooks();
    }
  }

  return app;
}

bootstrap();
