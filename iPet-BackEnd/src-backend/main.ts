import { ValidationPipe } from '@nestjs/common';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
import compression from 'compression';
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { SystemHealthService } from './system-health/system-health.service';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';

function runPrismaSync() {
  if (process.env.SKIP_PRISMA_SYNC === 'true') {
    console.log('ℹ️  Prisma sync skipped (SKIP_PRISMA_SYNC=true)');
    return;
  }

  const rootDir = path.resolve(__dirname, '..');
  const scriptPath = path.join(rootDir, 'scripts', 'prisma-sync.js');
  if (!existsSync(scriptPath)) {
    console.warn(`⚠️  Prisma sync script not found at ${scriptPath}`);
    return;
  }

  try {
    execSync(`node ${scriptPath}`, { cwd: rootDir, stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Prisma sync failed, aborting startup.', error);
    process.exit(1);
  }
}

async function bootstrap() {
  runPrismaSync();
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const bodyLimit = configService.get<string>('bodyLimit', '20mb');
  const port = configService.get<number>('port', 3000);
  const corsConfig = configService.get<{
    origins: string[];
    allowedHeaders: string[];
    methods: string[];
    exposedHeaders: string[];
    credentials: boolean;
    optionsSuccessStatus: number;
    preflightContinue: boolean;
  }>('cors');
  const corsOptions: CorsOptions = {
    origin: corsConfig?.origins,
    credentials: corsConfig?.credentials,
    allowedHeaders: corsConfig?.allowedHeaders,
    methods: corsConfig?.methods,
    exposedHeaders: corsConfig?.exposedHeaders,
    optionsSuccessStatus: corsConfig?.optionsSuccessStatus,
    preflightContinue: corsConfig?.preflightContinue,
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
