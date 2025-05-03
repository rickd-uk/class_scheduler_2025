    'use strict';
    /** @type {import('sequelize-cli').Migration} */
    module.exports = {
      async up(queryInterface, Sequelize) {
         const tableName = 'applied_exceptions';
        await queryInterface.createTable(tableName, {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER
          },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'Users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          date: {
            type: Sequelize.DATEONLY,
            allowNull: false
          },
          exceptionPatternId: {
            type: Sequelize.INTEGER,
            allowNull: true, // Can be null if it's just a day off override
            references: { model: 'exception_patterns', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL' // Or CASCADE if you want applying exception to delete the pattern
          },
          isDayOff: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false // Default to not being a day off
          },
          reason: { // Reason for the day off override or notes for the pattern application
            type: Sequelize.STRING,
            allowNull: true
          },
          createdAt: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          },
          updatedAt: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          }
        });
        // Ensure a user can only have one entry per date
        await queryInterface.addConstraint(tableName, {
            fields: ['userId', 'date'],
            type: 'unique',
            name: 'applied_exceptions_userId_date_unique'
        });
         await queryInterface.addIndex(tableName, ['userId', 'date']);
      },
      async down(queryInterface, Sequelize) {
         const tableName = 'applied_exceptions';
         await queryInterface.removeConstraint(tableName, 'applied_exceptions_userId_date_unique');
         await queryInterface.removeIndex(tableName, ['userId', 'date']);
         await queryInterface.dropTable(tableName);
      }
    };
    
