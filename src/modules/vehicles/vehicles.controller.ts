import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query,
  ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { CreateMileageLogDto } from './dto/create-mileage-log.dto';

@Controller('vehicles')
export class VehiclesController {
  constructor(private service: VehiclesService) {}

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    return this.service.findAll(page, limit, search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateVehicleDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVehicleDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  // ── Mileage logs ────────────────────────────────────────────────────────────

  @Get(':id/mileage')
  getMileageLogs(@Param('id') id: string) {
    return this.service.getMileageLogs(id);
  }

  @Post(':id/mileage')
  addMileageLog(@Param('id') id: string, @Body() dto: CreateMileageLogDto) {
    return this.service.addMileageLog(id, dto);
  }

  @Delete(':id/mileage/:logId')
  removeMileageLog(@Param('id') id: string, @Param('logId') logId: string) {
    return this.service.removeMileageLog(id, logId);
  }
}
