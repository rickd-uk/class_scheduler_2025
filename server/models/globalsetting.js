"use strict";
const { Model } = require("sequelize"); // DataTypes is often destructured here too: const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  // Ensure DataTypes is available
  class GlobalSetting extends Model {
    static associate(models) {
      // associations can be defined here
    }
  }
  GlobalSetting.init(
    {
      // id, createdAt, updatedAt are typically handled by Sequelize automatically if not defined
      // but settingName and settingValue were explicitly in your first migration.
      settingName: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      settingValue: {
        type: DataTypes.JSON,
        allowNull: true, // Or false, based on your initial migration's definition
      },
      applyGlobalDaysOff: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      applyGlobalExceptions: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      allowRegistration: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false, // This matches your latest migration
      },
      weeklyDaysOff: {
        // Use camelCase here for consistency
        type: DataTypes.JSON, // Match the database type
        allowNull: true,
        defaultValue: [], // Default to an empty array
        field: "weekly_days_off", // Explicitly map to the snake_case column name
      },
    },
    {
      sequelize,
      modelName: "GlobalSetting",
      tableName: "global_settings", // Explicitly naming table is good practice
    },
  );
  return GlobalSetting;
};
