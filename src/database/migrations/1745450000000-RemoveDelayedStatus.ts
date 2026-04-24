import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveDelayedStatus1745450000000 implements MigrationInterface {
  name = 'RemoveDelayedStatus1745450000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Convert any 'delayed' orders to 'progress'
    await queryRunner.query(`
      UPDATE work_orders SET status = 'progress' WHERE status = 'delayed'
    `);

    // 2. Create new enum without 'delayed'
    await queryRunner.query(`
      CREATE TYPE work_orders_status_enum_new
        AS ENUM ('new', 'progress', 'completed', 'incomplete', 'retired')
    `);

    // 3. Drop the column default before altering the type — PostgreSQL cannot
    //    automatically cast a DEFAULT expression to the new enum type
    await queryRunner.query(`
      ALTER TABLE work_orders ALTER COLUMN status DROP DEFAULT
    `);

    // 4. Alter the column to use the new enum
    await queryRunner.query(`
      ALTER TABLE work_orders
        ALTER COLUMN status TYPE work_orders_status_enum_new
        USING status::text::work_orders_status_enum_new
    `);

    // 5. Restore the default using the new type
    await queryRunner.query(`
      ALTER TABLE work_orders
        ALTER COLUMN status SET DEFAULT 'new'::work_orders_status_enum_new
    `);

    // 6. Swap enum names
    await queryRunner.query(`DROP TYPE work_orders_status_enum`);
    await queryRunner.query(`
      ALTER TYPE work_orders_status_enum_new RENAME TO work_orders_status_enum
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE work_orders_status_enum_new
        AS ENUM ('new', 'progress', 'delayed', 'completed', 'incomplete', 'retired')
    `);

    await queryRunner.query(`ALTER TABLE work_orders ALTER COLUMN status DROP DEFAULT`);

    await queryRunner.query(`
      ALTER TABLE work_orders
        ALTER COLUMN status TYPE work_orders_status_enum_new
        USING status::text::work_orders_status_enum_new
    `);

    await queryRunner.query(`
      ALTER TABLE work_orders
        ALTER COLUMN status SET DEFAULT 'new'::work_orders_status_enum_new
    `);

    await queryRunner.query(`DROP TYPE work_orders_status_enum`);
    await queryRunner.query(`
      ALTER TYPE work_orders_status_enum_new RENAME TO work_orders_status_enum
    `);
  }
}
