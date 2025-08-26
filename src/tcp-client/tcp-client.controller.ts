import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TcpClientService } from './tcp-client.service';

@Controller('tcp-client')
export class TcpClientController {
  constructor(private readonly tcpClientService: TcpClientService) {}

  // @Post()
  // create(@Body() createTcpClientDto: CreateTcpClientDto) {
  //   return this.tcpClientService.create(createTcpClientDto);
  // }

  // @Get()
  // findAll() {
  //   return this.tcpClientService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.tcpClientService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateTcpClientDto: UpdateTcpClientDto) {
  //   return this.tcpClientService.update(+id, updateTcpClientDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.tcpClientService.remove(+id);
  // }
}
