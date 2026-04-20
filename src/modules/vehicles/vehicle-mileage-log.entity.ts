import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, Index,
} from 'typeorm';

@Entity('vehicle_mileage_logs')
@Index(['tenantId', 'vehicleId', 'recordedAt'])
export class VehicleMileageLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column()
  vehicleId: string;

  @Column({ nullable: true })
  workOrderId: string;

  @Column({ type: 'int' })
  mileage: number;

  @Column({ type: 'timestamptz' })
  recordedAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;
}
