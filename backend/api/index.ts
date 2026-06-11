import express from 'express';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';

import { AppModule } from '../src/app.module';

const server = express();

server.use('/payments/webhook', express.raw({ type: '*/*' }));

export const bootstrap = async () => {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        'http://localhost:3000',
        'http://localhost:3001',
        'https://codeefather.netlify.app',
        'https://the-code-father-iota.vercel.app',
        'https://thecodefather.vercel.app',
      ].filter(Boolean) as string[];
      if (
        !origin ||
        allowedOrigins.indexOf(origin) !== -1 ||
        allowedOrigins.some(o => origin && origin.startsWith(o))
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.init();
  return server;
};

let cachedHandler: any;
let bootstrapError: any;

export default async (req: any, res: any) => {
  if (!cachedHandler && !bootstrapError) {
    try {
      cachedHandler = await bootstrap();
    } catch (err) {
      bootstrapError = err;
      console.error('Serverless bootstrap failed:', err);
    }
  }

  if (bootstrapError) {
    res.status(500).json({
      error: 'FUNCTION_BOOTSTRAP_FAILED',
      message: bootstrapError?.message || 'Server startup failed',
    });
    return;
  }

  return cachedHandler(req, res);
};
