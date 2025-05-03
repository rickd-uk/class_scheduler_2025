    'use strict';
    /** @type {import('sequelize-cli').Migration} */
    module.exports = {
      async up(queryInterface, Sequelize) {
        const tableName = 'exception_patterns'; // Use snake_case for table name
        await queryInterface.createTable(tableName, {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER
          },
          name: {
            type: Sequelize.STRING,
            allowNull: false
          },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'Users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          patternData: {
            // Stores the actual pattern, e.g., array of period objects
            // [{ periodNumber: 1, time: "09:00", duration: 45, notes: "Assembly", classId: null }, { periodNumber: 4, ... }]
            type: Sequelize.JSONB,
            allowNull: false
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
        // Add unique constraint for name per user
        await queryInterface.addConstraint(tableName, {
            fields: ['userId', 'name'],
            type: 'unique',
            name: 'exception_patterns_userId_name_unique'
        });
         await queryInterface.addIndex(tableName, ['userId']);
      },
      async down(queryInterface, Sequelize) {
        const tableName = 'exception_patterns';
        await queryInterface.removeConstraint(tableName, 'exception_patterns_userId_name_unique');
        await queryInterface.removeIndex(tableName, ['userId']);
        await queryInterface.dropTable(tableName);
      }
    };
    
