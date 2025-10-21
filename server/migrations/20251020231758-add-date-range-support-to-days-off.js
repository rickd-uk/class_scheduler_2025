"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log("[Migration] Adding date range support to daysoffs table...");

    // Add new columns
    await queryInterface.addColumn("daysoffs", "start_date", {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
    console.log("[Migration] Added start_date column");

    await queryInterface.addColumn("daysoffs", "end_date", {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
    console.log("[Migration] Added end_date column");

    await queryInterface.addColumn("daysoffs", "is_range", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });
    console.log("[Migration] Added is_range column");

    // Populate start_date with existing date values
    await queryInterface.sequelize.query(`
UPDATE daysoffs 
SET start_date = date, is_range = false 
WHERE start_date IS NULL;
`);
    console.log("[Migration] Populated start_date for existing records");

    // Add index for efficient range queries
    await queryInterface.addIndex("daysoffs", ["start_date", "end_date"], {
      name: "idx_daysoffs_date_range",
    });
    console.log("[Migration] Added index for date range queries");

    console.log("[Migration] Date range support added successfully!");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex("daysoffs", "idx_daysoffs_date_range");
    await queryInterface.removeColumn("daysoffs", "is_range");
    await queryInterface.removeColumn("daysoffs", "end_date");
    await queryInterface.removeColumn("daysoffs", "start_date");
  },
};
