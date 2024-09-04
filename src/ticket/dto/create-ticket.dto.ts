import { Exclude, Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsNotEmpty,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';

class CoordinatorOrTechnical {
    @IsString()
    @IsNotEmpty()
    id: string;

    @IsBoolean()
    @IsNotEmpty()
    enabled: boolean;
}


export class Ticket {
    @IsString()
    @IsNotEmpty()
    ticket_number: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsString()
    @IsNotEmpty()
    plannedDate: string;

    @IsString()
    @IsOptional()
    sla: string;

    @IsNotEmpty()
    attentionType: string;

    @IsString()
    @IsNotEmpty()
    category: string;

    @IsString()
    @IsNotEmpty()
    subcategory: string;

    @IsString()
    @IsNotEmpty()
    priority: string;

    @IsString()
    @IsNotEmpty()
    commerceId: string;

    @IsString()
    @IsNotEmpty()
    branchId: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    contactsId: string[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CoordinatorOrTechnical)
    @IsNotEmpty()
    coordinators: CoordinatorOrTechnical[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CoordinatorOrTechnical)
    @IsOptional()
    technicals: CoordinatorOrTechnical[];

    @Exclude()
    _id: string;

}
