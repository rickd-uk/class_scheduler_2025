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
      // define association here
      Class.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'teacher' // Optional alias
      });
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

