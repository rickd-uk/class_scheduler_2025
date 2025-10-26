"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class GlobalDayOff extends Model {
    static associate(models) {
      // define association here if needed in the future
    }

    // Helper method to check if this day off is a range
    isRangeRecord() {
      return !!(
        this.startDate &&
        this.endDate &&
        this.startDate !== this.endDate
      );
    }

    // Helper method to get all dates in the range
    getDatesInRange() {
      if (!this.isRangeRecord()) {
        return [this.startDate];
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
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: "startDate",
        comment: "Start date (or single date if not a range)",
      },
      endDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: "endDate",
        comment: "End date for date ranges (null for single days)",
      },
      reason: {
        type: DataTypes.TEXT,
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
      tableName: "global_days_offs",
      validate: {
        startBeforeEnd() {
          if (this.startDate && this.endDate && this.startDate > this.endDate) {
            throw new Error("startDate must be on or before endDate");
          }
        },
      },
    },
  );
  return GlobalDayOff;
};
