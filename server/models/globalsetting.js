"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class GlobalSetting extends Model {
    static associate(models) {
      // associations can be defined here
    }
  }
  GlobalSetting.init(
    {
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
    },
    {
      sequelize,
      modelName: "GlobalSetting",
      tableName: "global_settings", // Explicit table name
    },
  );
  return GlobalSetting;
};
