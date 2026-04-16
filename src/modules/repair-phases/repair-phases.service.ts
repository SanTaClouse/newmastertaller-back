import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RepairPhase } from './repair-phase.entity';
import { CreateRepairPhaseDto, ReorderPhasesDto } from './dto/create-repair-phase.dto';
import { TenantContext } from '../../common/context/tenant.context';

@Injectable()
export class RepairPhasesService {
  constructor(@InjectRepository(RepairPhase) private repo: Repository<RepairPhase>) {}

  async findAll() {
    const tenantId = TenantContext.getTenantId();
    return this.repo.find({
      where: { tenantId },
      order: { orderIndex: 'ASC' },
    });
  }

  async findFirstPhase() {
    const tenantId = TenantContext.getTenantId();
    return this.repo.findOne({
      where: { tenantId },
      order: { orderIndex: 'ASC' },
    });
  }

  async findNextPhase(currentOrderIndex: number) {
    const tenantId = TenantContext.getTenantId();
    const phases = await this.repo.find({
      where: { tenantId },
      order: { orderIndex: 'ASC' },
    });
    return phases.find((p) => p.orderIndex > currentOrderIndex) || null;
  }

  async create(dto: CreateRepairPhaseDto) {
    const tenantId = TenantContext.getTenantId();
    const phase = this.repo.create({ ...dto, tenantId });
    return this.repo.save(phase);
  }

  async update(id: string, dto: Partial<CreateRepairPhaseDto>) {
    const tenantId = TenantContext.getTenantId();
    const phase = await this.repo.findOne({ where: { id, tenantId } });
    if (!phase) throw new NotFoundException('Fase no encontrada');
    Object.assign(phase, dto);
    return this.repo.save(phase);
  }

  async remove(id: string) {
    const tenantId = TenantContext.getTenantId();
    const phase = await this.repo.findOne({ where: { id, tenantId } });
    if (!phase) throw new NotFoundException('Fase no encontrada');
    await this.repo.softDelete(id);
    return { message: 'Fase eliminada' };
  }

  async reorder(dto: ReorderPhasesDto) {
    const tenantId = TenantContext.getTenantId();
    const updates = dto.phases.map((p) =>
      this.repo.update({ id: p.id, tenantId }, { orderIndex: p.orderIndex }),
    );
    await Promise.all(updates);
    return this.findAll();
  }
}
