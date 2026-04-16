import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CarBrand } from './car-brand.entity';

@Entity('car_models')
export class CarModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  brandId: string;

  @ManyToOne(() => CarBrand, (b) => b.models)
  @JoinColumn({ name: 'brandId' })
  brand: CarBrand;

  @Column()
  name: string;
}
