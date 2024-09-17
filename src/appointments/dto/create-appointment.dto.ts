import { Exclude } from "class-transformer";
import { IsNotEmpty, IsString } from "class-validator";

class Contact {
    @IsString()
    @IsNotEmpty()
    id: string;

    @IsString()
    @IsNotEmpty()
    names: string;

    @IsString()
    @IsNotEmpty()
    phone: string;

    @IsString()
    @IsNotEmpty()
    email: string;
}

export class Appointment {
    @IsString()
    id: string;

    @IsString()
    @IsNotEmpty()
    ticketId: string;
  
    @IsString()
    @IsNotEmpty()
    startDate: string;

    @IsString()
    @IsNotEmpty()
    endDate: string;
  
    @IsString()
    @IsNotEmpty()
    contact: Contact;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsString()
    @IsNotEmpty()
    comment: string;

    @Exclude()
    _id: string;
}

