import compression from 'compression';
import helmet from 'helmet';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        'http://localhost:3000',
        'http://localhost:3001',
        'https://codeefather.netlify.app',
        'https://the-code-father-iota.vercel.app',
        'https://thecodefather.vercel.app',
        '',
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

  app.use(compression());
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.use((req, res, next) => {
    if (req.method === 'GET') {
      res.set('Cache-Control', 'public, max-age=300, s-maxage=3600');
    }
    next();
  });

  const config = new DocumentBuilder()
    .setTitle('LearnLocal API')
    .setDescription('Local Learning Platform Full Backend REST API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
}
bootstrap();
