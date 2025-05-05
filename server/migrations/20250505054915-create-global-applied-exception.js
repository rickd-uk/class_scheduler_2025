"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableName = "global_applied_exceptions";
    console.log(`Creating table: ${tableName}...`);
    await queryInterface.createTable(tableName, {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      // No userId here
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        unique: true, // Only one global exception per date
      },
      exceptionPatternId: {
        type: Sequelize.INTEGER,
        allowNull: false, // Must link to a pattern
        references: { model: "exception_patterns", key: "id" }, // Link to exception_patterns table
        onUpdate: "CASCADE",
        onDelete: "CASCADE", // If pattern is deleted, remove global application
      },
      reason: {
        // Optional notes specific to this global application
        type: Sequelize.STRING,
        allowNull: true,
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
    // Add index for faster date lookups
    await queryInterface.addIndex(tableName, ["date"], { unique: true });
    console.log(`Finished creating table: ${tableName}.`);
  },
  async down(queryInterface, Sequelize) {
    const tableName = "global_applied_exceptions";
    console.log(`Dropping table: ${tableName}...`);
    await queryInterface.removeIndex(tableName, ["date"]);
    await queryInterface.dropTable(tableName);
    console.log(`Finished dropping table: ${tableName}.`);
  },
};
