// migrations/YYYYMMDDHHmmss-add-isGlobal-to-exception_patterns.js
"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("exception_patterns", "isGlobal", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("exception_patterns", "isGlobal");
  },
};
