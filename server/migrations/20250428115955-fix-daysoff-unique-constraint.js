'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Define the table name (lowercase) and constraint names
    const tableName = 'daysoffs'; // <-- Use lowercase table name
    // Constraint names might still use the original casing from definition, check \d output if needed
    // Let's assume the old constraint might not exist after recreating the table
    const oldConstraintName = 'DaysOffs_date_key'; // Keep original case for removal attempt
    const newConstraintName = 'daysoffs_userId_date_unique'; // Use lowercase table name prefix for new constraint

    // 1. Remove the old unique constraint on just the 'date' column (if it exists)
    console.log(`Attempting to remove old constraint: ${oldConstraintName} from table ${tableName}`);
    try {
        // Use the lowercase table name here for removal
        await queryInterface.removeConstraint(tableName, oldConstraintName);
        console.log(`Successfully removed constraint: ${oldConstraintName}`);
    } catch (error) {
        // Log error if constraint doesn't exist, but continue
        console.warn(`Could not remove constraint ${oldConstraintName} from ${tableName} (may not exist):`, error.message);
    }


    // 2. Add the new composite unique constraint on 'userId' and 'date'
    console.log(`Adding new composite constraint: ${newConstraintName} to table ${tableName}`);
    // Use the lowercase table name here
    await queryInterface.addConstraint(tableName, {
      fields: ['userId', 'date'], // Columns included in the constraint
      type: 'unique',
      name: newConstraintName // Specify a name for the constraint
    });
     console.log(`Successfully added constraint: ${newConstraintName}`);
  },

  async down (queryInterface, Sequelize) {
    // Revert the changes: remove composite constraint, (optionally add back single-column constraint)
     const tableName = 'daysoffs'; // <-- Use lowercase table name
     const oldConstraintName = 'DaysOffs_date_key'; // Keep original case for adding back
     const newConstraintName = 'daysoffs_userId_date_unique'; // Use lowercase prefix

     // 1. Remove the composite unique constraint
     console.log(`Removing composite constraint: ${newConstraintName} from table ${tableName}`);
     // Use the lowercase table name here
     await queryInterface.removeConstraint(tableName, newConstraintName);
     console.log(`Successfully removed constraint: ${newConstraintName}`);

     // 2. Add back the original unique constraint on just 'date' (Optional - depends if it was intended)
     // console.log(`Adding back original constraint: ${oldConstraintName} to table ${tableName}`);
     // await queryInterface.addConstraint(tableName, {
     //    fields: ['date'],
     //    type: 'unique',
     //    name: oldConstraintName
     // });
     // console.log(`Successfully added back constraint: ${oldConstraintName}`);
  }
};

