import { PartialType } from '@nestjs/mapped-types';
import { Ticket } from './create-ticket.dto';

export class UpdateTicketDto extends PartialType(Ticket) {}
