import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { WorkOrder, WorkOrderStatus } from '../work-orders/work-order.entity';
import { Expense } from '../expenses/expense.entity';
import { TenantContext } from '../../common/context/tenant.context';
import { subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from 'date-fns';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(WorkOrder) private orderRepo: Repository<WorkOrder>,
    @InjectRepository(Expense) private expenseRepo: Repository<Expense>,
  ) {}

  private async calcProfit(orders: WorkOrder[]): Promise<number> {
    const tenantId = TenantContext.getTenantId();
    let total = 0;
    for (const o of orders) {
      const expenses = await this.expenseRepo.find({ where: { workOrderId: o.id, tenantId } });
      const expTotal = expenses.reduce((s, e) => s + Number(e.cost), 0);
      total += Number(o.totalPrice) - expTotal;
    }
    return total;
  }

  async getDashboard() {
    const tenantId = TenantContext.getTenantId();
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const prevWeekStart = subDays(weekStart, 7);
    const prevWeekEnd = subDays(weekEnd, 7);

    const weekOrders = await this.orderRepo.find({
      where: { tenantId, enteredAt: Between(weekStart, weekEnd) },
    });
    const prevOrders = await this.orderRepo.find({
      where: { tenantId, enteredAt: Between(prevWeekStart, prevWeekEnd) },
    });

    const activeOrders = await this.orderRepo.count({
      where: { tenantId, status: WorkOrderStatus.PROGRESS },
    });
    const delayedOrders = await this.orderRepo.count({
      where: { tenantId, status: WorkOrderStatus.DELAYED },
    });

    const weekProfit = await this.calcProfit(weekOrders);
    const prevWeekProfit = await this.calcProfit(prevOrders);
    const weekRevenue = weekOrders.reduce((s, o) => s + Number(o.totalPrice), 0);

    // Autos por día (últimos 7 días)
    const dailyData: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = subDays(now, i);
      const dayStart = new Date(day.setHours(0, 0, 0, 0));
      const dayEnd = new Date(day.setHours(23, 59, 59, 999));
      const count = await this.orderRepo.count({
        where: { tenantId, enteredAt: Between(dayStart, dayEnd) },
      });
      dailyData.push({ date: format(dayStart, 'yyyy-MM-dd'), count });
    }

    return {
      weekProfit,
      prevWeekProfit,
      weekRevenue,
      activeOrders,
      delayedOrders,
      profitDiff: weekProfit - prevWeekProfit,
      dailyData,
    };
  }

  async getWeekly() {
    const tenantId = TenantContext.getTenantId();
    const now = new Date();
    const result: { date: string; revenue: number; profit: number; count: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const day = new Date();
      day.setDate(now.getDate() - i);
      const dayStart = new Date(day.setHours(0, 0, 0, 0));
      const dayEnd = new Date(day.setHours(23, 59, 59, 999));

      const orders = await this.orderRepo.find({
        where: { tenantId, enteredAt: Between(dayStart, dayEnd) },
      });

      const revenue = orders.reduce((s, o) => s + Number(o.totalPrice), 0);
      const profit = await this.calcProfit(orders);
      result.push({ date: format(dayStart, 'yyyy-MM-dd'), revenue, profit, count: orders.length });
    }
    return result;
  }

  async getMonthly() {
    const tenantId = TenantContext.getTenantId();
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const prevMonthStart = startOfMonth(subDays(monthStart, 1));
    const prevMonthEnd = endOfMonth(subDays(monthStart, 1));

    const currentOrders = await this.orderRepo.find({
      where: { tenantId, enteredAt: Between(monthStart, monthEnd) },
    });
    const prevOrders = await this.orderRepo.find({
      where: { tenantId, enteredAt: Between(prevMonthStart, prevMonthEnd) },
    });

    return {
      current: {
        revenue: currentOrders.reduce((s, o) => s + Number(o.totalPrice), 0),
        profit: await this.calcProfit(currentOrders),
        count: currentOrders.length,
      },
      previous: {
        revenue: prevOrders.reduce((s, o) => s + Number(o.totalPrice), 0),
        profit: await this.calcProfit(prevOrders),
        count: prevOrders.length,
      },
    };
  }
}
