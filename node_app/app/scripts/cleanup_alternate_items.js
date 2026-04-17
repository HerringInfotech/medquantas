const mysql = require("mysql2");
const mongoose = require("mongoose");
const path = require("path");
const _ = require("lodash");

// Import models
const BomMaster = require("../models/bom_master");
const Costsheet = require("../models/costsheet");
const { update_cost_Sheet } = require("../controllers/bulk_update_support");

async function cleanup() {
  let mysqlConnection;
  try {
    // 1. Connect to MySQL
    mysqlConnection = mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: '',
      database: 'perp2012'
    });

    const getAlternateItems = () => {
      return new Promise((resolve, reject) => {
        const query = "SELECT DISTINCT ItemCd FROM bomdet WHERE MNITEMCD IS NOT NULL AND TRIM(MNITEMCD) != ''";
        mysqlConnection.query(query, (err, results) => {
          if (err) reject(err);
          else resolve(results.map(r => r.ItemCd));
        });
      });
    };

    const alternateItemCodes = await getAlternateItems();
    console.log(`Found ${alternateItemCodes.length} alternate item codes to remove.`);

    if (alternateItemCodes.length === 0) {
      console.log("No alternate items found. Exiting.");
      process.exit(0);
    }

    const alternateSet = new Set(alternateItemCodes);

    // 2. Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/medopharm', { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Connected to MongoDB");

    // 3. Cleanup BomMaster
    const boms = await BomMaster.find({});
    let bomsUpdated = 0;
    const affectedBoms = [];

    for (const bom of boms) {
      let modified = false;

      // Filter bomraw
      const originalRawCount = bom.bomraw.length;
      bom.bomraw = bom.bomraw.filter(item => !alternateSet.has(item.code));
      if (bom.bomraw.length !== originalRawCount) modified = true;

      // Filter rawstage
      if (bom.rawstage) {
        for (const stage of bom.rawstage) {
          const count = stage.ingredients.length;
          stage.ingredients = stage.ingredients.filter(item => !alternateSet.has(item.code));
          if (stage.ingredients.length !== count) modified = true;
        }
      }

      // Filter packstage
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
    console.log(`Updated ${bomsUpdated} BOMs.`);

    // 4. Cleanup Costsheet
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
    console.log(`Updated ${costsheetsUpdated} Cost Sheets.`);

    // 5. Recalculate affected Cost Sheets
    console.log("Recalculating affected Cost Sheets...");
    for (const bomInfo of affectedBoms) {
      try {
        await update_cost_Sheet(bomInfo.code, bomInfo.locCd);
        console.log(`Recalculated Cost Sheet for BOM: ${bomInfo.code} [${bomInfo.locCd}]`);
      } catch (err) {
        console.error(`Failed to recalculate Cost Sheet for BOM ${bomInfo.code}:`, err.message);
      }
    }

    console.log("Cleanup and recalculation completed successfully.");

  } catch (err) {
    console.error("Cleanup failed:", err);
  } finally {
    if (mysqlConnection) mysqlConnection.end();
    mongoose.connection.close();
    process.exit(0);
  }
}

cleanup();
