"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class GlobalDayOff extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here if needed in the future
      // e.g., if created by an admin user:
      // GlobalDayOff.belongsTo(models.User, { foreignKey: 'createdByUserId', as: 'creator' });
    }
  }
  GlobalDayOff.init(
    {
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        unique: true,
      },
      reason: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      color: {
        type: DataTypes.STRING(7),
        allowNull: true,
        defaultValue: "#E0E0E0", // Match migration default
        validate: {
          is: /^#[0-9A-F]{6}$/i,
        },
      },
      // No userId here
    },
    {
      sequelize,
      modelName: "GlobalDayOff",
      tableName: "global_days_offs", // Explicit table name
    },
  );
  return GlobalDayOff;
};
