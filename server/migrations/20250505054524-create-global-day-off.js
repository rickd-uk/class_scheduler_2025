"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableName = "global_days_offs"; // Use snake_case for table name
    console.log(`Creating table: ${tableName}...`);
    await queryInterface.createTable(tableName, {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      date: {
        type: Sequelize.DATEONLY, // Store only the date
        allowNull: false,
        unique: true, // Ensure only one global entry per date
      },
      reason: {
        type: Sequelize.STRING,
        allowNull: true, // Reason is optional
      },
      color: {
        type: Sequelize.STRING(7), // Store as #RRGGBB hex string
        allowNull: true,
        defaultValue: "#E0E0E0", // Default to a different grey for global
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
      // No userId here as it's global
    });
    // Add index for faster date lookups
    await queryInterface.addIndex(tableName, ["date"], { unique: true }); // Ensure index matches unique constraint
    console.log(`Finished creating table: ${tableName}.`);
  },
  async down(queryInterface, Sequelize) {
    const tableName = "global_days_offs";
    console.log(`Dropping table: ${tableName}...`);
    await queryInterface.removeIndex(tableName, ["date"]);
    await queryInterface.dropTable(tableName);
    console.log(`Finished dropping table: ${tableName}.`);
  },
};
