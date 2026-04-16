import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { customAlphabet } from 'nanoid';
import { WorkOrder, WorkOrderStatus } from './work-order.entity';
import { WorkOrderPhaseLog } from './work-order-phase-log.entity';
import { Vehicle } from '../vehicles/vehicle.entity';
import { Expense } from '../expenses/expense.entity';
import { RepairPhase } from '../repair-phases/repair-phase.entity';
import { Client } from '../clients/client.entity';
import { CreateWorkOrderDto, SetPhaseDto, UpdateWorkOrderDto } from './dto/create-work-order.dto';
import { TenantContext } from '../../common/context/tenant.context';

const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);

@Injectable()
export class WorkOrdersService {
  constructor(
    @InjectRepository(WorkOrder) private orderRepo: Repository<WorkOrder>,
    @InjectRepository(WorkOrderPhaseLog) private phaseLogRepo: Repository<WorkOrderPhaseLog>,
    @InjectRepository(Vehicle) private vehicleRepo: Repository<Vehicle>,
    @InjectRepository(Expense) private expenseRepo: Repository<Expense>,
    @InjectRepository(RepairPhase) private phaseRepo: Repository<RepairPhase>,
    private dataSource: DataSource,
  ) {}

  private async generateTrackingCode(): Promise<string> {
    let code: string;
    let exists = true;
    while (exists) {
      code = nanoid();
      const found = await this.orderRepo.findOne({ where: { trackingCode: code } });
      exists = !!found;
    }
    return code!;
  }

  private async buildOrderResponse(order: WorkOrder) {
    const tenantId = order.tenantId;
    const expenses = await this.expenseRepo.find({ where: { workOrderId: order.id, tenantId } });
    const phaseLogs = await this.phaseLogRepo.find({ where: { workOrderId: order.id, tenantId }, order: { enteredAt: 'ASC' } });
    const vehicle = await this.vehicleRepo.findOne({ where: { id: order.vehicleId } });
    const client = order.clientId
      ? await this.dataSource.getRepository(Client).findOne({ where: { id: order.clientId } })
      : null;

    const totalExpenses = expenses.reduce((s, e) => s + Number(e.cost), 0);
    const netProfit = Number(order.totalPrice) - totalExpenses;

    return { ...order, vehicle, client, expenses, phaseLogs, totalExpenses, netProfit };
  }

