'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    const tableName = 'Users'; // Table name
    const columnName = 'regularScheduleData'; // Column to add

    try {
      console.log(`[Migration 20250429040631] Describing table ${tableName}...`);
      const tableDescription = await queryInterface.describeTable(tableName, { transaction });

      if (!tableDescription[columnName]) {
        console.log(`[Migration 20250429040631] Column ${columnName} does not exist in ${tableName}. Adding it...`);
        await queryInterface.addColumn(
          tableName,
          columnName,
          {
            type: Sequelize.JSONB, // Use JSONB for efficient JSON storage in PostgreSQL
            allowNull: true,      // Allow it to be null initially
            defaultValue: null    // Or '{}' if you prefer an empty object default
          },
          { transaction }
        );
        console.log(`[Migration 20250429040631] Column ${columnName} added to ${tableName}.`);
      } else {
        console.log(`[Migration 20250429040631] Column ${columnName} already exists in ${tableName}. Skipping add.`);
      }

      await transaction.commit();
      console.log("[Migration 20250429040631] Up migration successful.");
    } catch (err) {
      console.error("[Migration 20250429040631] Up migration failed:", err);
      await transaction.rollback();
      throw err;
    }
  },

  async down (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    const tableName = 'Users';
    const columnName = 'regularScheduleData';

    try {
      console.log(`[Migration 20250429040631] Attempting to remove column ${columnName} from ${tableName}...`);
      // removeColumn typically doesn't fail if the column is already gone,
      // but it's good practice if the 'up' might have skipped adding it.
      await queryInterface.removeColumn(tableName, columnName, { transaction });
      console.log(`[Migration 20250429040631] Column ${columnName} removed from ${tableName} (if it existed).`);

      await transaction.commit();
      console.log("[Migration 20250429040631] Down migration successful.");
    } catch (err) {
      console.error("[Migration 20250429040631] Down migration failed:", err);
      await transaction.rollback();
      throw err;
    }
  }
};

