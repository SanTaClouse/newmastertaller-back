import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CarCatalogController } from './car-catalog.controller';
import { CarBrand } from './car-brand.entity';
import { CarModel } from './car-model.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CarBrand, CarModel])],
  controllers: [CarCatalogController],
  exports: [TypeOrmModule],
})
export class CarCatalogModule {}
