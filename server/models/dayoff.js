    'use strict';
    const {
      Model
    } = require('sequelize');
    module.exports = (sequelize, DataTypes) => {
      class DayOff extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
          // Define association here: A DayOff belongs to a User
          DayOff.belongsTo(models.User, {
             foreignKey: 'userId', // Ensure this matches the key in DayOff.init
             // Optional alias: as: 'user'
          });
        }
      }
      DayOff.init({
        date: {
          type: DataTypes.DATEONLY, // Store only YYYY-MM-DD
          allowNull: false,
        },
        reason: { // Reason is optional
            type: DataTypes.STRING,
            allowNull: true
        },
        // Add userId field definition
        userId: {
          type: DataTypes.INTEGER,
          allowNull: false, // Make it required
          references: { // Define foreign key relationship
              model: 'Users', // Target table name
              key: 'id'       // Target column name
          }
        }
      }, {
        sequelize,
        modelName: 'DayOff',
        // Optional: Add a unique constraint for date+userId if migration didn't handle it fully
        // (The migration 'fix-daysoff-unique-constraint' should have handled this)
        // indexes: [
        //   {
        //     unique: true,
        //     fields: ['userId', 'date'] // Composite unique key
        //   }
        // ]
      });
      return DayOff;
    };
    
