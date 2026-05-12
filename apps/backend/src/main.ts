import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { SanitizePipe } from './common/sanitize.pipe';
import { REQUEST_ID_HEADER } from './common/request-id.middleware';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, { bufferLogs: true });
    app.useLogger(app.get(Logger));
    app.use(helmet());
    app.enableCors({ exposedHeaders: [REQUEST_ID_HEADER] });
    app.useGlobalPipes(
        new SanitizePipe(),
        new ValidationPipe({ transform: true, whitelist: true }),
    );
    app.enableShutdownHooks();

    const config = new DocumentBuilder()
        .setTitle('Retail SaaS API')
        .setDescription('REST API for the Retail SaaS platform — multi-tenant POS, inventory, billing, and accounting.')
        .setVersion('1.0')
        .addBearerAuth()
        .addApiKey({ type: 'apiKey', in: 'header', name: 'x-tenant-id' }, 'tenant-id')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: { persistAuthorization: true },
    });

    await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
