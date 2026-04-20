import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import { Vehicle } from './vehicle.entity';
import { VehicleMileageLog } from './vehicle-mileage-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Vehicle, VehicleMileageLog])],
  controllers: [VehiclesController],
  providers: [VehiclesService],
  exports: [VehiclesService],
})
export class VehiclesModule {}
