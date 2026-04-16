import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { WorkOrder, WorkOrderStatus } from '../work-orders/work-order.entity';
import { Expense } from '../expenses/expense.entity';
import { TenantContext } from '../../common/context/tenant.context';
import {
  subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  format, differenceInDays,
} from 'date-fns';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(WorkOrder) private orderRepo: Repository<WorkOrder>,
    @InjectRepository(Expense) private expenseRepo: Repository<Expense>,
  ) {}

  // ── helpers ──────────────────────────────────────────────────────────────

  private async calcProfit(orders: WorkOrder[]): Promise<number> {
    const tenantId = TenantContext.getTenantId();
    let total = 0;
    for (const o of orders) {
      const expenses = await this.expenseRepo.find({ where: { workOrderId: o.id, tenantId } });
      total += Number(o.totalPrice) - expenses.reduce((s, e) => s + Number(e.cost), 0);
    }
    return total;
  }

  private parseWeekBase(weekStart?: string): Date {
    if (weekStart) {
      const [y, m, d] = weekStart.split('-').map(Number);
      return new Date(y, m - 1, d, 0, 0, 0, 0);
    }
    const base = new Date();
    const dow = base.getDay();
    base.setDate(base.getDate() - (dow === 0 ? 6 : dow - 1));
    base.setHours(0, 0, 0, 0);
    return base;
  }

  private dayRange(base: Date, offset: number): [Date, Date] {
    const s = new Date(base.getFullYear(), base.getMonth(), base.getDate() + offset, 0, 0, 0, 0);
    const e = new Date(base.getFullYear(), base.getMonth(), base.getDate() + offset, 23, 59, 59, 999);
    return [s, e];
  }

  // ── existing endpoints ────────────────────────────────────────────────────

  async getDashboard() {
    const tenantId = TenantContext.getTenantId();
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const prevWeekStart = subDays(weekStart, 7);
    const prevWeekEnd = subDays(weekEnd, 7);

    const weekOrders = await this.orderRepo.find({ where: { tenantId, enteredAt: Between(weekStart, weekEnd) } });
    const prevOrders = await this.orderRepo.find({ where: { tenantId, enteredAt: Between(prevWeekStart, prevWeekEnd) } });

    const activeOrders = await this.orderRepo.count({ where: { tenantId, status: WorkOrderStatus.PROGRESS } });
    const delayedOrders = await this.orderRepo.count({ where: { tenantId, status: WorkOrderStatus.DELAYED } });

    const weekProfit = await this.calcProfit(weekOrders);
    const prevWeekProfit = await this.calcProfit(prevOrders);
    const weekRevenue = weekOrders.reduce((s, o) => s + Number(o.totalPrice), 0);

    const dailyData: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = subDays(now, i);
      const dayStart = new Date(day); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day); dayEnd.setHours(23, 59, 59, 999);
      const count = await this.orderRepo.count({ where: { tenantId, enteredAt: Between(dayStart, dayEnd) } });
      dailyData.push({ date: format(dayStart, 'yyyy-MM-dd'), count });
    }

    return { weekProfit, prevWeekProfit, weekRevenue, activeOrders, delayedOrders, profitDiff: weekProfit - prevWeekProfit, dailyData };
  }

  async getWeekly(weekStart?: string) {
    const tenantId = TenantContext.getTenantId();
    const base = this.parseWeekBase(weekStart);
    const result: { date: string; revenue: number; profit: number; count: number }[] = [];

    for (let i = 0; i < 7; i++) {
      const [dayStart, dayEnd] = this.dayRange(base, i);
      const orders = await this.orderRepo.find({ where: { tenantId, enteredAt: Between(dayStart, dayEnd) } });
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

    const currentOrders = await this.orderRepo.find({ where: { tenantId, enteredAt: Between(monthStart, monthEnd) } });
    const prevOrders = await this.orderRepo.find({ where: { tenantId, enteredAt: Between(prevMonthStart, prevMonthEnd) } });

    return {
      current: { revenue: currentOrders.reduce((s, o) => s + Number(o.totalPrice), 0), profit: await this.calcProfit(currentOrders), count: currentOrders.length },
      previous: { revenue: prevOrders.reduce((s, o) => s + Number(o.totalPrice), 0), profit: await this.calcProfit(prevOrders), count: prevOrders.length },
    };
  }

  // ── new endpoints ─────────────────────────────────────────────────────────

  /** Entries (enteredAt) vs exits (retiredAt) per day of the week */
  async getVehiclesFlow(weekStart?: string) {
    const tenantId = TenantContext.getTenantId();
    const base = this.parseWeekBase(weekStart);
    const result: { date: string; entered: number; exited: number }[] = [];

    for (let i = 0; i < 7; i++) {
      const [dayStart, dayEnd] = this.dayRange(base, i);
      const entered = await this.orderRepo.count({ where: { tenantId, enteredAt: Between(dayStart, dayEnd) } });
      const exited = await this.orderRepo.count({ where: { tenantId, retiredAt: Between(dayStart, dayEnd) } });
      result.push({ date: format(dayStart, 'yyyy-MM-dd'), entered, exited });
    }
    return result;
  }

  /** Average days orders stay in the shop (completed + retired) */
  async getAvgDays() {
    const tenantId = TenantContext.getTenantId();
    const orders = await this.orderRepo.find({
      where: { tenantId, status: In([WorkOrderStatus.COMPLETED, WorkOrderStatus.RETIRED]) },
    });

    const withDates = orders.filter((o) => o.completedAt && o.enteredAt);
    if (!withDates.length) return { avgDays: 0, count: 0 };

    const total = withDates.reduce((s, o) => {
      return s + Math.max(0, differenceInDays(new Date(o.completedAt), new Date(o.enteredAt)));
    }, 0);

    return { avgDays: +(total / withDates.length).toFixed(1), count: withDates.length };
  }

  /** Top N job types by total net profit */
  async getTopJobs(limit = 5) {
    const tenantId = TenantContext.getTenantId();
    const orders = await this.orderRepo.find({
      where: { tenantId, status: In([WorkOrderStatus.COMPLETED, WorkOrderStatus.RETIRED]) },
    });

    const map = new Map<string, { count: number; totalRevenue: number; totalExpenses: number }>();

    for (const order of orders) {
      const key = order.description?.trim() || 'Sin descripción';
      const expenses = await this.expenseRepo.find({ where: { workOrderId: order.id, tenantId } });
      const expTotal = expenses.reduce((s, e) => s + Number(e.cost), 0);

      if (!map.has(key)) map.set(key, { count: 0, totalRevenue: 0, totalExpenses: 0 });
      const entry = map.get(key)!;
      entry.count++;
      entry.totalRevenue += Number(order.totalPrice);
      entry.totalExpenses += expTotal;
    }

    return Array.from(map.entries())
      .map(([description, d]) => ({
        description,
        count: d.count,
        totalRevenue: d.totalRevenue,
        totalExpenses: d.totalExpenses,
        totalProfit: d.totalRevenue - d.totalExpenses,
        avgProfit: +((d.totalRevenue - d.totalExpenses) / d.count).toFixed(0),
      }))
      .sort((a, b) => b.totalProfit - a.totalProfit)
      .slice(0, limit);
  }

  /** Revenue vs expenses for the current month */
  async getRevenueVsExpenses() {
    const tenantId = TenantContext.getTenantId();
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const prevMonthStart = startOfMonth(subDays(monthStart, 1));
    const prevMonthEnd = endOfMonth(subDays(monthStart, 1));

    const calcMonthData = async (from: Date, to: Date) => {
      const orders = await this.orderRepo.find({
        where: { tenantId, status: In([WorkOrderStatus.COMPLETED, WorkOrderStatus.RETIRED]), completedAt: Between(from, to) },
      });
      let totalExpenses = 0;
      for (const o of orders) {
        const exp = await this.expenseRepo.find({ where: { workOrderId: o.id, tenantId } });
        totalExpenses += exp.reduce((s, e) => s + Number(e.cost), 0);
      }
      const revenue = orders.reduce((s, o) => s + Number(o.totalPrice), 0);
      return { revenue, expenses: totalExpenses, profit: revenue - totalExpenses, count: orders.length };
    };

    return {
      current: await calcMonthData(monthStart, monthEnd),
      previous: await calcMonthData(prevMonthStart, prevMonthEnd),
    };
  }
}
