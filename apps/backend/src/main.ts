import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Configure Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // 2. Configure CORS origins
  const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || '';
  const origins = allowedOriginsEnv
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
  
  if (!origins.includes('http://localhost:5173')) {
    origins.push('http://localhost:5173');
  }

  app.enableCors({
    origin: origins,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`CourseDev Hub Backend running on: http://localhost:${port}`);
}
bootstrap();
