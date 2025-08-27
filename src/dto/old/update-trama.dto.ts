import { PartialType } from '@nestjs/mapped-types';
import { CreateTramaDto } from './create-trama.dto';

export class UpdateTramaDto extends PartialType(CreateTramaDto) {}
