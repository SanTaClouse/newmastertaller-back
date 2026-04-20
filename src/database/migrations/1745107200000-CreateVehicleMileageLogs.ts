import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVehicleMileageLogs1745107200000 implements MigrationInterface {
  name = 'CreateVehicleMileageLogs1745107200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "vehicle_mileage_logs" (
        "id"           uuid              NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId"     character varying NOT NULL,
        "vehicleId"    character varying NOT NULL,
        "workOrderId"  character varying,
        "mileage"      integer           NOT NULL,
        "recordedAt"   TIMESTAMPTZ       NOT NULL,
        "notes"        text,
        "createdAt"    TIMESTAMPTZ       NOT NULL DEFAULT now(),
        CONSTRAINT "PK_vehicle_mileage_logs" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_vehicle_mileage_logs_tenant_vehicle_date"
        ON "vehicle_mileage_logs" ("tenantId", "vehicleId", "recordedAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_vehicle_mileage_logs_tenant_vehicle_date"`);
    await queryRunner.query(`DROP TABLE "vehicle_mileage_logs"`);
  }
}
