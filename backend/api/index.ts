import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import express from 'express';

const server = express();

export const bootstrap = async () => {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        'http://localhost:3000',
        'http://localhost:3001',
        'https://codeefather.netlify.app'
      ].filter(Boolean) as string[];
      if (!origin || allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  await app.init();
  return server;
};

let cachedHandler: any;

export default async (req: any, res: any) => {
  if (!cachedHandler) {
    const app = await bootstrap();
    cachedHandler = app;
  }
  return cachedHandler(req, res);
};
