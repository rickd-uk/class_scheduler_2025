    'use strict';
    /** @type {import('sequelize-cli').Migration} */
    module.exports = {
      async up (queryInterface, Sequelize) {
        await queryInterface.addColumn(
          'daysoffs', // Use lowercase table name
          'color',    // New column name
          {
            type: Sequelize.STRING(7), // Store as #RRGGBB hex string
            allowNull: true,
            defaultValue: '#F0F0F0' // Default to light grey or choose another default
          }
        );
      },

      async down (queryInterface, Sequelize) {
         await queryInterface.removeColumn('daysoffs', 'color');
      }
    };
    
