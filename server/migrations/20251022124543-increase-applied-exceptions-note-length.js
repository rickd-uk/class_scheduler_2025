"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Change the 'reason' column to TEXT to allow longer text
    await queryInterface.changeColumn("applied_exceptions", "reason", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert back to VARCHAR(255) if needed
    await queryInterface.changeColumn("applied_exceptions", "reason", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },
};
