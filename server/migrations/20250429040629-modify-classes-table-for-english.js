'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    console.log("Running migration: modify-classes-table-for-english");

    
    // --- Rename 'gradeLevel' to 'yearLevel' ---
    
    // --- Remove the 'subject' column ---
    try {
      console.log("Attempting to remove 'subject' column...");
      await queryInterface.removeColumn('classes', 'subject');
      console.log("Successfully removed 'subject' column.");
    } catch (error) {
       if (error.message.includes('column "subject" does not exist') || error.message.includes("column \"subject\" of relation \"classes\" does not exist")) {
         console.log("Column 'subject' does not exist, likely already removed. Skipping removal.");
      } else {
         console.error("Error removing 'subject' column:", error);
         throw error;
      }
    }
  },

  async down (queryInterface, Sequelize) {
    // Revert the changes - be careful here, ensure the target columns exist before renaming back
    // This down migration might need similar try/catch logic if run against a partially migrated state
    console.log("Running DOWN migration: modify-classes-table-for-english");
    try {
      await queryInterface.addColumn('classes', 'subject', { type: Sequelize.STRING });
    } catch (e) { console.log("Could not add 'subject', maybe exists?"); }
          }
};
