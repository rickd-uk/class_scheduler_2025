// server/models/class.js
'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Class extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Class.belongsTo(models.User, { foreignKey: 'userId', as: 'teacher' });
      Class.belongsToMany(models.Textbook, {
        through: 'ClassTextbooks',
        foreignKey: 'classId',
        otherKey: 'textbookId',
        as: 'textbooks'
      });
    }
  }
  Class.init({
    classNumber: {
      type: DataTypes.STRING,
      allowNull: true // Now nullable for special classes
    },
    yearLevel: {
       type: DataTypes.STRING,
       allowNull: true // Now nullable for special classes
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    // --- Add new fields ---
    classType: {
        type: DataTypes.STRING, // e.g., 'numbered', 'special'
        allowNull: false,
        defaultValue: 'numbered' // Default to numbered
    },
    className: {
        type: DataTypes.STRING, // e.g., 'Global', 'Assembly'
        allowNull: true // Only used for special types
    }
    // --- End new fields ---
  }, {
    sequelize,
    modelName: 'Class',
    tableName: 'classes', // Explicitly use lowercase table name
     indexes: [
       // Optional: Add unique constraint for special class names per user
       // (Ensure migration 'classes_userId_className_unique' exists if using this)
       // {
       //   unique: true,
       //   fields: ['userId', 'className'],
       //   where: { classType: 'special' },
       //   name: 'classes_userId_className_unique'
       // },
       // Optional: Add unique constraint for numbered classes per user
       // {
       //   unique: true,
       //   fields: ['userId', 'yearLevel', 'classNumber'],
       //   where: { classType: 'numbered' },
       //   name: 'classes_userId_year_number_unique'
       // }
     ]
  });
  return Class;
};
