import { Test, TestingModule } from '@nestjs/testing';
import { StatesHistoryService } from './states_history.service';

describe('StatesHistoryService', () => {
  let service: StatesHistoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StatesHistoryService],
    }).compile();

    service = module.get<StatesHistoryService>(StatesHistoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
