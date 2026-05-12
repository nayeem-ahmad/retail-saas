import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from "helmet";
import { AppModule } from './app.module';
import { SanitizePipe } from './common/sanitize.pipe';
import { REQUEST_ID_HEADER } from './common/request-id.middleware';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.use(helmet());
    app.enableCors();
    app.useGlobalPipes(
        new SanitizePipe(),
        new ValidationPipe({ transform: true, whitelist: true }),
    );
    app.enableCors({ exposedHeaders: [REQUEST_ID_HEADER] });
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    app.enableShutdownHooks();
    await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
