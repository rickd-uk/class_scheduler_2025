'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Use lowercase table name 'classes'
    const tableName = 'classes';
    console.log(`Creating table: ${tableName} with original columns...`);
    await queryInterface.createTable(tableName, { // Use lowercase table name
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      // --- Use original column names ---
      name: { // This will be renamed to classNumber later
        type: Sequelize.STRING,
        allowNull: false // Make name required
      },
      subject: { // This will be removed later
        type: Sequelize.STRING,
        allowNull: true // Assuming subject was optional
      },
      gradeLevel: { // This will be renamed to yearLevel later
        type: Sequelize.STRING,
        allowNull: false // Assuming gradeLevel was required
      },
      // --- End original column names ---
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false, // Ensure userId is required
        references: { model: 'Users', key: 'id' }, // Add reference to Users table
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') // Add default
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') // Add default
      }
    });
    console.log(`Finished creating table: ${tableName}.`);
    // Optional: Add index on userId for performance
    await queryInterface.addIndex(tableName, ['userId']);
  },
  async down(queryInterface, Sequelize) {
    // Use lowercase table name 'classes'
    const tableName = 'classes';
    console.log(`Dropping table: ${tableName}...`);
    // Remove index first if added
    await queryInterface.removeIndex(tableName, ['userId']);
    await queryInterface.dropTable(tableName); // Use lowercase table name
    console.log(`Finished dropping table: ${tableName}.`);
  }
};

