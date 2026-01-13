import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  apiPrefix: 'api',
  apiVersion: '1',
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRATION ?? '24h',
  },
  logging: {
    level: process.env.LOG_LEVEL ?? 'info',
  },
  cors: {
    // In production, replace with actual allowed origins
    allowedOrigins: process.env.CORS_ORIGINS?.split(',') ?? [
      'http://localhost:3000',
    ],
  },
}));
