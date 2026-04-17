const _ = require("lodash");
const moment = require("moment");
const MigrationService = require("../services/migrationService");
const cron = require('node-cron');
const bulk_update_support = require('./bulk_update_support');
const MigrationLog = require("../models/migrationLog");
const BomMaster = require("../models/bom_master");
const Costsheet = require("../models/costsheet");
const Salesheet = require("../models/salesheet");

const migrationService = new MigrationService();
let isMigrationRunning = false;

async function runItemMigration(io) {
  if (isMigrationRunning) {
    throw new Error("Another migration is already running.");
  }
  isMigrationRunning = true;
  try {
    await migrationService.connectMySQL();
    const lastRunDate = await getLastMigrationDate("ITEM");
    const items = await migrationService.fetchItemsFromMySQL(lastRunDate);
    const totalRows = items.length;
    for (let i = 0; i < totalRows; i++) {
      const data = items[i];
      try {
        await bulk_update_support.update_item_data(data);
        const progress = Math.floor(((i + 1) / totalRows) * 99) + 1;
        console.log(`Item Master Progress: ${progress}%`);
        if (io) io.emit('item_upload_progress', progress);
      } catch (error) {
        console.error("❌ Error updating Item data:", error);
      }
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    console.log("✅ Item Master migration completed");
  } finally {
    isMigrationRunning = false;
  }
}

async function runGRNMigration(io) {
  if (isMigrationRunning) {
    throw new Error("Another migration is already running.");
  }
  isMigrationRunning = true;
  try {
    await migrationService.connectMySQL();
    const lastRunDate = await getLastMigrationDate("GRN");
    const grnData = await migrationService.fetchGrnDataFromMySQL(lastRunDate);
    const totalRows = grnData.length;
    console.log(totalRows)

    for (let i = 0; i < totalRows; i++) {
      const data = grnData[i];
      try {
        await bulk_update_support.update_gst_data(data);
        const progress = Math.floor(((i + 1) / totalRows) * 99) + 1;
        console.log(`GRN Master Progress: ${progress}%`);
        if (io) io.emit('grn_upload_progress', progress);
      } catch (error) {
        console.error("❌ Error updating GRN data:", error);
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  } finally {
    isMigrationRunning = false;
  }
}

async function runBOMMigration(io) {
  if (isMigrationRunning) {
    throw new Error("Another migration is already running.");
  }
  isMigrationRunning = true;
  try {
    await migrationService.connectMySQL();
    const lastRunDate = await getLastMigrationDate("BOM");
    const bomRows = await migrationService.fetchBOMFromMySQL(lastRunDate);

    // Group rows by BOM (BomCode + Location)
    const groupedBOMs = _.groupBy(bomRows, (row) => `${row.bomCode}-${row.locCode}`);
    const bomKeys = Object.keys(groupedBOMs);
    const totalBOMs = bomKeys.length;

    console.log(`🚀 Starting BOM Full-Sync for ${totalBOMs} unique BOMs (${bomRows.length} total rows)`);

    for (let i = 0; i < totalBOMs; i++) {
      const key = bomKeys[i];
      const items = groupedBOMs[key];
      const firstItem = items[0];

      try {
        // Step 1: Push new list of ingredients (skip individual cost sheet updates for speed)
        for (const data of items) {
          await bulk_update_support.update_bom_data(data, true); // skipCostSheet = true
        }

        // Step 2: Trigger a SINGLE CostSheet/Price update for this BOM
        await bulk_update_support.update_cost_Sheet(firstItem.bomCode, firstItem.locCode);

        const progress = Math.floor(((i + 1) / totalBOMs) * 99) + 1;
        console.log(`BOM Sync Progress: ${progress}% (BOM: ${firstItem.bomCode} [${firstItem.locCode}])`);
        if (io) io.emit('bom_upload_progress', progress);
      } catch (error) {
        console.error(`❌ Error syncing BOM ${firstItem.bomCode}:`, error);
      }
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    console.log("✅ BOM Master migration completed");
  } finally {
    isMigrationRunning = false;
  }
}

cron.schedule("0 1 * * *", async () => {
  if (isMigrationRunning) {
    console.log("⏳ Skipping cron - another migration already running");
    return;
  }

  try {
    console.log("Before calling runItemMigration");
    await runItemMigration(global.io);
    console.log("After runItemMigration");
    await updateMigrationLog("ITEM", "SUCCESS");
  } catch (err) {
    await updateMigrationLog("ITEM", "FAILED");
    console.error("❌ ITEM migration failed:", err.message);
    // return; // stop chain if ITEM fails
  }

  try {
    await runGRNMigration(global.io);
    await updateMigrationLog("GRN", "SUCCESS");
  } catch (err) {
    await updateMigrationLog("GRN", "FAILED");
    console.error("❌ GRN migration failed:", err.message);
    // return; // stop chain if GRN fails
  }

  try {
    await runBOMMigration(global.io);
    await updateMigrationLog("BOM", "SUCCESS");
  } catch (err) {
    await updateMigrationLog("BOM", "FAILED");
    console.error("❌ BOM migration failed:", err.message);
  }

  console.log("✅ Chained migration completed (ITEM → GRN → BOM)");
});


async function getLastMigrationDate(type) {
  const log = await MigrationLog.findOne({ type }).sort({ lastRunAt: -1 });
  if (!log) {
    return new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
  }
  return log.status === "SUCCESS" ? log.lastRunAt : new Date(log.lastRunAt.getTime() - 10 * 24 * 60 * 60 * 1000);
}


exports.manual_trigger = async (req, res) => {
  var requests = req.bodyParams;
  try {
    if (requests.type === "ITEM") {
      await runItemMigration(global.io);
      await updateMigrationLog("ITEM", "SUCCESS", "Item migration completed successfully");
      return res.apiResponse(true, "Item migration completed successfully");
    } else if (requests.type === "GRN") {
      await runGRNMigration(global.io);
      await updateMigrationLog("GRN", "SUCCESS", "GRN migration completed successfully");
      return res.apiResponse(true, "GRN migration completed successfully");
    } else if (requests.type === "BOM") {
      // await runCleanup(global.io);
      await runBOMMigration(global.io);
      await updateMigrationLog("BOM", "SUCCESS", "BOM migration completed successfully");
      return res.apiResponse(true, "BOM migration completed successfully");
    }
    return res.apiResponse(false, "Invalid type. Must be ITEM, GRN, or BOM.");

  } catch (err) {
    await updateMigrationLog(requests.type, "FAILED", err.message);
    return res.apiResponse(false, `Migration failed: ${err.message}`);
  }
};

// cron.schedule("* * * * *", async () => {
//   try {
//     console.log("Running scheduled bulk percentage update...");

//     let names = true;
//     if (names === true) {
//       names = false;
//       await bulk_update_support.bulk_update_percentage();
//     }

//     console.log("Scheduled bulk percentage update completed.");
//   } catch (err) {
//     console.error("❌ Scheduled bulk percentage update failed:", err.message);
//   }
// });

async function updateMigrationLog(type, status = "SUCCESS") {
  console.log("trigger")
  await MigrationLog.findOneAndUpdate(
    { type },
    { lastRunAt: new Date(), status },
    { upsert: true, new: true }
  );
}

async function runCleanup(io) {
  try {
    await migrationService.connectMySQL();
    const results = await new Promise((resolve, reject) => {
      const query = "SELECT DISTINCT ItemCd FROM bomdet WHERE MNITEMCD IS NOT NULL AND TRIM(MNITEMCD) != ''";
      migrationService.mysqlConnection.query(query, (err, results) => {
        if (err) reject(err);
        else resolve(results.map(r => r.ItemCd));
      });
    });

    const alternateSet = new Set(results);
    console.log(`Found ${alternateSet.size} alternate item codes to remove.`);

    // BomMaster Cleanup
    const boms = await BomMaster.find({});
    let bomsUpdated = 0;
    const affectedBoms = [];

    for (const bom of boms) {
      let modified = false;
      const originalRawCount = bom.bomraw.length;
      bom.bomraw = bom.bomraw.filter(item => !alternateSet.has(item.code));
      if (bom.bomraw.length !== originalRawCount) modified = true;

      if (bom.rawstage) {
        for (const stage of bom.rawstage) {
          const count = stage.ingredients.length;
          stage.ingredients = stage.ingredients.filter(item => !alternateSet.has(item.code));
          if (stage.ingredients.length !== count) modified = true;
        }
      }

      if (bom.packstage) {
        for (const stage of bom.packstage) {
          const count = stage.ingredients.length;
          stage.ingredients = stage.ingredients.filter(item => !alternateSet.has(item.code));
          if (stage.ingredients.length !== count) modified = true;
        }
      }

      if (modified) {
        await BomMaster.updateOne({ _id: bom._id }, {
          $set: {
            bomraw: bom.bomraw,
            rawstage: bom.rawstage,
            packstage: bom.packstage
          }
        });
        bomsUpdated++;
        affectedBoms.push({ code: bom.code, locCd: bom.locCd });
      }
    }

    // Costsheet Cleanup
    const costsheets = await Costsheet.find({});
    let costsheetsUpdated = 0;
    for (const sheet of costsheets) {
      let modified = false;
      const filterArray = (arr) => {
        if (!arr) return arr;
        const startLen = arr.length;
        const newArr = arr.filter(item => !alternateSet.has(item.code));
        if (newArr.length !== startLen) modified = true;
        return newArr;
      };
      sheet.medo_raw = filterArray(sheet.medo_raw);
      sheet.medo_pack = filterArray(sheet.medo_pack);
      sheet.system_raw = filterArray(sheet.system_raw);
      sheet.system_pack = filterArray(sheet.system_pack);

      if (modified) {
        await Costsheet.updateOne({ _id: sheet._id }, {
          $set: {
            medo_raw: sheet.medo_raw,
            medo_pack: sheet.medo_pack,
            system_raw: sheet.system_raw,
            system_pack: sheet.system_pack
          }
        });
        costsheetsUpdated++;
      }
    }

    // Recalculate affected Cost Sheets
    for (const bomInfo of affectedBoms) {
      await bulk_update_support.update_cost_Sheet(bomInfo.code, bomInfo.locCd);
    }

    console.log(`Cleanup completed: ${bomsUpdated} BOMs and ${costsheetsUpdated} Costsheets updated.`);
  } catch (err) {
    console.error("Cleanup failed:", err);
    throw err;
  }
}

exports.migration_log = async (req, res) => {
  try {
    const logs = await MigrationLog.find({});
    // getLastMigration()
    return res.apiResponse(true, "Success", { logs });

  } catch (err) {
    return res.apiResponse(false, err.message);
  }
};

/**
 * One-time migration to backfill locCd for existing BOM, Costsheet, and Salesheet records.
 * Safe: Does NOT delete any data. Only sets locCd on records that don't have it yet.
 */
async function getLastMigration() {
  try {
    await migrationService.connectMySQL();

    // Step 1: Get all unique (BopPrdCd, LocCd) from MySQL
    const mysqlLocData = await new Promise((resolve, reject) => {
      const query = `
        SELECT DISTINCT BopPrdCd AS bomCode, LocCd AS locCode
        FROM bophd
        ORDER BY BopPrdCd, LocCd
      `;
      migrationService.mysqlConnection.query(query, [], (error, results) => {
        if (error) return reject(error);
        resolve(results);
      });
    });

    // Build a map: bomCode -> [locCode1, locCode2, ...]
    const locMap = {};
    for (const row of mysqlLocData) {
      if (!locMap[row.bomCode]) locMap[row.bomCode] = [];
      locMap[row.bomCode].push(row.locCode);
    }

    console.log(`📦 Found ${Object.keys(locMap).length} unique BOM codes with location data from MySQL`);

    // Step 2: Find all BOMs in MongoDB that don't have locCd set
    const bomsWithoutLoc = await BomMaster.find({
      $or: [
        { locCd: { $exists: false } },
        { locCd: null },
        { locCd: '' }
      ]
    });

    console.log(`🔍 Found ${bomsWithoutLoc.length} BOMs without locCd in MongoDB`);

    let bomUpdated = 0;
    for (const bom of bomsWithoutLoc) {
      const locations = locMap[bom.code];
      if (locations && locations.length > 0) {
        // Assign the first location code found for this BOM code
        const locCd = locations[0];
        await BomMaster.findOneAndUpdate(
          { _id: bom._id },
          { $set: { locCd: locCd } }
        );
        bomUpdated++;
        console.log(`✅ BOM ${bom.code} -> locCd: ${locCd}`);
      } else {
        console.log(`⚠️ No MySQL location found for BOM ${bom.code}, skipping`);
      }
    }

    // Step 3: Update Costsheets without locCd by looking up their BOM
    const costsWithoutLoc = await Costsheet.find({
      $or: [
        { locCd: { $exists: false } },
        { locCd: null },
        { locCd: '' }
      ]
    });

    console.log(`🔍 Found ${costsWithoutLoc.length} Costsheets without locCd`);

    let costUpdated = 0;
    for (const cost of costsWithoutLoc) {
      // Find the BOM that this costsheet belongs to (by code/name)
      const bom = await BomMaster.findOne({ code: cost.code });
      if (bom && bom.locCd) {
        await Costsheet.findOneAndUpdate(
          { _id: cost._id },
          { $set: { locCd: bom.locCd } }
        );
        costUpdated++;
        console.log(`✅ Costsheet ${cost.code} (${cost.productcode}) -> locCd: ${bom.locCd}`);
      } else {
        console.log(`⚠️ No BOM/locCd found for Costsheet ${cost.code}, skipping`);
      }
    }

    // Step 4: Update Salesheets without locCd by looking up their Costsheet
    const salesWithoutLoc = await Salesheet.find({
      $or: [
        { locCd: { $exists: false } },
        { locCd: null },
        { locCd: '' }
      ]
    });

    console.log(`🔍 Found ${salesWithoutLoc.length} Salesheets without locCd`);

    let saleUpdated = 0;
    for (const sale of salesWithoutLoc) {
      const cost = await Costsheet.findOne({ productcode: sale.productcode });
      if (cost && cost.locCd) {
        await Salesheet.findOneAndUpdate(
          { _id: sale._id },
          { $set: { locCd: cost.locCd } }
        );
        saleUpdated++;
        console.log(`✅ Salesheet ${sale.productcode} -> locCd: ${cost.locCd}`);
      } else {
        console.log(`⚠️ No Costsheet/locCd found for Salesheet ${sale.productcode}, skipping`);
      }
    }

    const summary = {
      bomsWithoutLoc: bomsWithoutLoc.length,
      bomUpdated,
      costsWithoutLoc: costsWithoutLoc.length,
      costUpdated,
      salesWithoutLoc: salesWithoutLoc.length,
      saleUpdated
    };

    console.log("✅ Backfill locCd completed:", summary);
    // return res.apiResponse(true, "Backfill locCd completed successfully", summary);
  } catch (err) {
    console.error("❌ Backfill locCd failed:", err);
    // return res.apiResponse(false, `Backfill failed: ${err.message}`);
  }

  
};

exports.update_bom_code = async (req, res, next) => {
  try {
    let requests = req.bodyParams;
    await migrationService.connectMySQL();
    const bomRows = await migrationService.fetchBOMCodeMySQL(requests.codes);
    const groupedBOMs = _.groupBy(
      bomRows,
      (row) => `${row.bomCode}-${row.locCode}`
    );

    const bomKeys = Object.keys(groupedBOMs);
    const totalBOMs = bomKeys.length;

    console.log(
      `🚀 Starting BOM Full-Sync for ${totalBOMs} unique BOMs (${bomRows.length} total rows)`
    );

    for (let i = 0; i < totalBOMs; i++) {
      const key = bomKeys[i];
      const items = groupedBOMs[key];
      const firstItem = items[0];

      try {
        for (const data of items) {
          await bulk_update_support.update_bom_data(data, true);
        }
        await bulk_update_support.update_cost_Sheet(
          firstItem.bomCode,
          firstItem.locCode
        );

      } catch (error) {
        console.error(
          `❌ Error syncing BOM ${firstItem.bomCode}:`,
          error
        );
      }
    }
    // ✅ move response here (AFTER loop)
    return res.apiResponse(true, "Costing Sheet Updated Successfully");
  } catch (error) {
    console.error("Error during Costing Sheet operation:", error);
    return res.apiResponse(false, "Error during Costing Sheet update", {
      error: error.message,
    });
  }
}