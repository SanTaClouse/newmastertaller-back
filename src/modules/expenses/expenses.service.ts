import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from './expense.entity';
import { WorkOrder } from '../work-orders/work-order.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { TenantContext } from '../../common/context/tenant.context';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense) private repo: Repository<Expense>,
    @InjectRepository(WorkOrder) private orderRepo: Repository<WorkOrder>,
  ) {}

  async create(workOrderId: string, dto: CreateExpenseDto) {
    const tenantId = TenantContext.getTenantId();
    const order = await this.orderRepo.findOne({ where: { id: workOrderId, tenantId } });
    if (!order) throw new NotFoundException('Orden no encontrada');

    const expense = this.repo.create({ ...dto, workOrderId, tenantId });
    return this.repo.save(expense);
  }

  async update(id: string, dto: Partial<CreateExpenseDto>) {
    const tenantId = TenantContext.getTenantId();
    const expense = await this.repo.findOne({ where: { id, tenantId } });
    if (!expense) throw new NotFoundException('Gasto no encontrado');
    Object.assign(expense, dto);
    return this.repo.save(expense);
  }

  async remove(id: string) {
    const tenantId = TenantContext.getTenantId();
    const expense = await this.repo.findOne({ where: { id, tenantId } });
    if (!expense) throw new NotFoundException('Gasto no encontrado');
    await this.repo.delete(id);
    return { message: 'Gasto eliminado' };
  }
}
