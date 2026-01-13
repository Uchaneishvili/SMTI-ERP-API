import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WinstonModule, utilities } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import * as Joi from 'joi';

import { appConfig } from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { HotelsModule } from './modules/hotels/hotels.module';
import { LoggerMiddleware } from './middleware/logger.middleware';
import { CommissionAgreementsModule } from './modules/commission-agreements/commission-agreements.module';
import { CommissionsModule } from './modules/commissions/commissions.module';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.ms(),
  utilities.format.nestLike('API', {
    colors: true,
    prettyPrint: true,
  }),
);

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRATION: Joi.string().default('24h'),
        LOG_LEVEL: Joi.string()
          .valid('error', 'warn', 'info', 'debug')
          .default('info'),
        CORS_ORIGINS: Joi.string().optional(),
      }),
    }),

    // Logging
    WinstonModule.forRoot({
      transports: [
        // Console transport
        new winston.transports.Console({
          format: logFormat,
        }),
        // Rotating file transport for errors
        new winston.transports.DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
        // Rotating file transport for all logs
        new winston.transports.DailyRotateFile({
          filename: 'logs/application-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      ],
    }),

    // Core modules
    PrismaModule,

    // Feature modules
    HealthModule,
    // Feature modules
    HealthModule,
    HotelsModule,
    CommissionAgreementsModule,
    CommissionsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
