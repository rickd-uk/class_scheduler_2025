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
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    subject: DataTypes.STRING,
    gradeLevel: DataTypes.STRING,
    userId: { // Ensure this matches the migration
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Class',
  });
  return Class;
};

