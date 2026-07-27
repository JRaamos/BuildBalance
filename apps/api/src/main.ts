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
  app.use(helmet());
  app.enableCors({
    origin: config.get('CORS_ORIGIN', 'http://localhost:5173'),
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

  await app.listen(Number(config.get('API_PORT', 3000)));
}

void bootstrap();
