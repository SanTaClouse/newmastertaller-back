import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicTrackingController } from './public-tracking.controller';
import { WorkOrder } from '../work-orders/work-order.entity';
import { WorkOrderPhaseLog } from '../work-orders/work-order-phase-log.entity';
import { Vehicle } from '../vehicles/vehicle.entity';
import { Client } from '../clients/client.entity';
import { Tenant } from '../tenants/tenant.entity';
import { RepairPhase } from '../repair-phases/repair-phase.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WorkOrder, WorkOrderPhaseLog, Vehicle, Client, Tenant, RepairPhase])],
  controllers: [PublicTrackingController],
})
export class PublicTrackingModule {}
