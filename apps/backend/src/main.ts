import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from "helmet";
import { AppModule } from './app.module';
import { SanitizePipe } from './common/sanitize.pipe';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.use(helmet());
import { Logger } from 'nestjs-pino';
    const app = await NestFactory.create(AppModule, { bufferLogs: true });
    app.useLogger(app.get(Logger));
    app.enableCors();
    app.useGlobalPipes(
        new SanitizePipe(),
        new ValidationPipe({ transform: true, whitelist: true }),
    );
    app.enableShutdownHooks();
    await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
