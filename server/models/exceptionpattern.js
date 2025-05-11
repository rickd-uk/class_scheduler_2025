"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ExceptionPattern extends Model {
    static associate(models) {
      // An ExceptionPattern belongs to a User
      ExceptionPattern.belongsTo(models.User, { foreignKey: "userId" });
      // An ExceptionPattern can be applied to many dates (via AppliedException)
      ExceptionPattern.hasMany(models.AppliedException, {
        foreignKey: "exceptionPatternId",
      });
    }
  }
  ExceptionPattern.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      patternData: {
        type: DataTypes.JSONB, // Stores array like [{ periodNumber, time, duration, notes, classId }]
        allowNull: false,
      },
      isGlobal: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "ExceptionPattern",
      tableName: "exception_patterns", // Explicit table name
    },
  );
  return ExceptionPattern;
};
