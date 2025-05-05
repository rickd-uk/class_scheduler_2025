"use strict";
const { Model } = require("sequelize");
const bcrypt = require("bcrypt");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Define associations if needed (e.g., User has many Classes)
      User.hasMany(models.Class, { foreignKey: "userId", as: "classes" });

      User.hasMany(models.DayOff, { foreignKey: "userId" });
      User.hasMany(models.AppliedException, { foreignKey: "userId" });
      User.hasMany(models.ExceptionPattern, { foreignKey: "userId" });
    }

    // Instance method to compare passwords
    async isValidPassword(password) {
      try {
        // Add logging if needed for debugging password comparison
        // console.log(`[User Model] Comparing password for user ID: ${this.id}`);
        const result = await bcrypt.compare(password, this.password);
        // console.log(`[User Model] Password comparison result: ${result}`);
        return result;
      } catch (error) {
        console.error(
          `[User Model] Error comparing password for user ID: ${this.id}`,
          error,
        );
        throw new Error("Error comparing password");
      }
    }
  }
  User.init(
    {
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      // --- Add the missing schedule data field definition ---
      regularScheduleData: {
        type: DataTypes.JSONB, // Match migration type (JSONB is specific to PostgreSQL)
        allowNull: true, // Allow null if no schedule is saved
        defaultValue: null, // Default to null
      },
      isAdmin: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      // --- End added field ---
    },
    {
      sequelize,
      modelName: "User",
      hooks: {
        // Hash password before saving a new user or updating the password
        beforeSave: async (user, options) => {
          if (user.changed("password")) {
            // Only hash if password changed
            console.log(
              `[User Hook - beforeSave] Password changed/new for user: ${user.username}. Attempting hash.`,
            );
            try {
              const salt = await bcrypt.genSalt(10);
              console.log(
                `[User Hook - beforeSave] Salt generated for: ${user.username}`,
              );
              user.password = await bcrypt.hash(user.password, salt);
              console.log(
                `[User Hook - beforeSave] Password successfully hashed for: ${user.username}`,
              );
            } catch (error) {
              console.error(
                `[User Hook - beforeSave] Error hashing password for user ${user.username}:`,
                error,
              );
              throw new Error("Error hashing password during save");
            }
          } else {
            // console.log(`[User Hook - beforeSave] Password not changed for user: ${user.username}. Skipping hash.`);
          }
        },
      },
    },
  );

  // Remove password from default JSON output
  User.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());
    delete values.password;
    // Optionally delete the schedule data if you fetch it separately or want cleaner user objects
    // delete values.regularScheduleData;
    return values;
  };

  return User;
};
