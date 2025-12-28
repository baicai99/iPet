import { ValidationPipe } from '@nestjs/common';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
import compression from 'compression';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { SystemHealthService } from './system-health/system-health.service';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const bodyLimit = configService.get<string>('bodyLimit', '20mb');
  const port = configService.get<number>('port', 3000);
  const clientOrigin = configService.get<string>('clientOrigin', 'http://localhost:5173');
  const origins = clientOrigin.split(',').map(origin => origin.trim());
  const corsOptions: CorsOptions = {
    origin: origins,
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'If-None-Match',
      'X-Request-Id',
      'Origin',
      'Accept',
      'X-Requested-With',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    exposedHeaders: ['ETag', 'X-Request-Id'],
    optionsSuccessStatus: 204,
    preflightContinue: false,
  };

  app.setGlobalPrefix('api');

  // Global pipes, interceptors, and filters
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  // Request ID middleware
  const requestIdMiddleware = new RequestIdMiddleware();
  app.use((req: any, res: any, next: any) => requestIdMiddleware.use(req, res, next));

  app.use(json({ limit: bodyLimit }));
  app.use(urlencoded({ extended: true, limit: bodyLimit }));
  app.use(compression());
  app.enableCors(corsOptions);

  // Log version fingerprint at startup
  const fingerprint = SystemHealthService.getVersionFingerprint();
  console.log('🚀 iPet Backend Starting');
  console.log(`   env: ${fingerprint.env}`);
  console.log(`   version: ${fingerprint.version}`);
  console.log(`   commit: ${fingerprint.commit}`);
  console.log(`   buildTime: ${fingerprint.buildTime}`);

  await app.listen(port);
  console.log(`✅ Server listening on port ${port}`);
}
bootstrap();

