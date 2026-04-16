import { Controller, Get, Param } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CarBrand } from './car-brand.entity';
import { CarModel } from './car-model.entity';
import { Public } from '../../common/decorators/public.decorator';

@Controller('car-brands')
export class CarCatalogController {
  constructor(
    @InjectRepository(CarBrand) private brandRepo: Repository<CarBrand>,
    @InjectRepository(CarModel) private modelRepo: Repository<CarModel>,
  ) {}

  @Get()
  findBrands() {
    return this.brandRepo.find({ order: { name: 'ASC' } });
  }

  @Get(':id/models')
  findModels(@Param('id') id: string) {
    return this.modelRepo.find({ where: { brandId: id }, order: { name: 'ASC' } });
  }
}
