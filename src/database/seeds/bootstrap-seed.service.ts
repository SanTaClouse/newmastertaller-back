import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as path from 'path';
import { customAlphabet } from 'nanoid';
import { subDays } from 'date-fns';

import { Tenant } from '../../modules/tenants/tenant.entity';
import { User } from '../../modules/users/user.entity';
import { CarBrand } from '../../modules/car-catalog/car-brand.entity';
import { CarModel } from '../../modules/car-catalog/car-model.entity';
import { RepairPhase } from '../../modules/repair-phases/repair-phase.entity';
import { Client } from '../../modules/clients/client.entity';
import { Vehicle } from '../../modules/vehicles/vehicle.entity';
import { WorkOrder, WorkOrderStatus } from '../../modules/work-orders/work-order.entity';
import { Expense } from '../../modules/expenses/expense.entity';
import { WorkOrderPhaseLog } from '../../modules/work-orders/work-order-phase-log.entity';

const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);

const REPAIR_PHASES = [
  { name: 'Vehículo ingresó al taller', orderIndex: 1, icon: 'LogIn' },
  { name: 'Vehículo en inspección', orderIndex: 2, icon: 'Search' },
  { name: 'Diagnóstico realizado', orderIndex: 3, icon: 'ClipboardCheck' },
  { name: 'Vehículo en reparación', orderIndex: 4, icon: 'Wrench' },
  { name: 'Armado de partes / fase final', orderIndex: 5, icon: 'Cog' },
  { name: 'Testeo', orderIndex: 6, icon: 'CheckCircle' },
  { name: 'Vehículo listo para entregar', orderIndex: 7, icon: 'Car' },
];

