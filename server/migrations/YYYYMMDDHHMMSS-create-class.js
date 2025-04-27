'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Classes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      subject: {
        type: Sequelize.STRING
      },
      gradeLevel: {
        type: Sequelize.STRING
      },
      userId: { // Foreign key to link to the user who owns/created the class
        type: Sequelize.INTEGER,
        allowNull: false, // Make it mandatory
        references: {
          model: 'Users', // Name of the target table
          key: 'id',      // Name of the target column
        },
        onUpdate: 'CASCADE', // Optional: If user ID changes, update here
        onDelete: 'CASCADE', // Optional: If user is deleted, delete their classes
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
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Classes');
  }
};

