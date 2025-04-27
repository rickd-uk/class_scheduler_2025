'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Textbook extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Define association here: A Textbook can belong to many Classes through ClassTextbooks
      Textbook.belongsToMany(models.Class, {
        through: 'ClassTextbooks', // The name of the join table
        foreignKey: 'textbookId', // The foreign key in the join table that points to Textbooks
        otherKey: 'classId',      // The foreign key in the join table that points to Classes
        as: 'classes'             // Optional alias for the association
      });
    }
  }
  Textbook.init({
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Textbook', // Crucial: Ensure this matches the import capitalization
  });
  return Textbook;
};

