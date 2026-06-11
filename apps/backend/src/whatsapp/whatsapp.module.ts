import { Global, Module } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';

@Global()
@Module({
    providers: [WhatsAppService],
    exports: [WhatsAppService],
})
export class WhatsAppModule {}
