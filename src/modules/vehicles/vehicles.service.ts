import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from './vehicle.entity';
import { VehicleMileageLog } from './vehicle-mileage-log.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { CreateMileageLogDto } from './dto/create-mileage-log.dto';
import { TenantContext } from '../../common/context/tenant.context';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle) private repo: Repository<Vehicle>,
    @InjectRepository(VehicleMileageLog) private mileageRepo: Repository<VehicleMileageLog>,
  ) {}

  async findAll(page = 1, limit = 20, search?: string) {
    const tenantId = TenantContext.getTenantId();
    const qb = this.repo.createQueryBuilder('v')
      .where('v.tenantId = :tenantId', { tenantId })
      .orderBy('v.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      qb.andWhere('(v.brand ILIKE :s OR v.model ILIKE :s OR v.plate ILIKE :s)', { s: `%${search}%` });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const tenantId = TenantContext.getTenantId();
    const vehicle = await this.repo.findOne({ where: { id, tenantId } });
    if (!vehicle) throw new NotFoundException('Vehículo no encontrado');
    return vehicle;
  }

  async create(dto: CreateVehicleDto) {
    const tenantId = TenantContext.getTenantId();
    const vehicle = this.repo.create({ ...dto, tenantId });
    return this.repo.save(vehicle);
  }

  async update(id: string, dto: UpdateVehicleDto) {
    const vehicle = await this.findOne(id);
    Object.assign(vehicle, dto);
    return this.repo.save(vehicle);
  }

  async remove(id: string) {
    const vehicle = await this.findOne(id);
    await this.repo.softDelete(vehicle.id);
    return { message: 'Vehículo eliminado' };
  }

  // ── Mileage logs ────────────────────────────────────────────────────────────

  async getMileageLogs(vehicleId: string) {
    const tenantId = TenantContext.getTenantId();
    await this.findOne(vehicleId); // validates ownership
    return this.mileageRepo.find({
      where: { tenantId, vehicleId },
      order: { recordedAt: 'DESC' },
    });
  }

  async addMileageLog(vehicleId: string, dto: CreateMileageLogDto) {
    const tenantId = TenantContext.getTenantId();
    await this.findOne(vehicleId); // validates ownership
    const log = this.mileageRepo.create({
      tenantId,
      vehicleId,
      mileage: dto.mileage,
      recordedAt: new Date(dto.recordedAt),
      workOrderId: dto.workOrderId,
      notes: dto.notes,
    });
    return this.mileageRepo.save(log);
  }

  async removeMileageLog(vehicleId: string, logId: string) {
    const tenantId = TenantContext.getTenantId();
    const log = await this.mileageRepo.findOne({ where: { id: logId, vehicleId, tenantId } });
    if (!log) throw new NotFoundException('Registro de kilometraje no encontrado');
    await this.mileageRepo.delete(log.id);
    return { message: 'Registro eliminado' };
  }
}
