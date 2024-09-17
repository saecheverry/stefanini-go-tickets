import { PartialType } from '@nestjs/mapped-types';
import { Device } from './create-device.dto';

export class UpdateDeviceDto extends PartialType(Device) {}
