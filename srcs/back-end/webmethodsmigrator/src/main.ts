import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurer les options CORS
  const corsOptions: CorsOptions = {
    origin: ['http://localhost:8080'], // Autoriser seulement ce domaine à accéder à l'API
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type,Authorization',
  };

  // Activer CORS avec les options configurées
  app.enableCors(corsOptions);

  // Servir les fichiers statiques depuis /uploads
  app.use('/uploads', express.static('/webmethodsmigrator/src/uploads'));

  await app.listen(4000);
}
bootstrap();
