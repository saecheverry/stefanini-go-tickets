import { IsString, IsNotEmpty, IsArray, IsOptional, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

enum Role {
  COMMERCE = 'COMMERCE',
  SUPERVISOR = 'SUPERVISOR',
}

class Approval {
  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;

  @IsString()
  @IsNotEmpty()
  signature: string;
}

export class Evidence {
  @IsString()
  @IsNotEmpty()
  historyId: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @IsNotEmpty()
  problem: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional() 
  pictures: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Approval)
  @IsOptional() 
  approvals: Approval[];
}
