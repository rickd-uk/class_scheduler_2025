"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class GlobalAppliedException extends Model {
    static associate(models) {
      // Belongs to an ExceptionPattern
      GlobalAppliedException.belongsTo(models.ExceptionPattern, {
        foreignKey: "exceptionPatternId",
      });
      // Optional: Link to admin user who created it
      // GlobalAppliedException.belongsTo(models.User, { foreignKey: 'createdByUserId', as: 'creator' });
    }
  }
  GlobalAppliedException.init(
    {
      // No userId
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        unique: true,
      },
      exceptionPatternId: {
        type: DataTypes.INTEGER,
        allowNull: false, // Must link to a pattern
      },
      reason: {
        // Optional notes
        type: DataTypes.STRING,
        allowNull: true,
      },
      // No isDayOff or color needed here, it's purely for applying patterns
    },
    {
      sequelize,
      modelName: "GlobalAppliedException",
      tableName: "global_applied_exceptions", // Explicit table name
    },
  );
  return GlobalAppliedException;
};
