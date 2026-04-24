import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveDelayedStatus1745450000000 implements MigrationInterface {
  name = 'RemoveDelayedStatus1745450000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Convert any 'delayed' orders to 'progress' — they were in-progress, just overdue
    await queryRunner.query(`
      UPDATE work_orders SET status = 'progress' WHERE status = 'delayed'
    `);

    // 2. PostgreSQL doesn't support removing enum values directly.
    //    Strategy: create new enum → alter column → drop old enum → rename.
    await queryRunner.query(`
      CREATE TYPE work_orders_status_enum_new
        AS ENUM ('new', 'progress', 'completed', 'incomplete', 'retired')
    `);

    await queryRunner.query(`
      ALTER TABLE work_orders
        ALTER COLUMN status TYPE work_orders_status_enum_new
        USING status::text::work_orders_status_enum_new
    `);

    await queryRunner.query(`DROP TYPE work_orders_status_enum`);

    await queryRunner.query(`
      ALTER TYPE work_orders_status_enum_new RENAME TO work_orders_status_enum
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore 'delayed' value in the enum (data cannot be restored automatically)
    await queryRunner.query(`
      CREATE TYPE work_orders_status_enum_new
        AS ENUM ('new', 'progress', 'delayed', 'completed', 'incomplete', 'retired')
    `);

    await queryRunner.query(`
      ALTER TABLE work_orders
        ALTER COLUMN status TYPE work_orders_status_enum_new
        USING status::text::work_orders_status_enum_new
    `);

    await queryRunner.query(`DROP TYPE work_orders_status_enum`);

    await queryRunner.query(`
      ALTER TYPE work_orders_status_enum_new RENAME TO work_orders_status_enum
    `);
  }
}
