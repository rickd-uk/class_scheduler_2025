"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Use the same table name as in the createTable migration
    const tableName = "global_settings";
    await queryInterface.addColumn(tableName, "allowRegistration", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  async down(queryInterface, Sequelize) {
    const tableName = "global_settings";
    await queryInterface.removeColumn(tableName, "allowRegistration");
  },
};
