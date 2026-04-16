import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppDataSource } from '../../config/typeorm.config';
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
import carBrandsData from './data/car-brands.json';
import { customAlphabet } from 'nanoid';
import { subDays } from 'date-fns';

const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);

async function seed(fresh = false) {
  await AppDataSource.initialize();
  const ds = AppDataSource;

  if (fresh) {
    console.log('🧹 Limpiando base de datos...');
    await ds.query('TRUNCATE TABLE work_order_phase_logs, expenses, work_orders, repair_phases, vehicles, clients, users, tenants, car_models, car_brands RESTART IDENTITY CASCADE');
  }

  // 1. Car brands & models
  console.log('🚗 Seeding catálogo de autos...');
  for (const brandData of carBrandsData) {
    let brand = await ds.getRepository(CarBrand).findOne({ where: { name: brandData.name } });
    if (!brand) {
      brand = await ds.getRepository(CarBrand).save({ name: brandData.name });
    }
    for (const modelName of brandData.models) {
      const exists = await ds.getRepository(CarModel).findOne({ where: { brandId: brand.id, name: modelName } });
      if (!exists) {
        await ds.getRepository(CarModel).save({ brandId: brand.id, name: modelName });
      }
    }
  }

  // 2. Tenant demo
  console.log('🏢 Seeding tenant demo...');
  let tenant = await ds.getRepository(Tenant).findOne({ where: { slug: 'newmaster' } });
  if (!tenant) {
    tenant = await ds.getRepository(Tenant).save({
      name: 'Taller Newmaster',
      slug: 'newmaster',
      email: 'admin@newmaster.com',
      phone: '3425550000',
      address: 'Av. San Martín 1234, Santa Fe',
    });
  }

  // 3. Admin user
  console.log('👤 Seeding usuario admin...');
  let user = await ds.getRepository(User).findOne({ where: { email: 'admin@newmaster.com' } });
  if (!user) {
    const passwordHash = await bcrypt.hash('AdminPass123!', 10);
    user = await ds.getRepository(User).save({
      tenantId: tenant.id,
      email: 'admin@newmaster.com',
      passwordHash,
      fullName: 'Admin Newmaster',
    });
  }

  // 4. Repair phases
  console.log('🔧 Seeding fases de reparación...');
  const phases = [
    { name: 'Vehículo ingresó al taller', orderIndex: 1, icon: 'LogIn' },
    { name: 'Vehículo en inspección', orderIndex: 2, icon: 'Search' },
    { name: 'Diagnóstico realizado', orderIndex: 3, icon: 'ClipboardCheck' },
    { name: 'Vehículo en reparación', orderIndex: 4, icon: 'Wrench' },
    { name: 'Armado de partes / fase final', orderIndex: 5, icon: 'Cog' },
    { name: 'Testeo', orderIndex: 6, icon: 'CheckCircle' },
    { name: 'Vehículo listo para entregar', orderIndex: 7, icon: 'Car' },
  ];
  const savedPhases: RepairPhase[] = [];
  for (const p of phases) {
    let phase = await ds.getRepository(RepairPhase).findOne({ where: { tenantId: tenant.id, name: p.name } });
    if (!phase) {
      phase = await ds.getRepository(RepairPhase).save({ ...p, tenantId: tenant.id, isDefault: true });
    }
    savedPhases.push(phase);
  }

  // 5. Clientes demo
  console.log('👥 Seeding clientes demo...');
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
  const savedClients: Client[] = [];
  for (const c of clientsData) {
    let client = await ds.getRepository(Client).findOne({ where: { tenantId: tenant.id, phone: c.phone } });
    if (!client) {
      client = await ds.getRepository(Client).save({ ...c, tenantId: tenant.id });
    }
    savedClients.push(client);
  }

  // 6. Vehículos demo
  console.log('🚙 Seeding vehículos demo...');
  const vehiclesData = [
    { brand: 'Fiat', model: 'Uno', year: 2014, plate: 'AC 234 FG', clientIndex: 0 },
    // { brand: 'Fiat', model: 'Cronos', year: 2021, plate: 'MNO 456', clientIndex: 1 },
    // { brand: 'Toyota', model: 'Hilux', year: 2020, plate: 'AB 123 CD', clientIndex: 2 },
    // { brand: 'Ford', model: 'Ranger', year: 2019, plate: 'EF 456 GH', clientIndex: 3 },
    // { brand: 'Fiat', model: 'Argo', year: 2022, plate: 'IJ 789 KL', clientIndex: 4 },
    // { brand: 'Peugeot', model: '208', year: 2021, plate: 'QR 012 ST', clientIndex: 5 },
    // { brand: 'Volkswagen', model: 'Amarok', year: 2023, plate: 'UV 345 WX', clientIndex: 6 },
    // { brand: 'Chevrolet', model: 'Cruze', year: 2017, plate: 'YZ 678 AB', clientIndex: 7 },
  ];
  const savedVehicles: Vehicle[] = [];
  for (const v of vehiclesData) {
    let vehicle = await ds.getRepository(Vehicle).findOne({ where: { tenantId: tenant.id, plate: v.plate } });
    if (!vehicle) {
      vehicle = await ds.getRepository(Vehicle).save({
        ...v,
        tenantId: tenant.id,
        clientId: savedClients[v.clientIndex].id,
      });
    }
    savedVehicles.push(vehicle);
  }

  // 7. Órdenes demo
  console.log('📋 Seeding órdenes demo...');
  const ordersData = [
    { vehicleIndex: 0, clientIndex: 0, description: 'Cambio de aceite + filtros', totalPrice: 45000, laborCost: 30000, status: WorkOrderStatus.NEW, daysAgo: 0, phaseIndex: 0 },
    // { vehicleIndex: 1, clientIndex: 1, description: 'Cambio de correa de distribución', totalPrice: 120000, laborCost: 85000, status: WorkOrderStatus.PROGRESS, daysAgo: 2, phaseIndex: 2 },
    // { vehicleIndex: 2, clientIndex: 2, description: 'Service completo 50.000km', totalPrice: 85000, laborCost: 45000, status: WorkOrderStatus.PROGRESS, daysAgo: 1, phaseIndex: 3 },
    // { vehicleIndex: 3, clientIndex: 3, description: 'Cambio de pastillas + discos', totalPrice: 95000, laborCost: 35000, status: WorkOrderStatus.DELAYED, daysAgo: 5, phaseIndex: 3 },
    // { vehicleIndex: 4, clientIndex: 4, description: 'Diagnóstico electrónico', totalPrice: 25000, laborCost: 25000, status: WorkOrderStatus.NEW, daysAgo: 0, phaseIndex: 0 },
    // { vehicleIndex: 5, clientIndex: 5, description: 'Reparación de aire acondicionado', totalPrice: 75000, laborCost: 40000, status: WorkOrderStatus.COMPLETED, daysAgo: 3, phaseIndex: 6 },
    // { vehicleIndex: 6, clientIndex: 6, description: 'Alineación y balanceo', totalPrice: 35000, laborCost: 27000, status: WorkOrderStatus.COMPLETED, daysAgo: 4, phaseIndex: 6 },
    // { vehicleIndex: 7, clientIndex: 7, description: 'Cambio de embrague', totalPrice: 180000, laborCost: 80000, status: WorkOrderStatus.PROGRESS, daysAgo: 3, phaseIndex: 4 },
  ];

  const expensesData = [
    [{ description: 'Aceite Castrol 10W40 x4L', cost: 8500 }, { description: 'Filtro de aceite Mann', cost: 3200 }],
    // [{ description: 'Kit distribución Gates', cost: 35000 }],
    // [{ description: 'Kit filtros completo', cost: 18000 }, { description: 'Aceite Shell Helix 5W30 x7L', cost: 12000 }],
    // [{ description: 'Pastillas Ferodo', cost: 22000 }, { description: 'Discos Fremax x2', cost: 38000 }],
    // [],
    // [{ description: 'Gas refrigerante R134a', cost: 12000 }, { description: 'Válvula expansión', cost: 10000 }],
    // [{ description: 'Contrapesos', cost: 3000 }],
    // [{ description: 'Kit embrague Valeo', cost: 55000 }, { description: 'Volante bimasa', cost: 45000 }],
  ];

  for (let i = 0; i < ordersData.length; i++) {
    const od = ordersData[i];
    const trackingCode = nanoid();
    const enteredAt = subDays(new Date(), od.daysAgo);

    const existingOrder = await ds.getRepository(WorkOrder).findOne({
      where: { tenantId: tenant.id, vehicleId: savedVehicles[od.vehicleIndex].id },
    });
    if (existingOrder) { savedVehicles.push(savedVehicles[od.vehicleIndex]); continue; }

    const order = await ds.getRepository(WorkOrder).save({
      tenantId: tenant.id,
      vehicleId: savedVehicles[od.vehicleIndex].id,
      clientId: savedClients[od.clientIndex].id,
      trackingCode,
      description: od.description,
      totalPrice: od.totalPrice,
      laborCost: od.laborCost,
      status: od.status,
      enteredAt,
      completedAt: od.status === WorkOrderStatus.COMPLETED ? new Date() : undefined,
      currentPhaseId: savedPhases[od.phaseIndex]?.id,
    });

    // Phase logs
    for (let j = 0; j <= od.phaseIndex; j++) {
      const isLast = j === od.phaseIndex;
      await ds.getRepository(WorkOrderPhaseLog).save({
        tenantId: tenant.id,
        workOrderId: order.id,
        phaseId: savedPhases[j].id,
        enteredAt: subDays(enteredAt, od.phaseIndex - j),
        completedAt: isLast ? (od.status === WorkOrderStatus.COMPLETED ? new Date() : undefined) : subDays(enteredAt, od.phaseIndex - j - 1),
      });
    }

    // Expenses
    for (const exp of expensesData[i]) {
      await ds.getRepository(Expense).save({ ...exp, tenantId: tenant.id, workOrderId: order.id });
    }
  }

  console.log('✅ Seed completado');
  await ds.destroy();
}

const fresh = process.argv.includes('--fresh');
seed(fresh).catch((err) => { console.error(err); process.exit(1); });
