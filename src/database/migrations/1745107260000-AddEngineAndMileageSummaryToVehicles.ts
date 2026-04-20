import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEngineAndMileageSummaryToVehicles1745107260000 implements MigrationInterface {
  name = 'AddEngineAndMileageSummaryToVehicles1745107260000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "engine" character varying`);
    await queryRunner.query(`ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "lastMileage" integer`);
    await queryRunner.query(`ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "lastMileageAt" TIMESTAMPTZ`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "lastMileageAt"`);
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "lastMileage"`);
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "engine"`);
  }
}
