    'use strict';
    /** @type {import('sequelize-cli').Migration} */
    module.exports = {
      async up (queryInterface, Sequelize) {
        // Rename 'name' to 'classNumber' - Assuming it should store numbers 1-15
        // If it was STRING before, we might keep it as STRING or change to INTEGER
        // Let's keep it flexible with STRING for now, validation will be in the app
        await queryInterface.renameColumn('Classes', 'name', 'classNumber');

        // Rename 'gradeLevel' to 'yearLevel' - storing numbers 1-6
        // Again, keeping as STRING for flexibility, could be INTEGER
        await queryInterface.renameColumn('Classes', 'gradeLevel', 'yearLevel');

        // Remove the 'subject' column
        await queryInterface.removeColumn('Classes', 'subject');
      },

      async down (queryInterface, Sequelize) {
        // Revert the changes: Add 'subject' back, rename columns back
        await queryInterface.addColumn('Classes', 'subject', {
          type: Sequelize.STRING
        });
        await queryInterface.renameColumn('Classes', 'yearLevel', 'gradeLevel');
        await queryInterface.renameColumn('Classes', 'classNumber', 'name');
      }
    };
    
