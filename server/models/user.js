'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcrypt'); // Import bcrypt

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      // Example: User.hasMany(models.Class, { foreignKey: 'userId' });
    }

    // Instance method to compare passwords
    async isValidPassword(password) {
      try {
        return await bcrypt.compare(password, this.password);
      } catch (error) {
        throw new Error('Error comparing password');
      }
    }
  }
  User.init({
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'User',
    hooks: {
      // Hash password before saving a new user or updating the password
      beforeSave: async (user, options) => {
        if (user.changed('password')) { // Only hash if password changed
          try {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          } catch (error) {
             console.error("Error hashing password:", error);
             throw new Error('Error hashing password'); // Throw error to stop save
          }
        }
      }
    }
  });

  // Remove password from default JSON output
  User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.password;
    return values;
  }

  return User;
};

