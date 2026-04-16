import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkOrder } from '../work-orders/work-order.entity';
import { WorkOrderPhaseLog } from '../work-orders/work-order-phase-log.entity';
import { Vehicle } from '../vehicles/vehicle.entity';
import { Client } from '../clients/client.entity';
import { Tenant } from '../tenants/tenant.entity';
import { RepairPhase } from '../repair-phases/repair-phase.entity';
import { Public } from '../../common/decorators/public.decorator';

@Public()
@Controller('public/tracking')
export class PublicTrackingController {
  constructor(
    @InjectRepository(WorkOrder) private orderRepo: Repository<WorkOrder>,
    @InjectRepository(WorkOrderPhaseLog) private logRepo: Repository<WorkOrderPhaseLog>,
    @InjectRepository(Vehicle) private vehicleRepo: Repository<Vehicle>,
    @InjectRepository(Client) private clientRepo: Repository<Client>,
    @InjectRepository(Tenant) private tenantRepo: Repository<Tenant>,
    @InjectRepository(RepairPhase) private phaseRepo: Repository<RepairPhase>,
  ) {}

  @Get(':code')
  async getTracking(@Param('code') code: string) {
    const order = await this.orderRepo.findOne({ where: { trackingCode: code } });
    if (!order) throw new NotFoundException('Código de seguimiento no encontrado');

    const [vehicle, tenant, allPhases, phaseLogs] = await Promise.all([
      this.vehicleRepo.findOne({ where: { id: order.vehicleId } }),
      this.tenantRepo.findOne({ where: { id: order.tenantId } }),
      this.phaseRepo.find({ where: { tenantId: order.tenantId }, order: { orderIndex: 'ASC' } }),
      this.logRepo.find({ where: { workOrderId: order.id }, order: { enteredAt: 'ASC' } }),
    ]);

    let client: Client | null = null;
    if (order.clientId) {
      client = await this.clientRepo.findOne({ where: { id: order.clientId } });
    }

    const currentPhase = allPhases.find((p) => p.id === order.currentPhaseId);

    const phases = allPhases.map((phase) => {
      const log = phaseLogs.find((l) => l.phaseId === phase.id);
      if (!log) return { name: phase.name, orderIndex: phase.orderIndex, icon: phase.icon, status: 'pending' };
      if (log.completedAt) return { name: phase.name, orderIndex: phase.orderIndex, icon: phase.icon, status: 'completed', completedAt: log.completedAt };
      return { name: phase.name, orderIndex: phase.orderIndex, icon: phase.icon, status: 'current', enteredAt: log.enteredAt };
    });

    return {
      vehicle: {
        brand: vehicle?.brand,
        model: vehicle?.model,
        year: vehicle?.year,
        plate: vehicle?.plate,
      },
      client: client ? { firstName: client.fullName.split(' ')[0] } : null,
      status: order.status,
      enteredAt: order.enteredAt,
      workshop: {
        name: tenant?.name,
        phone: tenant?.phone,
        address: tenant?.address,
      },
      currentPhase: currentPhase
        ? { name: currentPhase.name, orderIndex: currentPhase.orderIndex }
        : null,
      phases,
    };
  }
}
