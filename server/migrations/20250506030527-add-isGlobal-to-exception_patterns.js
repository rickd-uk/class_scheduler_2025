// migrations/20250506030527-add-isGlobal-to-exception_patterns.js
"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    const tableName = "exception_patterns";
    const columnName = "isGlobal";

    try {
      console.log(
        `[Migration 20250506030527] Describing table ${tableName}...`,
      );
      const tableDescription = await queryInterface.describeTable(tableName, {
        transaction,
      });

      if (!tableDescription[columnName]) {
        console.log(
          `[Migration 20250506030527] Column ${columnName} does not exist in ${tableName}. Adding it...`,
        );
        await queryInterface.addColumn(
          tableName,
          columnName,
          {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          { transaction },
        );
        console.log(
          `[Migration 20250506030527] Column ${columnName} added to ${tableName}.`,
        );
      } else {
        console.log(
          `[Migration 20250506030527] Column ${columnName} already exists in ${tableName}. Skipping add.`,
        );
      }

      await transaction.commit();
      console.log("[Migration 20250506030527] Up migration successful.");
    } catch (err) {
      console.error("[Migration 20250506030527] Up migration failed:", err);
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    const tableName = "exception_patterns";
    const columnName = "isGlobal";

    try {
      console.log(
        `[Migration 20250506030527] Attempting to remove column ${columnName} from ${tableName}...`,
      );
      await queryInterface.removeColumn(tableName, columnName, { transaction });
      console.log(
        `[Migration 20250506030527] Column ${columnName} removed from ${tableName} (if it existed).`,
      );

      await transaction.commit();
      console.log("[Migration 20250506030527] Down migration successful.");
    } catch (err) {
      console.error("[Migration 20250506030527] Down migration failed:", err);
      await transaction.rollback();
      throw err;
    }
  },
};
