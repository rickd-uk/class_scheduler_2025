"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableName = "global_settings"; // Use snake_case
    console.log(`Creating table: ${tableName}...`);
    await queryInterface.createTable(tableName, {
      id: {
        // Add an ID column even if only one row expected
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      applyGlobalDaysOff: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true, // Default to ON
      },
      applyGlobalExceptions: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true, // Default to ON
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
    console.log(`Finished creating table: ${tableName}.`);
    // --- Seed the single settings row ---
    console.log(`Seeding initial row into ${tableName}...`);
    await queryInterface.bulkInsert(tableName, [
      {
        applyGlobalDaysOff: true,
        applyGlobalExceptions: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    console.log(`Seeding complete.`);
  },
  async down(queryInterface, Sequelize) {
    const tableName = "global_settings";
    console.log(`Dropping table: ${tableName}...`);
    await queryInterface.dropTable(tableName);
    console.log(`Finished dropping table: ${tableName}.`);
  },
};
