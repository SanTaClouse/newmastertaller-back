import { IsDecimal, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateWorkOrderDto {
  @IsString()
  brand: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsInt()
  @Min(1900)
  @Max(2100)
  @IsOptional()
  year?: number;

  @IsString()
  @IsOptional()
  plate?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  laborCost?: number;

  @IsOptional()
  totalPrice?: number;

  @IsUUID()
  @IsOptional()
  clientId?: string;

  @IsUUID()
  @IsOptional()
  vehicleId?: string;
}

export class SetPhaseDto {
  @IsUUID()
  phaseId: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateWorkOrderDto {
  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  diagnosis?: string;

  @IsOptional()
  laborCost?: number;

  @IsOptional()
  totalPrice?: number;

  @IsUUID()
  @IsOptional()
  clientId?: string;

  @IsString()
  @IsOptional()
  status?: string;
}
