import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { StatesHistory } from './dto/create-states-history.dto';
import { UpdateStatesHistoryDto } from './dto/update-states-history.dto';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService, QueryParams } from 'stefaninigo';

@Injectable()
export class StatesHistoryService {
  private collectionName: string = 'states_history';
  constructor(
    @Inject('mongodb') private readonly databaseService: DatabaseService,
  ) {}

  async create(states: StatesHistory | StatesHistory[]) {
    const createdAt = new Date().toISOString();
    const statesData = await this.databaseService.get("states", "datas");
    const mapState = (stateId: string) => {
      const foundState = statesData.values.find((state: { name: string, value: string }) => state.value === stateId);
      return foundState 
        ? { name: foundState.name, value: foundState.value.replace(/\s+/g, '') } 
        : { name: stateId, value: stateId.replace(/\s+/g, '') };
    };

    if (Array.isArray(states)) {
      const statesWithIds = states.map((stateHistory) => {
        const mappedState = mapState(stateHistory.stateId);
        return {
          id: uuidv4().toString(),
          ...stateHistory,
          state: mappedState,
          createdAt
        };
      });
      await this.databaseService.create(statesWithIds, this.collectionName);
      return statesWithIds.map((stateHistory) => stateHistory.id);
    } else {
      const id = uuidv4().toString();
      const mappedState = mapState(states.stateId);
      await this.databaseService.create({
        id,
        ...states,
        state: mappedState,
        createdAt
      }, this.collectionName);
      await this.databaseService.update(states.ticketId, {currentState: states.stateId }, "tickets");
      return [id];
    }
  }

  async get(id: string) {
    const stateHistory = await this.databaseService.get(id, this.collectionName);
    if (!stateHistory) {
      throw new NotFoundException('States not found');
    }
    return stateHistory;
  }

  async delete(id: string) {
    const stateHistory = await this.databaseService.get(id, this.collectionName);
    if (!stateHistory) {
      throw new NotFoundException('State not found');
    }
    await this.databaseService.delete(id, this.collectionName);

    return 'State deleted successfully';
  }

  async list(page: number, limit: number, queryParams: QueryParams) {
    page = page <= 0 ? 1 : page;
    const start = (page - 1) * limit;
    const total = await this.databaseService.count(queryParams, this.collectionName);
    const records = await this.databaseService.list(start, limit, queryParams, this.collectionName);

    return {
      total,
      page,
      limit,
      records,
    };
  }

  async update(id: string, states: UpdateStatesHistoryDto) {
    const updatedAt = new Date().toISOString();
    states["updatedAt"] = updatedAt;
    return (
      (await this.databaseService.update(id, states, this.collectionName)) && 'Update successful'
    );
  }
}
