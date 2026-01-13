import { NestFactory } from '@nestjs/core';
import { VersioningType, ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters';
import { LoggingInterceptor } from './common/interceptors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Use Winston logger
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // Enable CORS with proper configuration
  const allowedOrigins = configService.get<string[]>(
    'app.cors.allowedOrigins',
  ) ?? ['http://localhost:3000'];
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: configService.get<string>('app.apiVersion') ?? '1',
  });

  // Global prefix for all routes
  const apiPrefix = configService.get<string>('app.apiPrefix') ?? 'api';
  app.setGlobalPrefix(apiPrefix);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Swagger documentation (only in development)
  const nodeEnv = configService.get<string>('app.nodeEnv') ?? 'development';
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('SMTI ERP API')
      .setDescription(
        'Commission Management System API - Manages hotel commission agreements and calculates commissions for completed bookings.',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Health', 'API health check endpoints')
      .addTag('Hotels', 'Hotel management endpoints')
      .addTag('Commission Agreements', 'Commission agreement management')
      .addTag('Bookings', 'Booking management endpoints')
      .addTag('Commissions', 'Commission calculation and reporting')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    logger.log('Swagger documentation available at /docs');
  }

  const port = configService.get<number>('app.port') ?? 3000;
  const apiVersion = configService.get<string>('app.apiVersion') ?? '1';

  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`API prefix: /${apiPrefix}/v${apiVersion}`);
}

bootstrap();
