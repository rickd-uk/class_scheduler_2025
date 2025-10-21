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
  GlobalDayOff.init(
    {
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        unique: true,
      },
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: "startDate",
        comment: "Start date for date ranges (null for single days)",
      },
      endDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: "endDate",
        comment: "End date for date ranges (null for single days)",
      },
      isRange: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "isRange",
        comment: "Flag indicating if this is a date range or single day",
      },
      reason: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      color: {
        type: DataTypes.STRING(7),
        allowNull: true,
        defaultValue: "#E0E0E0",
        validate: {
          is: /^#[0-9A-F]{6}$/i,
        },
      },
    },
    {
      sequelize,
      modelName: "GlobalDayOff",
      tableName: "global_days_offs", // Explicit table name
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
  return GlobalDayOff;
};
