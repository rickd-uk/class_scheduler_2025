    'use strict';
    /** @type {import('sequelize-cli').Migration} */
    module.exports = {
      async up (queryInterface, Sequelize) {
        await queryInterface.addColumn(
          'classes', // Use lowercase table name
          'color',   // New column name
          {
            type: Sequelize.STRING(7), // Store as #RRGGBB hex string
            allowNull: true,
            defaultValue: '#FFFFFF' // Default to white or choose another default
          }
        );
      },

      async down (queryInterface, Sequelize) {
        await queryInterface.removeColumn('classes', 'color');
      }
    };
    
