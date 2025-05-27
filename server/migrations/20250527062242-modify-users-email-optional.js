"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("Users", "email", {
      // Assuming your table is named 'Users'
      type: Sequelize.STRING,
      allowNull: true, // Allow null
      unique: true, // Keep unique constraint if needed
      // The isEmail validation is a model-level validation, not a DB constraint here
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert changes: make email not nullable again
    // Note: If there are users with NULL emails, this revert might fail
    // unless you handle those records first or PostgreSQL version allows it with a default.
    await queryInterface.changeColumn("Users", "email", {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    });
  },
};
