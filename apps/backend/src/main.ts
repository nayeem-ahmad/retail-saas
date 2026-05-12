import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.enableCors();

    const config = new DocumentBuilder()
        .setTitle('Retail SaaS API')
        .setDescription('REST API for the Retail SaaS multi-tenant platform')
        .setVersion('1.0')
        .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
        .addGlobalParameters({
            in: 'header',
            required: false,
            name: 'x-tenant-id',
            schema: { type: 'string', example: 'tenant-uuid' },
        })
        .addGlobalParameters({
            in: 'header',
            required: false,
            name: 'x-store-id',
            schema: { type: 'string', example: 'store-uuid' },
        })
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
