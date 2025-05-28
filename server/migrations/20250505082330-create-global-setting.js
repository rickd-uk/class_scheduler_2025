"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableName = "global_settings";
    console.log(`Creating table: ${tableName}...`);
    await queryInterface.createTable(tableName, {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      settingName: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        defaultValue: "default", // Provide a default name for the seeded row
      },
      settingValue: {
        type: Sequelize.JSON,
        allowNull: true, // Or false, and provide a default JSON value like '{}'
      },
      applyGlobalDaysOff: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      applyGlobalExceptions: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        // defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"), // Sequelize handles this by default
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        // defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"), // Sequelize handles this by default
      },
    });
    console.log(`Finished creating table: ${tableName}.`);

    // --- Seed the single settings row ---
    // This row will now include settingName and a placeholder for settingValue
    console.log(`Seeding initial row into ${tableName}...`);
    await queryInterface.bulkInsert(tableName, [
      {
        settingName: "default", // Seed with the default name
        settingValue: JSON.stringify({}), // Seed with an empty JSON object or relevant default
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
