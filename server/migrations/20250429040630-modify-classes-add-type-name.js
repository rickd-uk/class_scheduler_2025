    'use strict';
    /** @type {import('sequelize-cli').Migration} */
    module.exports = {
      async up (queryInterface, Sequelize) {
        const transaction = await queryInterface.sequelize.transaction();
        try {
          console.log("Adding classType column...");
          await queryInterface.addColumn('classes', 'classType', { // Use lowercase table name
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 'numbered' // Default existing classes to 'numbered'
          }, { transaction });

          console.log("Adding className column...");
          await queryInterface.addColumn('classes', 'className', { // Use lowercase table name
            type: Sequelize.STRING,
            allowNull: true // Allow null for numbered classes
          }, { transaction });

          console.log("Modifying classNumber column to allow NULL...");
          await queryInterface.changeColumn('classes', 'classNumber', { // Use lowercase table name
             type: Sequelize.STRING,
             allowNull: true // Allow null for special classes
          }, { transaction });

          console.log("Modifying yearLevel column to allow NULL...");
          await queryInterface.changeColumn('classes', 'yearLevel', { // Use lowercase table name
             type: Sequelize.STRING,
             allowNull: true // Allow null for special classes
          }, { transaction });

          // Optional: Add unique constraint for special class names per user
          // Consider potential conflicts if adding later
           console.log("Adding unique constraint for special class names per user...");
           await queryInterface.addConstraint('classes', { // Use lowercase table name
             fields: ['userId', 'className'],
             type: 'unique',
             name: 'classes_userId_className_unique',
             where: {
               classType: 'special' // Apply constraint only for special types
             },
             transaction
           });

          await transaction.commit();
          console.log("Migration successful.");
        } catch (err) {
          console.error("Migration failed:", err);
          await transaction.rollback();
          throw err;
        }
      },

      async down (queryInterface, Sequelize) {
         const transaction = await queryInterface.sequelize.transaction();
         try {
            console.log("Removing unique constraint classes_userId_className_unique...");
            await queryInterface.removeConstraint('classes', 'classes_userId_className_unique', { transaction }); // Use lowercase table name

            console.log("Reverting yearLevel column...");
            await queryInterface.changeColumn('classes', 'yearLevel', { // Use lowercase table name
              type: Sequelize.STRING,
              allowNull: false // Revert back if needed (might fail if nulls exist)
            }, { transaction });

            console.log("Reverting classNumber column...");
            await queryInterface.changeColumn('classes', 'classNumber', { // Use lowercase table name
              type: Sequelize.STRING,
              allowNull: false // Revert back if needed (might fail if nulls exist)
            }, { transaction });

            console.log("Removing className column...");
            await queryInterface.removeColumn('classes', 'className', { transaction }); // Use lowercase table name

            console.log("Removing classType column...");
            await queryInterface.removeColumn('classes', 'classType', { transaction }); // Use lowercase table name

            await transaction.commit();
            console.log("Reversion successful.");
         } catch (err) {
            console.error("Reversion failed:", err);
            await transaction.rollback();
            throw err;
         }
      }
    };
    
