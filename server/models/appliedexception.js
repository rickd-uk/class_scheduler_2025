"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class AppliedException extends Model {
    static associate(models) {
      // Belongs to a User
      AppliedException.belongsTo(models.User, { foreignKey: "userId" });
      // Optionally belongs to an ExceptionPattern
      AppliedException.belongsTo(models.ExceptionPattern, {
        foreignKey: "exceptionPatternId",
      });
    }
  }
  AppliedException.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      exceptionPatternId: {
        type: DataTypes.INTEGER,
        allowNull: true, // Null if isDayOff is true without a pattern
      },
      isDayOff: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      reason: {
        // Reason for the day off or notes for the applied pattern
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "AppliedException",
      tableName: "applied_exceptions", // Explicit table name
      indexes: [
        // Ensure unique constraint matches migration
        { unique: true, fields: ["userId", "date"] },
      ],
    },
  );
  return AppliedException;
};
