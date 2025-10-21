"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameColumn("daysoffs", "start_date", "startDate");
    await queryInterface.renameColumn("daysoffs", "end_date", "endDate");
    await queryInterface.renameColumn("daysoffs", "is_range", "isRange");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.renameColumn("daysoffs", "startDate", "start_date");
    await queryInterface.renameColumn("daysoffs", "endDate", "end_date");
    await queryInterface.renameColumn("daysoffs", "isRange", "is_range");
  },
};
