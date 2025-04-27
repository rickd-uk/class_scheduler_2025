    'use strict';
    /** @type {import('sequelize-cli').Migration} */
    module.exports = {
      async up (queryInterface, Sequelize) {
        await queryInterface.addColumn(
          'Users', // Table name
          'regularScheduleData', // New column name
          {
            type: Sequelize.JSONB, // Use JSONB for efficient JSON storage in PostgreSQL
            allowNull: true, // Allow it to be null initially
            defaultValue: null // Or '{}' if you prefer an empty object default
          }
        );
      },

      async down (queryInterface, Sequelize) {
        await queryInterface.removeColumn('Users', 'regularScheduleData');
      }
    };
    
