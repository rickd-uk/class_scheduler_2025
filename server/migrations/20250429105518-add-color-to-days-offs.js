    'use strict';
    /** @type {import('sequelize-cli').Migration} */
    module.exports = {
      async up (queryInterface, Sequelize) {
        // Use lowercase table name 'daysoffs'
        const tableName = 'daysoffs';
        console.log(`Adding color column to ${tableName}...`);
        await queryInterface.addColumn(
          tableName, // Use lowercase table name
          'color',    // New column name
          {
            type: Sequelize.STRING(7), // Store as #RRGGBB hex string
            allowNull: true,
            defaultValue: '#F0F0F0' // Default to light grey or choose another default
          }
        );
        console.log(`Finished adding color column to ${tableName}.`);
      },

      async down (queryInterface, Sequelize) {
         const tableName = 'daysoffs'; // Use lowercase table name
         console.log(`Removing color column from ${tableName}...`);
         await queryInterface.removeColumn(tableName, 'color');
         console.log(`Finished removing color column from ${tableName}.`);
      }
    };
    
