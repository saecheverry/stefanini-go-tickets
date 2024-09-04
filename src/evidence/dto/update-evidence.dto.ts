import { PartialType } from '@nestjs/mapped-types';
import { Evidence } from './create-evidence.dto';

export class UpdateEvidenceDto extends PartialType(Evidence) {}
