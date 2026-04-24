import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query,
  ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { WorkOrdersService } from './work-orders.service';
import { CreateWorkOrderDto, SetPhaseDto, UpdateWorkOrderDto } from './dto/create-work-order.dto';

@Controller('work-orders')
export class WorkOrdersController {
  constructor(private service: WorkOrdersService) {}

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('includeFinancials') includeFinancials?: string,
    @Query('vehicleId') vehicleId?: string,
    @Query('isDelayed') isDelayed?: string,
  ) {
    return this.service.findAll(page, limit, status, search, from, to, includeFinancials === 'true', vehicleId, isDelayed === 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateWorkOrderDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWorkOrderDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Delete(':id/purge')
  purge(@Param('id') id: string) {
    return this.service.purge(id);
  }

  @Post(':id/complete')
  complete(@Param('id') id: string) {
    return this.service.complete(id);
  }

  @Post(':id/retire')
  retire(@Param('id') id: string) {
    return this.service.retire(id);
  }

  @Post(':id/advance-phase')
  advancePhase(@Param('id') id: string) {
    return this.service.advancePhase(id);
  }

  @Post(':id/set-phase')
  setPhase(@Param('id') id: string, @Body() dto: SetPhaseDto) {
    return this.service.setPhase(id, dto);
  }
}
