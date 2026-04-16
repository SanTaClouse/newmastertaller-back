import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RepairPhasesController } from './repair-phases.controller';
import { RepairPhasesService } from './repair-phases.service';
import { RepairPhase } from './repair-phase.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RepairPhase])],
  controllers: [RepairPhasesController],
  providers: [RepairPhasesService],
  exports: [RepairPhasesService],
})
export class RepairPhasesModule {}
