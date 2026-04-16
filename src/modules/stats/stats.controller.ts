import { Controller, Get, Query } from '@nestjs/common';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private service: StatsService) {}

  @Get('dashboard')
  getDashboard() { return this.service.getDashboard(); }

  @Get('weekly')
  getWeekly(@Query('weekStart') weekStart?: string) {
    return this.service.getWeekly(weekStart);
  }

  @Get('monthly')
  getMonthly() { return this.service.getMonthly(); }

  @Get('vehicles-flow')
  getVehiclesFlow(@Query('weekStart') weekStart?: string) {
    return this.service.getVehiclesFlow(weekStart);
  }

  @Get('avg-days')
  getAvgDays() { return this.service.getAvgDays(); }

  @Get('top-jobs')
  getTopJobs(@Query('limit') limit?: string) {
    return this.service.getTopJobs(limit ? parseInt(limit) : 5);
  }

  @Get('revenue-vs-expenses')
  getRevenueVsExpenses() { return this.service.getRevenueVsExpenses(); }
}
