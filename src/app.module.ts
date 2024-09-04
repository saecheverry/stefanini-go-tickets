import { Module } from '@nestjs/common';
import { TicketModule } from './ticket/ticket.module';
import { EvidenceModule } from './evidence/evidence.module';
import { CommentModule } from './comment/comment.module';
import { StatesHistoryModule } from './states_history/states_history.module';
import { DeviceModule } from './device/device.module';
import { ConfigModule } from '@nestjs/config';
import configuration from './configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '.env',
    }),
    TicketModule, 
    DeviceModule, 
    StatesHistoryModule, 
    CommentModule, 
    EvidenceModule
  ],
  providers: [],
})
export class AppModule {}
