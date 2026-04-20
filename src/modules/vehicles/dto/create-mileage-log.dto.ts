import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateMileageLogDto {
  @IsInt()
  @Min(0)
  mileage: number;

  @IsDateString()
  recordedAt: string;

  @IsString()
  @IsOptional()
  workOrderId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
