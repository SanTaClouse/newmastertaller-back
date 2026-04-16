import { Controller, Get } from '@nestjs/common';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private service: StatsService) {}

  @Get('dashboard')
  getDashboard() { return this.service.getDashboard(); }

  @Get('weekly')
  getWeekly() { return this.service.getWeekly(); }

  @Get('monthly')
  getMonthly() { return this.service.getMonthly(); }
}
