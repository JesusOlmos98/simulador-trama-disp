import { PartialType } from '@nestjs/mapped-types';
import { CreateTcpClientDto } from './create-tcp-client.dto';

export class UpdateTcpClientDto extends PartialType(CreateTcpClientDto) {}
