'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Define the table name (lowercase) and constraint names
    const tableName = 'daysoffs'; // <-- Use lowercase table name
    // Constraint names might still use the original casing from definition, check \d output if needed
    const oldConstraintName = 'DaysOffs_date_key';
    const newConstraintName = 'DaysOffs_userId_date_unique';

    // 1. Remove the old unique constraint on just the 'date' column
    console.log(`Removing old constraint: ${oldConstraintName} from table ${tableName}`);
    try {
        // Use the lowercase table name here
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
      name: newConstraintName // Optional: specify a name for the constraint
    });
     console.log(`Successfully added constraint: ${newConstraintName}`);
  },

  async down (queryInterface, Sequelize) {
    // Revert the changes: remove composite constraint, add back single-column constraint
     const tableName = 'daysoffs'; // <-- Use lowercase table name
     const oldConstraintName = 'DaysOffs_date_key';
     const newConstraintName = 'DaysOffs_userId_date_unique';

     // 1. Remove the composite unique constraint
     console.log(`Removing composite constraint: ${newConstraintName} from table ${tableName}`);
     // Use the lowercase table name here
     await queryInterface.removeConstraint(tableName, newConstraintName);
     console.log(`Successfully removed constraint: ${newConstraintName}`);

     // 2. Add back the original unique constraint on just 'date'
     console.log(`Adding back original constraint: ${oldConstraintName} to table ${tableName}`);
     // Use the lowercase table name here
     await queryInterface.addConstraint(tableName, {
        fields: ['date'],
        type: 'unique',
        name: oldConstraintName
     });
     console.log(`Successfully added back constraint: ${oldConstraintName}`);
  }
};

