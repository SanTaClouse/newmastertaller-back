import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, DeleteDateColumn, Index, OneToMany,
} from 'typeorm';

export enum WorkOrderStatus {
  NEW = 'new',
  PROGRESS = 'progress',
  DELAYED = 'delayed',
  COMPLETED = 'completed',
  INCOMPLETE = 'incomplete',
}

@Entity('work_orders')
@Index(['tenantId', 'createdAt'])
export class WorkOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column()
  vehicleId: string;

  @Column({ nullable: true })
  clientId: string;

  @Column({ unique: true })
  @Index()
  trackingCode: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  laborCost: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalPrice: number;

  @Column({ type: 'enum', enum: WorkOrderStatus, default: WorkOrderStatus.NEW })
  status: WorkOrderStatus;

  @Column({ nullable: true })
  currentPhaseId: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  enteredAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
