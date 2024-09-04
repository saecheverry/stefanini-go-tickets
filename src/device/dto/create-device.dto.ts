import { Exclude } from "class-transformer"
import { IsNotEmpty, IsOptional, IsString } from "class-validator"

export class Device {
    @IsString()
    @IsNotEmpty()
    evidenceId: string

    @IsString()
    @IsNotEmpty()
    type: string

    @IsString()
    @IsNotEmpty()
    brand: string

    @IsString()
    @IsNotEmpty()
    serial: string

    @IsString()
    @IsNotEmpty()
    ip: string

    @IsString()
    @IsNotEmpty()
    state: string 

    @IsString()
    @IsOptional()
    description: string

    @Exclude()
    _id: string;
}
