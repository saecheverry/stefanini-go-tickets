import { Test, TestingModule } from '@nestjs/testing';
import { StatesHistoryController } from './states_history.controller';
import { StatesHistoryService } from './states_history.service';

describe('StatesHistoryController', () => {
  let controller: StatesHistoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StatesHistoryController],
      providers: [StatesHistoryService],
    }).compile();

    controller = module.get<StatesHistoryController>(StatesHistoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
