import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './common/api-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const allowedOrigins = config
    .get<string>('CORS_ORIGIN', 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);
  const allowVercelPreviews = config.get('ALLOW_VERCEL_PREVIEWS', 'true') === 'true';

  app.use(helmet());
  app.enableCors({
    origin(
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void
    ) {
      const normalizedOrigin = origin?.replace(/\/$/, '');
      const isAllowed =
        !normalizedOrigin ||
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(normalizedOrigin) ||
        (allowVercelPreviews && /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(normalizedOrigin));

      callback(isAllowed ? null : new Error('Origin not allowed by CORS'), isAllowed);
    },
    credentials: true
  });
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true
  }));
  app.useGlobalFilters(new ApiExceptionFilter());

  if (config.get('SWAGGER_ENABLED', 'true') === 'true') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('BuildBalance API')
      .setDescription('Gestão financeira de reformas, escopos, gastos e acessos.')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swaggerConfig));
  }

  await app.listen(Number(config.get('PORT', config.get('API_PORT', 3000))));
}

void bootstrap();
