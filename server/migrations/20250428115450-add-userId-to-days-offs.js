'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Use lowercase table name 'daysoffs'
    const tableName = 'daysoffs';
    console.log(`Adding userId column to ${tableName}...`);
    await queryInterface.addColumn(
      tableName, // Use lowercase table name
      'userId',   // The name of the new column
      {
        type: Sequelize.INTEGER,
        allowNull: false, // Make it required
        references: {
          model: 'Users', // Target table name (Sequelize might handle casing here, but 'Users' is conventional)
          key: 'id',      // Target column name
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      }
    );
    console.log(`Adding index on userId for ${tableName}...`);
    // Add index using lowercase table name
    await queryInterface.addIndex(tableName, ['userId']);
    console.log(`Finished adding userId column and index to ${tableName}.`);
  },

  async down (queryInterface, Sequelize) {
    const tableName = 'daysoffs'; // Use lowercase table name
    console.log(`Removing userId index from ${tableName}...`);
    await queryInterface.removeIndex(tableName, ['userId']);
    console.log(`Removing userId column from ${tableName}...`);
    await queryInterface.removeColumn(tableName, 'userId');
    console.log(`Finished removing userId column and index from ${tableName}.`);
  }
};
