import { Module } from '@nestjs/common';
import { StatesHistoryService } from './states_history.service';
import { StatesHistoryController } from './states_history.controller';
import { DatabaseModule } from 'stefaninigo';


@Module({
  imports:[
    DatabaseModule.forRootAsync([
        { name: 'mongodb', provider: DatabaseModule.PROVIDERS.MONGODB },
    ]),
  ],
  controllers: [StatesHistoryController],
  providers: [StatesHistoryService],
})
export class StatesHistoryModule {}
