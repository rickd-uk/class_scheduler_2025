'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    const tableName = 'classes'; // Use lowercase table name
    const columnName = 'color';  // Column to add

    try {
      console.log(`[Migration 20250429105517] Describing table ${tableName}...`);
      const tableDescription = await queryInterface.describeTable(tableName, { transaction });

      if (!tableDescription[columnName]) {
        console.log(`[Migration 20250429105517] Column ${columnName} does not exist in ${tableName}. Adding it...`);
        await queryInterface.addColumn(
          tableName,
          columnName,
          {
            type: Sequelize.STRING(7), // Store as #RRGGBB hex string
            allowNull: true,
            defaultValue: '#FFFFFF'    // Default to white or choose another default
          },
          { transaction }
        );
        console.log(`[Migration 20250429105517] Column ${columnName} added to ${tableName}.`);
      } else {
        console.log(`[Migration 20250429105517] Column ${columnName} already exists in ${tableName}. Skipping add.`);
      }

      await transaction.commit();
      console.log("[Migration 20250429105517] Up migration successful.");
    } catch (err) {
      console.error("[Migration 20250429105517] Up migration failed:", err);
      await transaction.rollback();
      throw err;
    }
  },

  async down (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    const tableName = 'classes';
    const columnName = 'color';

    try {
      console.log(`[Migration 20250429105517] Attempting to remove column ${columnName} from ${tableName}...`);
      await queryInterface.removeColumn(tableName, columnName, { transaction });
      console.log(`[Migration 20250429105517] Column ${columnName} removed from ${tableName} (if it existed).`);

      await transaction.commit();
      console.log("[Migration 20250429105517] Down migration successful.");
    } catch (err) {
      console.error("[Migration 20250429105517] Down migration failed:", err);
      await transaction.rollback();
      throw err;
    }
  }
};

