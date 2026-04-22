import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDiagnosisToWorkOrders1745280000000 implements MigrationInterface {
  name = 'AddDiagnosisToWorkOrders1745280000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "work_orders" ADD COLUMN IF NOT EXISTS "diagnosis" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "work_orders" DROP COLUMN IF EXISTS "diagnosis"`);
  }
}
