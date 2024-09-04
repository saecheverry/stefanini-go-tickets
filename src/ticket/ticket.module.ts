import { Module } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { TicketController } from './ticket.controller';
import { DatabaseModule } from 'stefaninigo';

@Module({
  imports:[
    DatabaseModule.forRootAsync([
        { name: 'mongodb', provider: DatabaseModule.PROVIDERS.MONGODB },
    ]),
  ],
  controllers: [TicketController],
  providers: [TicketService],
})
export class TicketModule {}
