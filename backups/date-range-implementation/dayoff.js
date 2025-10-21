"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class DayOff extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Define association here: A DayOff belongs to a User
      DayOff.belongsTo(models.User, {
        foreignKey: "userId",
      });
    }

    // Instance method to check if a specific date falls within this day off
    includesDate(checkDate) {
      const check = new Date(checkDate);
      const start = new Date(this.start_date || this.date);

      if (this.is_range && this.end_date) {
        const end = new Date(this.end_date);
        return check >= start && check <= end;
      } else {
        return (
          check.toISOString().split("T")[0] ===
          start.toISOString().split("T")[0]
        );
      }
    }

    // Instance method to get number of days
    getDayCount() {
      if (!this.is_range) return 1;

      const start = new Date(this.start_date);
      const end = new Date(this.end_date);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
  }

  DayOff.init(
    {
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      start_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: "Start date for ranges, same as date for single days",
      },
      end_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: "End date for ranges, null for single days",
      },
      is_range: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      reason: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
      },
      color: {
        type: DataTypes.STRING(7),
        allowNull: true,
        defaultValue: "#F0F0F0",
        validate: {
          is: /^#[0-9A-F]{6}$/i,
        },
      },
    },
    {
      sequelize,
      modelName: "DayOff",
      hooks: {
        beforeValidate: (dayOff) => {
          if (dayOff.is_range) {
            // For ranges, set date to start_date
            if (dayOff.start_date) {
              dayOff.date = dayOff.start_date;
            }
            // Validate that end_date is provided and >= start_date
            if (!dayOff.end_date) {
              throw new Error("end_date is required for date ranges");
            }
            if (
              dayOff.start_date &&
              dayOff.end_date &&
              dayOff.end_date < dayOff.start_date
            ) {
              throw new Error(
                "end_date must be greater than or equal to start_date",
              );
            }
          } else {
            // For single days, set start_date to date
            if (dayOff.date) {
              dayOff.start_date = dayOff.date;
              dayOff.end_date = null;
            }
          }
        },
      },
    },
  );

  return DayOff;
};
