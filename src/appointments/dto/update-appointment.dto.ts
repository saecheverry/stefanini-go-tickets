import { PartialType } from '@nestjs/mapped-types';
import { Appointment } from './create-appointment.dto';

export class UpdateAppointmentDto extends PartialType(Appointment) {}