@Injectable()
export class BootstrapSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(BootstrapSeedService.name);

  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.seedCarCatalog();
      await this.seedNewmaster();
      await this.seedEmpresaFalsa();
      this.logger.log('Bootstrap seed completed');
    } catch (err) {
      this.logger.error('Bootstrap seed failed (non-fatal):', err?.message ?? err);
    }
  }

  // ─── Car catalog ──────────────────────────────────────────────────────────

  private async seedCarCatalog(): Promise<void> {
    const existing = await this.ds.getRepository(CarBrand).count();
    if (existing > 0) return;

    this.logger.log('Seeding car catalog...');
    let carBrandsData: Array<{ name: string; models: string[] }>;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      carBrandsData = require(path.join(__dirname, 'data', 'car-brands.json'));
    } catch {
      this.logger.warn('car-brands.json not found, skipping car catalog seed');
      return;
    }

    for (const brandData of carBrandsData) {
      const brand = await this.ds.getRepository(CarBrand).save({ name: brandData.name });
      const models = brandData.models.map((name: string) => ({ brandId: brand.id, name }));
      await this.ds.getRepository(CarModel).save(models);
    }
    this.logger.log('Car catalog seeded');
  }

  // ─── Taller Newmaster ─────────────────────────────────────────────────────

  private async seedNewmaster(): Promise<void> {
    let tenant = await this.ds.getRepository(Tenant).findOne({ where: { slug: 'newmaster' } });
    if (tenant) {
      this.logger.log('Newmaster tenant already exists, skipping');
      return;
    }

    this.logger.log('Seeding Taller Newmaster...');

    // Tenant
    tenant = await this.ds.getRepository(Tenant).save({
      name: 'Taller Newmaster',
      slug: 'newmaster',
      email: 'admin@newmaster.com',
      phone: '3425550000',
      address: 'Av. San Martín 1234, Santa Fe',
    });

    // Admin user
    const passwordHash = await bcrypt.hash('AdminPass123!', 10);
    await this.ds.getRepository(User).save({
      tenantId: tenant.id,
      email: 'admin@newmaster.com',
      passwordHash,
      fullName: 'Admin Newmaster',
    });

    // Repair phases
    const savedPhases = await this.seedRepairPhases(tenant.id);

    // Clients
    const clientsData = [
      { fullName: 'Juan Pérez', phone: '3425551234' },
      { fullName: 'María García', phone: '3425559876' },
      { fullName: 'Carlos López', phone: '3425554567' },
      { fullName: 'Ana Rodríguez', phone: '3425557890' },
      { fullName: 'Roberto Díaz', phone: '3425553456' },
      { fullName: 'Laura Fernández', phone: '3425556789' },
      { fullName: 'Diego Martínez', phone: '3425552345' },
      { fullName: 'Sofía Ruiz', phone: '3425558901' },
    ];
    const savedClients = await this.ds.getRepository(Client).save(
      clientsData.map((c) => ({ ...c, tenantId: tenant.id })),
    );

    // Vehicles
    const vehiclesData = [
      { brand: 'Fiat', model: 'Uno', year: 2014, plate: 'AC 234 FG', color: 'Rojo', clientIndex: 0 },
      { brand: 'Fiat', model: 'Cronos', year: 2021, plate: 'MNO 456', color: 'Blanco', clientIndex: 1 },
      { brand: 'Toyota', model: 'Hilux', year: 2020, plate: 'AB 123 CD', color: 'Gris', clientIndex: 2 },
      { brand: 'Ford', model: 'Ranger', year: 2019, plate: 'EF 456 GH', color: 'Negro', clientIndex: 3 },
      { brand: 'Fiat', model: 'Argo', year: 2022, plate: 'IJ 789 KL', color: 'Azul', clientIndex: 4 },
      { brand: 'Peugeot', model: '208', year: 2021, plate: 'QR 012 ST', color: 'Blanco', clientIndex: 5 },
      { brand: 'Volkswagen', model: 'Amarok', year: 2023, plate: 'UV 345 WX', color: 'Plata', clientIndex: 6 },
      { brand: 'Chevrolet', model: 'Cruze', year: 2017, plate: 'YZ 678 AB', color: 'Rojo', clientIndex: 7 },
    ];
    const savedVehicles = await this.ds.getRepository(Vehicle).save(
      vehiclesData.map((v) => ({
        brand: v.brand,
        model: v.model,
        year: v.year,
        plate: v.plate,
        color: v.color,
        tenantId: tenant.id,
        clientId: savedClients[v.clientIndex].id,
      })),
    );

    // Orders + expenses + phase logs
    const ordersData: Array<{
      vIdx: number; cIdx: number; description: string; totalPrice: number; laborCost: number;
      status: WorkOrderStatus; daysAgo: number; phaseIdx: number;
      completedDaysAgo?: number; retiredDaysAgo?: number;
    }> = [
      { vIdx: 0, cIdx: 0, description: 'Cambio de aceite + filtros', totalPrice: 45000, laborCost: 30000, status: WorkOrderStatus.NEW, daysAgo: 0, phaseIdx: 0 },
      { vIdx: 1, cIdx: 1, description: 'Cambio de correa de distribución', totalPrice: 120000, laborCost: 85000, status: WorkOrderStatus.PROGRESS, daysAgo: 2, phaseIdx: 2 },
      { vIdx: 2, cIdx: 2, description: 'Service completo 50.000km', totalPrice: 85000, laborCost: 45000, status: WorkOrderStatus.PROGRESS, daysAgo: 1, phaseIdx: 3 },
      { vIdx: 3, cIdx: 3, description: 'Cambio de pastillas + discos', totalPrice: 95000, laborCost: 35000, status: WorkOrderStatus.DELAYED, daysAgo: 6, phaseIdx: 3 },
      { vIdx: 4, cIdx: 4, description: 'Diagnóstico electrónico', totalPrice: 25000, laborCost: 25000, status: WorkOrderStatus.NEW, daysAgo: 0, phaseIdx: 0 },
      { vIdx: 5, cIdx: 5, description: 'Reparación de aire acondicionado', totalPrice: 75000, laborCost: 40000, status: WorkOrderStatus.COMPLETED, daysAgo: 5, phaseIdx: 6, completedDaysAgo: 1 },
      { vIdx: 6, cIdx: 6, description: 'Alineación y balanceo', totalPrice: 35000, laborCost: 27000, status: WorkOrderStatus.RETIRED, daysAgo: 7, phaseIdx: 6, completedDaysAgo: 3, retiredDaysAgo: 2 },
      { vIdx: 7, cIdx: 7, description: 'Cambio de embrague', totalPrice: 180000, laborCost: 80000, status: WorkOrderStatus.PROGRESS, daysAgo: 3, phaseIdx: 4 },
    ];

    const expensesData: Array<Array<{ description: string; cost: number }>> = [
      [{ description: 'Aceite Castrol 10W40 x4L', cost: 8500 }, { description: 'Filtro de aceite Mann', cost: 3200 }],
      [{ description: 'Kit distribución Gates', cost: 35000 }],
      [{ description: 'Kit filtros completo', cost: 18000 }, { description: 'Aceite Shell Helix 5W30 x7L', cost: 12000 }],
      [{ description: 'Pastillas Ferodo', cost: 22000 }, { description: 'Discos Fremax x2', cost: 38000 }],
      [],
      [{ description: 'Gas refrigerante R134a', cost: 12000 }, { description: 'Válvula expansión', cost: 10000 }],
      [{ description: 'Contrapesos', cost: 3000 }],
      [{ description: 'Kit embrague Valeo', cost: 55000 }, { description: 'Volante bimasa', cost: 45000 }],
    ];

    for (let i = 0; i < ordersData.length; i++) {
      const od = ordersData[i];
      const enteredAt = subDays(new Date(), od.daysAgo);
      const completedAt = od.completedDaysAgo != null ? subDays(new Date(), od.completedDaysAgo) : undefined;
      const retiredAt = od.retiredDaysAgo != null ? subDays(new Date(), od.retiredDaysAgo) : undefined;

      const order = await this.ds.getRepository(WorkOrder).save({
        tenantId: tenant.id,
        vehicleId: savedVehicles[od.vIdx].id,
        clientId: savedClients[od.cIdx].id,
        trackingCode: nanoid(),
        description: od.description,
        totalPrice: od.totalPrice,
        laborCost: od.laborCost,
        status: od.status,
        enteredAt,
        completedAt,
        retiredAt,
        currentPhaseId: savedPhases[od.phaseIdx]?.id,
      });

      // Phase logs
      for (let j = 0; j <= od.phaseIdx; j++) {
        const isLast = j === od.phaseIdx;
        await this.ds.getRepository(WorkOrderPhaseLog).save({
          tenantId: tenant.id,
          workOrderId: order.id,
          phaseId: savedPhases[j].id,
          enteredAt: subDays(enteredAt, od.phaseIdx - j),
          completedAt: isLast
            ? completedAt
            : subDays(enteredAt, od.phaseIdx - j - 1),
        });
      }

      // Expenses
      for (const exp of expensesData[i]) {
        await this.ds.getRepository(Expense).save({ ...exp, tenantId: tenant.id, workOrderId: order.id });
      }
    }

    this.logger.log('Taller Newmaster seeded');
  }

  // ─── Empresa Falsa ────────────────────────────────────────────────────────

  private async seedEmpresaFalsa(): Promise<void> {
    let tenant = await this.ds.getRepository(Tenant).findOne({ where: { slug: 'empresafalsa' } });
    if (tenant) {
      this.logger.log('Empresa Falsa tenant already exists, skipping');
      return;
    }

    this.logger.log('Seeding Empresa Falsa...');

    tenant = await this.ds.getRepository(Tenant).save({
      name: 'Empresa Falsa',
      slug: 'empresafalsa',
      email: 'admin@empresafalsa.com',
      phone: '3410000000',
    });

    const passwordHash = await bcrypt.hash('AdminPass123!', 10);
    await this.ds.getRepository(User).save({
      tenantId: tenant.id,
      email: 'admin@empresafalsa.com',
      passwordHash,
      fullName: 'Admin Empresa Falsa',
    });

    await this.seedRepairPhases(tenant.id);

    this.logger.log('Empresa Falsa seeded');
  }

  // ─── Shared helpers ───────────────────────────────────────────────────────

  private async seedRepairPhases(tenantId: string): Promise<RepairPhase[]> {
    const saved: RepairPhase[] = [];
    for (const p of REPAIR_PHASES) {
      const phase = await this.ds.getRepository(RepairPhase).save({
        ...p,
        tenantId,
        isDefault: true,
      });
      saved.push(phase);
    }
    return saved;
  }
}
