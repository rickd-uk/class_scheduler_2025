'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    console.log("Running migration: modify-classes-table-for-english");

    // --- Rename 'name' to 'classNumber' ---
    try {
      console.log("Attempting to rename 'name' to 'classNumber'...");
      await queryInterface.renameColumn('classes', 'name', 'classNumber');
      console.log("Successfully renamed 'name' to 'classNumber'.");
    } catch (error) {
      // Check if the error is specifically "column "name" does not exist"
      // Error messages can vary slightly by DB/driver, adjust if needed
      if (error.message.includes('column "name" does not exist') || error.message.includes("column \"name\" of relation \"classes\" does not exist")) {
         console.log("Column 'name' does not exist, likely already renamed to 'classNumber'. Skipping rename.");
      } else {
         console.error("Error renaming 'name' to 'classNumber':", error);
         throw error; // Re-throw unexpected errors
      }
    }

    // --- Rename 'gradeLevel' to 'yearLevel' ---
    try {
      console.log("Attempting to rename 'gradeLevel' to 'yearLevel'...");
      await queryInterface.renameColumn('classes', 'gradeLevel', 'yearLevel');
      console.log("Successfully renamed 'gradeLevel' to 'yearLevel'.");
    } catch (error) {
      if (error.message.includes('column "gradeLevel" does not exist') || error.message.includes("column \"gradeLevel\" of relation \"classes\" does not exist")) {
         console.log("Column 'gradeLevel' does not exist, likely already renamed to 'yearLevel'. Skipping rename.");
      } else {
         console.error("Error renaming 'gradeLevel' to 'yearLevel':", error);
         throw error;
      }
    }

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
    try {
      await queryInterface.renameColumn('classes', 'yearLevel', 'gradeLevel');
    } catch (e) { console.log("Could not rename 'yearLevel', maybe doesn't exist?"); }
    try {
      await queryInterface.renameColumn('classes', 'classNumber', 'name');
    } catch (e) { console.log("Could not rename 'classNumber', maybe doesn't exist?"); }
  }
};
