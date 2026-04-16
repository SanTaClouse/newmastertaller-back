import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { CarModel } from './car-model.entity';

@Entity('car_brands')
export class CarBrand {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @OneToMany(() => CarModel, (m) => m.brand)
  models: CarModel[];
}
