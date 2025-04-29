'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Use lowercase table name 'classes'
    const tableName = 'classes';
    console.log(`Creating table: ${tableName}...`);
    await queryInterface.createTable(tableName, { // Use lowercase table name
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      // This 'name' column will be renamed later by another migration
      name: {
        type: Sequelize.STRING,
        allowNull: false // Original migration likely missed this, but let's keep it consistent with later changes
      },
      // This 'subject' column will be removed later by another migration
      subject: {
        type: Sequelize.STRING
      },
      // This 'gradeLevel' column will be renamed later by another migration
      gradeLevel: {
        type: Sequelize.STRING
      },
      // The userId column definition here was incomplete in your pasted version,
      // ensure it matches the definition from the model/later migrations
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false, // Should be not null
        references: { model: 'Users', key: 'id' }, // Add reference
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
    // Optional: Add indexes if needed (e.g., on userId)
    // await queryInterface.addIndex(tableName, ['userId']);
  },
  async down(queryInterface, Sequelize) {
    // Use lowercase table name 'classes'
    const tableName = 'classes';
    console.log(`Dropping table: ${tableName}...`);
    await queryInterface.dropTable(tableName); // Use lowercase table name
    console.log(`Finished dropping table: ${tableName}.`);
  }
};