  async findAll(page = 1, limit = 20, status?: string, search?: string, from?: string, to?: string, includeFinancials = false, vehicleId?: string) {
    const tenantId = TenantContext.getTenantId();
    const qb = this.orderRepo.createQueryBuilder('wo')
      .leftJoinAndMapOne('wo.vehicle', Vehicle, 'v', 'CAST(v.id AS varchar) = wo."vehicleId"')
      .where('wo.tenantId = :tenantId', { tenantId })
      .orderBy('wo.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) qb.andWhere('wo.status = :status', { status });
    if (from) qb.andWhere('wo.enteredAt >= :from', { from });
    if (to) {
      // Include the full day by setting end to 23:59:59
      const toEnd = new Date(to);
      toEnd.setHours(23, 59, 59, 999);
      qb.andWhere('wo.enteredAt <= :toEnd', { toEnd });
    }
    if (search) {
      qb.andWhere(
        '(v.brand ILIKE :s OR v.model ILIKE :s OR v.plate ILIKE :s OR wo.description ILIKE :s OR wo.trackingCode ILIKE :s)',
        { s: `%${search}%` },
      );
    }
    if (vehicleId) qb.andWhere('wo."vehicleId" = :vehicleId', { vehicleId });

    const [data, total] = await qb.getManyAndCount();

    if (includeFinancials) {
      const enriched = await Promise.all(data.map((o) => this.buildOrderResponse(o)));
      return { data: enriched, total, page, limit };
    }

    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const tenantId = TenantContext.getTenantId();
    const order = await this.orderRepo.findOne({ where: { id, tenantId } });
    if (!order) throw new NotFoundException('Orden no encontrada');
    return this.buildOrderResponse(order);
  }

  async create(dto: CreateWorkOrderDto) {
    const tenantId = TenantContext.getTenantId();

    return this.dataSource.transaction(async (manager) => {
      // Crear o reusar vehículo
      let vehicle: Vehicle;
      if (dto.vehicleId) {
        const found = await manager.findOne(Vehicle, { where: { id: dto.vehicleId, tenantId } });
        if (!found) throw new NotFoundException('Vehículo no encontrado');
        vehicle = found;
      } else {
        vehicle = manager.create(Vehicle, {
          brand: dto.brand,
          model: dto.model,
          year: dto.year,
          plate: dto.plate,
          color: dto.color,
          clientId: dto.clientId,
          tenantId,
        });
        vehicle = await manager.save(Vehicle, vehicle);
      }

      const trackingCode = await this.generateTrackingCode();

      const order = manager.create(WorkOrder, {
        tenantId,
        vehicleId: vehicle.id,
        clientId: dto.clientId,
        trackingCode,
        description: dto.description,
        laborCost: dto.laborCost || 0,
        totalPrice: dto.totalPrice || 0,
        status: WorkOrderStatus.NEW,
      });
      const savedOrder = await manager.save(WorkOrder, order);

      // Crear primer phase log automáticamente
      const firstPhase = await manager.findOne(RepairPhase, {
        where: { tenantId },
        order: { orderIndex: 'ASC' },
      });

      if (firstPhase) {
        const log = manager.create(WorkOrderPhaseLog, {
          tenantId,
          workOrderId: savedOrder.id,
          phaseId: firstPhase.id,
          enteredAt: new Date(),
        });
        await manager.save(WorkOrderPhaseLog, log);
        await manager.update(WorkOrder, savedOrder.id, { currentPhaseId: firstPhase.id });
        savedOrder.currentPhaseId = firstPhase.id;
      }

      return this.buildOrderResponse(savedOrder);
    });
  }

  async update(id: string, dto: UpdateWorkOrderDto) {
    const tenantId = TenantContext.getTenantId();
    const order = await this.orderRepo.findOne({ where: { id, tenantId } });
    if (!order) throw new NotFoundException('Orden no encontrada');
    Object.assign(order, dto);
    const saved = await this.orderRepo.save(order);
    return this.buildOrderResponse(saved);
  }

  async remove(id: string) {
    const tenantId = TenantContext.getTenantId();
    const order = await this.orderRepo.findOne({ where: { id, tenantId } });
    if (!order) throw new NotFoundException('Orden no encontrada');
    await this.orderRepo.softDelete(id);
    return { message: 'Orden eliminada' };
  }

  async complete(id: string) {
    const tenantId = TenantContext.getTenantId();
    const order = await this.orderRepo.findOne({ where: { id, tenantId } });
    if (!order) throw new NotFoundException('Orden no encontrada');

    // Cerrar fase actual
    if (order.currentPhaseId) {
      await this.phaseLogRepo.update(
        { workOrderId: id, tenantId, completedAt: undefined as any },
        { completedAt: new Date() },
      );
    }

    order.status = WorkOrderStatus.COMPLETED;
    order.completedAt = new Date();
    const saved = await this.orderRepo.save(order);
    return this.buildOrderResponse(saved);
  }

  async retire(id: string) {
    const tenantId = TenantContext.getTenantId();
    const order = await this.orderRepo.findOne({ where: { id, tenantId } });
    if (!order) throw new NotFoundException('Orden no encontrada');
    if (order.status !== WorkOrderStatus.COMPLETED && order.status !== WorkOrderStatus.RETIRED) {
      throw new BadRequestException('Solo se puede retirar una orden completada');
    }
    order.status = WorkOrderStatus.RETIRED;
    order.retiredAt = new Date();
    const saved = await this.orderRepo.save(order);
    return this.buildOrderResponse(saved);
  }

  async advancePhase(id: string) {
    const tenantId = TenantContext.getTenantId();
    const order = await this.orderRepo.findOne({ where: { id, tenantId } });
    if (!order) throw new NotFoundException('Orden no encontrada');

    const currentPhase = order.currentPhaseId
      ? await this.phaseRepo.findOne({ where: { id: order.currentPhaseId, tenantId } })
      : null;

    const allPhases = await this.phaseRepo.find({ where: { tenantId }, order: { orderIndex: 'ASC' } });
    const nextPhase = currentPhase
      ? allPhases.find((p) => p.orderIndex > currentPhase.orderIndex)
      : allPhases[0];

    if (!nextPhase) throw new BadRequestException('No hay más fases disponibles');

    return this.dataSource.transaction(async (manager) => {
      if (currentPhase) {
        await manager.update(WorkOrderPhaseLog,
          { workOrderId: id, tenantId, phaseId: currentPhase.id, completedAt: undefined as any },
          { completedAt: new Date() },
        );
      }

      const log = manager.create(WorkOrderPhaseLog, {
        tenantId,
        workOrderId: id,
        phaseId: nextPhase.id,
        enteredAt: new Date(),
      });
      await manager.save(WorkOrderPhaseLog, log);

      await manager.update(WorkOrder, id, {
        currentPhaseId: nextPhase.id,
        status: WorkOrderStatus.PROGRESS,
      });

      const updated = await manager.findOne(WorkOrder, { where: { id } });
      return this.buildOrderResponse(updated!);
    });
  }

  async setPhase(id: string, dto: SetPhaseDto) {
    const tenantId = TenantContext.getTenantId();
    const order = await this.orderRepo.findOne({ where: { id, tenantId } });
    if (!order) throw new NotFoundException('Orden no encontrada');

    const phase = await this.phaseRepo.findOne({ where: { id: dto.phaseId, tenantId } });
    if (!phase) throw new NotFoundException('Fase no encontrada');

    return this.dataSource.transaction(async (manager) => {
      if (order.currentPhaseId) {
        await manager.update(WorkOrderPhaseLog,
          { workOrderId: id, tenantId, phaseId: order.currentPhaseId, completedAt: undefined as any },
          { completedAt: new Date() },
        );
      }

      const log = manager.create(WorkOrderPhaseLog, {
        tenantId,
        workOrderId: id,
        phaseId: dto.phaseId,
        enteredAt: new Date(),
        notes: dto.notes,
      });
      await manager.save(WorkOrderPhaseLog, log);

      await manager.update(WorkOrder, id, {
        currentPhaseId: dto.phaseId,
        status: WorkOrderStatus.PROGRESS,
      });

      const updated = await manager.findOne(WorkOrder, { where: { id } });
      return this.buildOrderResponse(updated!);
    });
  }
}
