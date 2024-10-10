import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  Put,
  Search,
} from '@nestjs/common';
import { TicketService } from './ticket.service';
import { Ticket } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { plainToClass } from 'class-transformer';
import {
  QueryExclude,
  QueryFilters,
  QueryParams,
  QuerySort,
} from 'stefaninigo';
import { ParseJsonPipe } from 'src/pipes/json.pipe';
import { Utils } from 'src/utils/utils';

@Controller('tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Post()
  async create(@Body() tickets: Ticket) {
    try {
      return this.ticketService.create(tickets);
    } catch (error) {
      return error.message;
    }
  }

  @Get('/summaries')
  async summaries(
    @Query('commercesId', new ParseJsonPipe<string[]>(Array))
    commercesId: string[],
    @Query('technicalsId', new ParseJsonPipe<string[]>(Array))
    technicalsId: string[],
    @Query('regions', new ParseJsonPipe<string[]>(Array))
    regions: string[],
    @Query('startDate')
    startDate: Date,
    @Query('endDate')
    endDate: Date,
    @Query('search', new ParseJsonPipe<QueryFilters>(QueryFilters))
    Search: QueryFilters,
  ) {
    return await this.ticketService.getSummary(
      commercesId,
      regions,
      technicalsId,
      startDate,
      endDate,
    );
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    try {
      const result = this.ticketService.get(id);
      return plainToClass(Ticket, result);
    } catch (error) {}
  }

  @Get()
  async list(
    @Query('page', ParseIntPipe) start: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('filters', new ParseJsonPipe<QueryFilters>(QueryFilters))
    filters: QueryFilters,
    @Query('exclude', new ParseJsonPipe<QueryExclude>(QueryExclude))
    exclude: QueryExclude,
    @Query('fields', new ParseJsonPipe<string[]>(Array)) fields: string[],
    @Query('sort', new ParseJsonPipe<QuerySort>(QuerySort)) sort: QuerySort,
  ) {
    try {
      const queryParams: QueryParams = {
        filters,
        exclude,
        fields,
        sort,
      };
      const response = await this.ticketService.list(start, limit, queryParams);
      response.records = Utils.mapRecord(Ticket, response.records);
      return response;
    } catch (error) {
      return error.message;
    }
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateTicketDto: UpdateTicketDto) {
    try {
      return this.ticketService.update(id, updateTicketDto);
    } catch (error) {
      return error.message;
    }
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    try {
      return await this.ticketService.delete(id);
    } catch (error) {
      return error.message;
    }
  }

  @Get(':id/flows')
  async flows(@Param('id') id: string) {
    try {
      return await this.ticketService.flows(id);
    } catch (error) {
      console.error(error);
      return error.message;
    }
  }

  @Get('/flows/all')
  async listFlows(
    @Query('page', ParseIntPipe) start: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('filters', new ParseJsonPipe<QueryFilters>(QueryFilters))
    filters: QueryFilters,
    @Query('exclude', new ParseJsonPipe<QueryExclude>(QueryExclude))
    exclude: QueryExclude,
    @Query('fields', new ParseJsonPipe<string[]>(Array)) fields: string[],
    @Query('sort', new ParseJsonPipe<QuerySort>(QuerySort)) sort: QuerySort,
  ) {
    try {
      const queryParams: QueryParams = {
        filters,
        exclude,
        fields,
        sort,
      };
      return await this.ticketService.listFlows(start, limit, queryParams);
    } catch (error) {
      return error.message;
    }
  }
}
