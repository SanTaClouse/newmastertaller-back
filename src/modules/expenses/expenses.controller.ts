import { Body, Controller, Delete, Param, Patch, Post } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';

@Controller()
export class ExpensesController {
  constructor(private service: ExpensesService) {}

  @Post('work-orders/:workOrderId/expenses')
  create(@Param('workOrderId') workOrderId: string, @Body() dto: CreateExpenseDto) {
    return this.service.create(workOrderId, dto);
  }

  @Patch('expenses/:id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateExpenseDto>) {
    return this.service.update(id, dto);
  }

  @Delete('expenses/:id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
