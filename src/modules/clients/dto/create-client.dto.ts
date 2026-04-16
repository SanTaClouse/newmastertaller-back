import { IsEmail, IsOptional, IsString, Matches } from 'class-validator';

export class CreateClientDto {
  @IsString()
  fullName: string;

  @IsString()
  @Matches(/^\d+$/, { message: 'phone debe contener solo dígitos' })
  phone: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
