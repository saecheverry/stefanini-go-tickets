import { Exclude } from "class-transformer";
import { IsNotEmpty, IsString } from "class-validator";

export class Comment {
    @IsString()
    @IsNotEmpty()
    historyId: string;

    @IsString()
    @IsNotEmpty()
    ticketId: string;
  
    @IsString()
    @IsNotEmpty()
    employeeId: string;

    @IsString()
    @IsNotEmpty()
    statusId: string;
  
    @IsString()
    @IsNotEmpty()
    comment: string;

    @Exclude()
    _id: string;
}
