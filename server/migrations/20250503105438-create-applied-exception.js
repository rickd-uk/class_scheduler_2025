"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    const tableName = "applied_exceptions";
    const constraintName = "applied_exceptions_userId_date_unique";
    // Sequelize often creates an index with a default name for unique constraints,
    // or you might have a specific name for the separate addIndex call.
    // Let's assume the addIndex creates an index named based on columns if not specified.
    // A common default name might be `applied_exceptions_userId_date` or similar.
    // For robustness, we'll check based on the fields.
    const indexFields = ["userId", "date"];
    let indexNameToPossiblyRemoveInDown = null; // Will try to determine this if we add it

    try {
      console.log(
        `[Migration 20250503105438] Starting migration for ${tableName}...`,
      );
      let tableExists = false;
      try {
        await queryInterface.describeTable(tableName, { transaction });
        tableExists = true;
        console.log(
          `[Migration 20250503105438] Table ${tableName} already exists.`,
        );
      } catch (error) {
        // If describeTable throws an error, it usually means the table doesn't exist.
        console.log(
          `[Migration 20250503105438] Table ${tableName} does not exist. Creating it...`,
        );
      }

      if (!tableExists) {
        await queryInterface.createTable(
          tableName,
          {
            id: {
              allowNull: false,
              autoIncrement: true,
              primaryKey: true,
              type: Sequelize.INTEGER,
            },
            userId: {
              type: Sequelize.INTEGER,
              allowNull: false,
              references: { model: "Users", key: "id" },
              onUpdate: "CASCADE",
              onDelete: "CASCADE",
            },
            date: {
              type: Sequelize.DATEONLY,
              allowNull: false,
            },
            exceptionPatternId: {
              type: Sequelize.INTEGER,
              allowNull: true,
              references: { model: "exception_patterns", key: "id" },
              onUpdate: "CASCADE",
              onDelete: "SET NULL",
            },
            isDayOff: {
              type: Sequelize.BOOLEAN,
              allowNull: false,
              defaultValue: false,
            },
            reason: {
              type: Sequelize.STRING,
              allowNull: true,
            },
            createdAt: {
              allowNull: false,
              type: Sequelize.DATE,
              defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
            },
            updatedAt: {
              allowNull: false,
              type: Sequelize.DATE,
              defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
            },
          },
          { transaction },
        );
        console.log(`[Migration 20250503105438] Table ${tableName} created.`);
      }

      // Check and add unique constraint
      let constraintExists = false;
      try {
        const constraints = await queryInterface.showConstraint(tableName, {
          transaction,
        });
        constraintExists = constraints.some(
          (c) =>
            c.constraintName === constraintName &&
            c.constraintType === "UNIQUE",
        );
      } catch (e) {
        console.warn(
          `[Migration 20250503105438] Could not reliably check for constraint ${constraintName}. Error: ${e.message}. Will attempt to add.`,
        );
      }

      if (!constraintExists) {
        console.log(
          `[Migration 20250503105438] Adding unique constraint ${constraintName} to ${tableName}...`,
        );
        await queryInterface.addConstraint(tableName, {
          fields: ["userId", "date"],
          type: "unique",
          name: constraintName,
          transaction,
        });
        console.log(
          `[Migration 20250503105438] Unique constraint ${constraintName} added.`,
        );
      } else {
        console.log(
          `[Migration 20250503105438] Unique constraint ${constraintName} already exists on ${tableName}. Skipping add.`,
        );
      }

      // Check and add index
      // Note: A unique constraint often creates an index automatically.
      // This explicit addIndex might be redundant if the constraint already created a suitable index.
      // However, if you need a non-unique index for performance for other queries, this is where you'd add it.
      // For this specific case, the unique constraint likely suffices.
      // If you still want to ensure an index (even if potentially redundant with unique constraint's index):
      let indexExists = false;
      const indexes = await queryInterface.showIndex(tableName, {
        transaction,
      });
      // Check if an index exists on these specific fields, regardless of its name
      indexExists = indexes.some((idx) => {
        const idxFields = idx.fields
          .map((f) => f.attribute)
          .sort()
          .join(",");
        const targetFields = [...indexFields].sort().join(","); // Ensure same order for comparison
        return idxFields === targetFields && (idx.unique || !idx.unique); // Check if any index (unique or not) on these fields exists
      });
      indexNameToPossiblyRemoveInDown = indexes.find((idx) => {
        const idxFields = idx.fields
          .map((f) => f.attribute)
          .sort()
          .join(",");
        const targetFields = [...indexFields].sort().join(",");
        return idxFields === targetFields;
      })?.name;

      if (!indexExists) {
        console.log(
          `[Migration 20250503105438] Adding index on ${indexFields.join(", ")} to ${tableName}...`,
        );
        // Sequelize will generate a name if not provided, e.g., applied_exceptions_user_id_date
        await queryInterface.addIndex(tableName, indexFields, { transaction });
        // To get the name of the created index if needed for down migration:
        const newIndexes = await queryInterface.showIndex(tableName, {
          transaction,
        });
        const newIdx = newIndexes.find((idx) => {
          const idxFields = idx.fields
            .map((f) => f.attribute)
            .sort()
            .join(",");
          const targetFields = [...indexFields].sort().join(",");
          return idxFields === targetFields;
        });
        if (newIdx) indexNameToPossiblyRemoveInDown = newIdx.name;
        console.log(
          `[Migration 20250503105438] Index on ${indexFields.join(", ")} added (name: ${indexNameToPossiblyRemoveInDown || "auto-generated"}).`,
        );
      } else {
        console.log(
          `[Migration 20250503105438] An index on ${indexFields.join(", ")} already exists on ${tableName} (possibly from unique constraint). Skipping addIndex.`,
        );
      }

      await transaction.commit();
      console.log(
        `[Migration 20250503105438] Up migration for ${tableName} successful.`,
      );
    } catch (err) {
      console.error(
        `[Migration 20250503105438] Up migration for ${tableName} failed:`,
        err,
      );
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    const tableName = "applied_exceptions";
    const constraintName = "applied_exceptions_userId_date_unique";
    const indexFields = ["userId", "date"]; // Fields for the index

    try {
      console.log(
        `[Migration 20250503105438] Reverting migration for ${tableName}...`,
      );

      console.log(
        `[Migration 20250503105438] Removing unique constraint ${constraintName} from ${tableName} (if it exists)...`,
      );
      await queryInterface.removeConstraint(tableName, constraintName, {
        transaction,
      });
      console.log(
        `[Migration 20250503105438] Unique constraint ${constraintName} removed.`,
      );

      // Determine the index name to remove. This can be tricky if it was auto-generated.
      // If you know the specific name used by addIndex (or the one created by the unique constraint), use it.
      // Otherwise, removing by fields is more robust if the removeIndex supports it or if you query for the name.
      // For now, let's assume the index name might be based on the fields if addIndex was called.
      // A common auto-generated name is <tableName>_<field1>_<field2>...
      // Or, if you captured indexNameToPossiblyRemoveInDown in the `up` function and stored it, you could use that.
      // For simplicity, if the index was created by the unique constraint, removing the constraint might also remove the index.
      // If addIndex was called separately, we try to remove it by fields.
      console.log(
        `[Migration 20250503105438] Removing index on ${indexFields.join(", ")} from ${tableName} (if it exists)...`,
      );
      // Note: `removeIndex` by field array might not be supported in all Sequelize versions for all dialects directly.
      // Often, you need the specific index name. If the index was created by the unique constraint,
      // removing the constraint might be enough. If addIndex created a separate one, you'd need its name.
      // We'll attempt to remove by fields, which is a common desire.
      try {
        // Attempt to find the index name first
        const indexes = await queryInterface.showIndex(tableName, {
          transaction,
        });
        const foundIndex = indexes.find((idx) => {
          const idxFields = idx.fields
            .map((f) => f.attribute)
            .sort()
            .join(",");
          const targetFields = [...indexFields].sort().join(",");
          return idxFields === targetFields;
        });
        if (foundIndex) {
          await queryInterface.removeIndex(tableName, foundIndex.name, {
            transaction,
          });
          console.log(
            `[Migration 20250503105438] Index ${foundIndex.name} removed.`,
          );
        } else {
          console.log(
            `[Migration 20250503105438] No specific index found for fields ${indexFields.join(", ")} to remove separately.`,
          );
        }
      } catch (e) {
        console.warn(
          `[Migration 20250503105438] Could not robustly remove index by fields. It might have been removed with the constraint, or you might need to specify the name. Error: ${e.message}`,
        );
      }

      console.log(`[Migration 20250503105438] Dropping table ${tableName}...`);
      await queryInterface.dropTable(tableName, { transaction });
      console.log(`[Migration 20250503105438] Table ${tableName} dropped.`);

      await transaction.commit();
      console.log(
        `[Migration 20250503105438] Down migration for ${tableName} successful.`,
      );
    } catch (err) {
      console.error(
        `[Migration 20250503105438] Down migration for ${tableName} failed:`,
        err,
      );
      await transaction.rollback();
      throw err;
    }
  },
};
