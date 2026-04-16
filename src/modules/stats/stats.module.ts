import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { WorkOrder } from '../work-orders/work-order.entity';
import { Expense } from '../expenses/expense.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WorkOrder, Expense])],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
