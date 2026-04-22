import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkOrdersController } from './work-orders.controller';
import { WorkOrdersService } from './work-orders.service';
import { WorkOrder } from './work-order.entity';
import { WorkOrderPhaseLog } from './work-order-phase-log.entity';
import { Vehicle } from '../vehicles/vehicle.entity';
import { VehicleMileageLog } from '../vehicles/vehicle-mileage-log.entity';
import { Expense } from '../expenses/expense.entity';
import { RepairPhase } from '../repair-phases/repair-phase.entity';
import { Client } from '../clients/client.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WorkOrder, WorkOrderPhaseLog, Vehicle, VehicleMileageLog, Expense, RepairPhase, Client])],
  controllers: [WorkOrdersController],
  providers: [WorkOrdersService],
  exports: [WorkOrdersService],
})
export class WorkOrdersModule {}
