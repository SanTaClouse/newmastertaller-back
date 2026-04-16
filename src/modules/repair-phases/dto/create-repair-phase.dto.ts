import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateRepairPhaseDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(1)
  orderIndex: number;

  @IsString()
  @IsOptional()
  icon?: string;
}

export class ReorderPhasesDto {
  phases: { id: string; orderIndex: number }[];
}
