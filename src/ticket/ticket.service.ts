import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Ticket } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { DatabaseService, QueryParams } from 'stefaninigo';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TicketService {
  private collectionName: string = 'tickets';
  constructor(
    @Inject('mongodb') private readonly databaseService: DatabaseService,
  ) { }

  async create(tickets: Ticket | Ticket[]) {
    const createdAt = new Date().toISOString();
    if (Array.isArray(tickets)) {
      const ticketWithIds = tickets.map((ticket) => ({
        id: uuidv4().toString(),
        ...ticket,
        createdAt
      }))
      await this.databaseService.create(ticketWithIds, this.collectionName);
      return ticketWithIds.map((ticket) => ticket.id);
    } else {
      const id = uuidv4().toString()
      await this.databaseService.create({
        id,
        ...tickets,
        createdAt
      }, this.collectionName)
      return [id]
    }
  }

  async get(id: string) {
    const ticket = await this.databaseService.get(id, this.collectionName);
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    return ticket;
  }

  async delete(id: string) {
    const ticket = await this.databaseService.get(id, this.collectionName);
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    await this.databaseService.delete(id, this.collectionName);

    return 'Ticket deleted successfully';
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

  async update(id: string, ticket: UpdateTicketDto) {
    const updatedAt = new Date().toISOString();
    ticket["updatedAt"] = updatedAt;
    return (
      (await this.databaseService.update(id, ticket, this.collectionName)) && 'Update successful'
    );
  }
}
