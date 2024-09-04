import { PartialType } from '@nestjs/mapped-types';
import { StatesHistory } from './create-states-history.dto';

export class UpdateStatesHistoryDto extends PartialType(StatesHistory) {}
