'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Use lowercase table name 'daysoffs'
    const tableName = 'daysoffs';
    console.log(`Creating table: ${tableName}...`);
    await queryInterface.createTable(tableName, { // Use lowercase table name
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false, // Make date required
        // Remove unique constraint here, will be added per user later
      },
      reason: {
        type: Sequelize.STRING,
        allowNull: true // Reason is optional
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
         defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
         defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
      // userId column will be added in a separate migration
    });
    // Add index on date (non-unique)
    await queryInterface.addIndex(tableName, ['date']);
    console.log(`Finished creating table: ${tableName}.`);
  },
  async down(queryInterface, Sequelize) {
    const tableName = 'daysoffs'; // Use lowercase table name
    console.log(`Dropping table: ${tableName}...`);
    await queryInterface.dropTable(tableName);
    console.log(`Finished dropping table: ${tableName}.`);
  }
};
