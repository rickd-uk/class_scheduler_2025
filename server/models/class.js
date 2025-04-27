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
      // Association to the User who owns the class
      Class.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'teacher' // Optional alias
      });

      // --- Add this association ---
      // Define association here: A Class can belong to many Textbooks through ClassTextbooks
      Class.belongsToMany(models.Textbook, {
        through: 'ClassTextbooks', // The name of the join table
        foreignKey: 'classId',      // The foreign key in the join table that points to Classes
        otherKey: 'textbookId',     // The foreign key in the join table that points to Textbooks
        as: 'textbooks'             // Explicit alias matching the include in classRoutes.js
      });
      // --- End added association ---
    }
  }
  Class.init({
    // Renamed from 'name', stores class number (1-15)
    classNumber: {
      type: DataTypes.STRING, // Keep as STRING for flexibility, validate in route
      allowNull: false
    },
    // Renamed from 'gradeLevel', stores year (1-6)
    yearLevel: {
       type: DataTypes.STRING, // Keep as STRING, validate in route
       allowNull: false // Make year level mandatory
    },
    // 'subject' column is removed
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Class',
  });
  return Class;
};

