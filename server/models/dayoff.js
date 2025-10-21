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

    // Helper method to check if this day off is a range
    isRangeRecord() {
      return !!(this.startDate && this.endDate);
    }

    // Helper method to get all dates in the range
    getDatesInRange() {
      if (!this.isRangeRecord()) {
        return [this.date];
      }

      const dates = [];
      const currentDate = new Date(this.startDate + "T00:00:00Z");
      const end = new Date(this.endDate + "T00:00:00Z");

      while (currentDate <= end) {
        dates.push(currentDate.toISOString().split("T")[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return dates;
    }

    // Helper method to get the number of days in the range
    getDayCount() {
      if (!this.isRangeRecord()) {
        return 1;
      }

      const start = new Date(this.startDate + "T00:00:00Z");
      const end = new Date(this.endDate + "T00:00:00Z");
      const diffTime = Math.abs(end - start);
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
  }
  DayOff.init(
    {
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: "Start date for date ranges (null for single days)",
      },
      endDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: "End date for date ranges (null for single days)",
      },
      isRange: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment:
          "Flag indicating if this is a date range (true) or single day (false)",
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
      tableName: "daysoffs", // CRITICAL: Explicit table name to match your database
      hooks: {
        beforeValidate: (instance, options) => {
          if (instance.startDate && instance.endDate) {
            instance.isRange = true;
            if (!instance.date || instance.date !== instance.startDate) {
              instance.date = instance.startDate;
            }
          } else {
            instance.isRange = false;
          }
        },
      },
      validate: {
        bothDatesOrNeither() {
          if (
            (this.startDate && !this.endDate) ||
            (!this.startDate && this.endDate)
          ) {
            throw new Error(
              "Both startDate and endDate must be provided for a range",
            );
          }
        },
        startBeforeEnd() {
          if (this.startDate && this.endDate && this.startDate > this.endDate) {
            throw new Error("startDate must be on or before endDate");
          }
        },
        dateMatchesStartDate() {
          if (this.startDate && this.date !== this.startDate) {
            throw new Error("date must equal startDate when using date ranges");
          }
        },
      },
    },
  );
  return DayOff;
};
