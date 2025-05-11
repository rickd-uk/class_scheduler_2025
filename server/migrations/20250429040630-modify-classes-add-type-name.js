'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    const tableName = 'classes'; // Use lowercase table name consistent with your logs

    try {
      const tableDescription = await queryInterface.describeTable(tableName, { transaction });

      // 1. Add classType column (if it doesn't exist)
      if (!tableDescription.classType) {
        console.log("Adding classType column...");
        await queryInterface.addColumn(tableName, 'classType', {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'numbered' // Default existing classes to 'numbered'
        }, { transaction });
        console.log("classType column added.");
      } else {
        console.log("classType column already exists. Skipping add.");
      }

      // 2. Add className column (if it doesn't exist)
      if (!tableDescription.className) {
        console.log("Adding className column...");
        await queryInterface.addColumn(tableName, 'className', {
          type: Sequelize.STRING,
          allowNull: true // Allow null for numbered classes
        }, { transaction });
        console.log("className column added.");
      } else {
        console.log("className column already exists. Skipping add.");
      }

      // 3. Modify classNumber column to allow NULL (if not already allowing NULL)
      console.log("Modifying classNumber column to allow NULL (if necessary)...");
      await queryInterface.changeColumn(tableName, 'classNumber', {
        type: Sequelize.STRING, // Ensure type matches existing or intended
        allowNull: true // Allow null for special classes
      }, { transaction });
      console.log("classNumber column modified to allow NULL.");


      // 4. Modify yearLevel column to allow NULL (if not already allowing NULL)
      console.log("Modifying yearLevel column to allow NULL (if necessary)...");
      await queryInterface.changeColumn(tableName, 'yearLevel', {
        type: Sequelize.STRING, // Ensure type matches existing or intended
        allowNull: true // Allow null for special classes
      }, { transaction });
      console.log("yearLevel column modified to allow NULL.");

      // 5. Add unique constraint for special class names per user (if it doesn't exist)
      const constraintName = 'classes_userId_className_unique';
      let constraintExists = false;
      try {
        // Attempt to get existing constraints.
        const allConstraints = await queryInterface.getConstraints(tableName, { transaction });
        constraintExists = allConstraints.some(c => c.constraintName === constraintName && c.constraintType === 'UNIQUE');
        if (constraintExists) { // Ensured clear formatting
            console.log(`Unique constraint ${constraintName} already exists (found via getConstraints). Skipping add.`);
        }
      } catch (e) {
        console.warn(`Could not definitively check for constraint ${constraintName} using getConstraints. Will attempt to add. Error: ${e.message}`);
      }

      if (!constraintExists) {
        console.log(`Adding unique constraint ${constraintName}...`);
        await queryInterface.addConstraint(tableName, { // Options object starts here
          fields: ['userId', 'className'],
          type: 'unique',
          name: constraintName,
          where: {
            classType: 'special' // Apply constraint only for special types
          },
          transaction: transaction // transaction is a property of the options object
        });
        console.log(`Unique constraint ${constraintName} added.`);
      }

      await transaction.commit();
      console.log("Migration 20250429040630 successful.");
    } catch (err) {
      console.error("Migration 20250429040630 failed:", err);
      await transaction.rollback();
      throw err;
    }
  },

  async down (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    const tableName = 'classes'; // Use lowercase table name
    const constraintName = 'classes_userId_className_unique';

    try {
      console.log(`Removing unique constraint ${constraintName} (if it exists)...`);
      await queryInterface.removeConstraint(tableName, constraintName, { transaction });
      console.log(`Unique constraint ${constraintName} removed (if it existed).`);

      console.log("Reverting yearLevel column (setting allowNull to false)...");
      await queryInterface.changeColumn(tableName, 'yearLevel', {
        type: Sequelize.STRING,
        allowNull: false
      }, { transaction });
      console.log("yearLevel column allowNull reverted.");

      console.log("Reverting classNumber column (setting allowNull to false)...");
      await queryInterface.changeColumn(tableName, 'classNumber', {
        type: Sequelize.STRING,
        allowNull: false
      }, { transaction });
      console.log("classNumber column allowNull reverted.");

      console.log("Removing className column (if it exists)...");
      await queryInterface.removeColumn(tableName, 'className', { transaction });
      console.log("className column removed (if it existed).");

      console.log("Removing classType column (if it exists)...");
      await queryInterface.removeColumn(tableName, 'classType', { transaction });
      console.log("classType column removed (if it existed).");

      await transaction.commit();
      console.log("Reversion for 20250429040630 successful.");
    } catch (err) {
      console.error("Reversion for 20250429040630 failed:", err);
      await transaction.rollback();
      throw err;
    }
  }
};

