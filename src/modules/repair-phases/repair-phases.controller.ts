import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { RepairPhasesService } from './repair-phases.service';
import { CreateRepairPhaseDto, ReorderPhasesDto } from './dto/create-repair-phase.dto';

@Controller('repair-phases')
export class RepairPhasesController {
  constructor(private service: RepairPhasesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() dto: CreateRepairPhaseDto) {
    return this.service.create(dto);
  }

  @Patch('reorder')
  reorder(@Body() dto: ReorderPhasesDto) {
    return this.service.reorder(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateRepairPhaseDto>) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
