const mysql = require("mysql2");

class migrationService {
  constructor() {
    this.mysqlConnection = null;
  }

  async connectMySQL() {
    if (this.mysqlConnection && this.mysqlConnection.state === "authenticated") {
      return this.mysqlConnection;
    }
    this.mysqlConnection = mysql.createConnection({
      host: '187.127.142.52',
      port: 3306,
      user: 'root',
      password: 'Zyx098abc',
      database: 'perp2012'
    });

    // this.mysqlConnection = mysql.createConnection({
    //   host: '127.0.0.1',
    //   port: 3306,
    //   user: 'root',
    //   password: '',
    //   database: 'perp2012'
    // });

    return new Promise((resolve, reject) => {
      this.mysqlConnection.connect((err) => {
        if (err) {
          if (err.code === "PROTOCOL_CONNECTION_LOST" ||
            err.code === "ECONNRESET" ||
            err.code === "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR"
          ) {
            console.log("Reconnecting MySQL...");
            this.mysqlConnection = null;
            return resolve(this.connectMySQL());
          }
          reject(err);
        } else {
          console.log("Connected to MySQL successfully");
          this.mysqlConnection.on("error", (error) => {
            console.error("MySQL Error:", error);

            if (
              error.code === "PROTOCOL_CONNECTION_LOST" ||
              error.code === "ECONNRESET" ||
              error.code === "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR"
            ) {
              console.log("MySQL connection lost, reconnecting...");
              this.mysqlConnection = null;
              this.connectMySQL(); // auto reconnect
            }
          });
          resolve(this.mysqlConnection);
        }
      });
    });
  }


  formatDate(dateValue) {
    if (!dateValue) return "";
    try {
      const date = new Date(dateValue);
      return date.toISOString().split("T")[0];
    } catch (error) {
      return "";
    }
  }


  async fetchItemsFromMySQL(fromDate) {
    return new Promise((resolve, reject) => {
      let whereConditions = [];
      let queryParams = [];

      if (fromDate) {
        whereConditions.push(`(ItemCrtDt >= ? OR MstUpdDtTm >= ?)`);
        queryParams.push(fromDate, fromDate);
      }

      whereConditions.push(`ItemTpCd IN ('RM','PM','IM','FG','TR')`);

      const whereClause = whereConditions.length
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      const query = `
      SELECT 
        ItemCd      AS code,
        ItemName    AS name,
        ItemTpCd    AS typeCode,
        ItSubTpCd   AS subtypeCode,
        UomCd       AS buyUnit,
        IssUomCd    AS convertUnit,
        ConvFact    AS convertRate,
        ItemCrtDt   AS creditDate,
        UQCCnvFct   AS uqcConvertRate,
        ItemSymbol  AS itemSymbol,
        GSInd       AS gsind,
        HSNSACCd    AS hsnCode,
        SafetyStk   AS safetyStock,
        ReOrdLvl    AS reorderLevel,
        IsActIng    AS isActive,
        MstUpdDtTm  AS updatedAt
      FROM itemmst 
      ${whereClause}
      ORDER BY ItemCd
    `;

      this.mysqlConnection.query(query, queryParams, (error, results) => {
        if (error) {
          console.error('Error fetching from MySQL:', error);
          reject(error);
        } else {
          console.log(`Fetched ${results.length} records updated/created in last 2 days`);
          resolve(results);
        }
      });
    });
  }

  // async fetchGrnDataFromMySQL(fromDate) {
  //   return new Promise((resolve, reject) => {
  //     let whereClause = '';
  //     let queryParams = [];
  //     if (false && fromDate) {
  //       whereClause = `WHERE g.rdbts >= ?`;
  //       queryParams = [fromDate];
  //     }
  //     const query = `
  //     SELECT 
  //       g.ItemCd AS code,
  //       g.BsRt AS rate,
  //       g.rdbts AS reb_date,
  //       g.TrCurCd AS currency,
  //       g.TrToPrRt AS conversion_factor,
  //       h.IGRt AS gst
  //     FROM grnitbt g
  //     LEFT JOIN HSNMST h ON g.HSNSACCd = h.HSNSACCd
  //     INNER JOIN (
  //       SELECT ItemCd, MAX(rdbts) AS latest_rdbts
  //       FROM grnitbt
  //       GROUP BY ItemCd
  //     ) sub ON g.ItemCd = sub.ItemCd AND g.rdbts = sub.latest_rdbts
  //      ${whereClause}
  //     ORDER BY g.ItemCd;
  //   `;

  //     this.mysqlConnection.query(query, queryParams, (error, results) => {
  //       if (error) {
  //         console.error('Error fetching GRN data from MySQL:', error);
  //         return reject(error);
  //       }
  //       return resolve(results);
  //     });
  //   });
  // }


  async fetchGrnDataFromMySQL(fromDate) {
    return new Promise((resolve, reject) => {
      let whereClause = `WHERE g.TxTpCd = 'GRN'`;
      let queryParams = [];
      if (fromDate) {
        whereClause += ` AND g.rdbts >= ?`;
        queryParams = [fromDate];
      }
      const query = `
      SELECT 
        g.ItemCd AS code,
        g.BsRt AS rate,
        g.rdbts AS reb_date,
        g.TrCurCd AS currency,
        g.TrToPrRt AS conversion_factor,
        g.GrnId,
        g.UnqKey,
        h.IGRt AS gst
      FROM grnitbt g
      LEFT JOIN HSNMST h ON g.HSNSACCd = h.HSNSACCd
      INNER JOIN (
        SELECT ItemCd, MAX(rdbts) AS latest_rdbts
        FROM grnitbt
        WHERE TxTpCd = 'GRN'
        GROUP BY ItemCd
      ) sub ON g.ItemCd = sub.ItemCd AND g.rdbts = sub.latest_rdbts
       ${whereClause}
      ORDER BY g.ItemCd, g.rdbts DESC, g.GrnId DESC, g.UnqKey DESC;
    `;

      this.mysqlConnection.query(query, queryParams, (error, results) => {
        if (error) {
          console.error('Error fetching GRN data from MySQL:', error);
          return reject(error);
        }

        // JS Deduplication to pick absolute latest if timestamps are exactly tied
        const uniqueResults = [];
        const itemMap = new Set();
        for (const row of results) {
          if (!itemMap.has(row.code)) {
            itemMap.add(row.code);
            uniqueResults.push(row);
          }
        }

        return resolve(uniqueResults);
      });
    });
  }



  async fetchBOMFromMySQL(fromDate) {
    return new Promise((resolve, reject) => {
      let whereClause = '';
      let queryParams = [];


      if (fromDate) {
        whereClause = `AND bd.rdbts >= ?`;
        queryParams = [fromDate];
      }

      // Static data for testing purpose
      // whereClause += ` AND bd.OutPrdCd = 'DAX125B:ID:PIN'`;
      const query = `
        SELECT 
          bh.LocCd      AS locCode,
          bd.PrdStgCd   AS stageCode,
          ps.PrdStgDes  AS stageName,

          bd.BopPrdCd   AS bomCode,
          bom.ItemName  AS bomName,
          bom.UomCd     AS bomUom,

          bd.StdBtchQty AS batchQty,

          bd.OutPrdCd   AS fgCode,
          fg.ItemName   AS fgName,
          fg.UomCd      AS fgUom,
          fg.ItSubTpCd  AS fgSubtype,

          bd.ItemSrl    AS itemSrl,
          bd.ItemCd     AS itemCode,
          im.ItemName   AS itemName,
          im.ItemTpCd   AS itemType,
          im.ItSubTpCd  AS subType,
          im.UomCd      AS uom,
          im.IssUomCd   AS issueUom,
          im.ConvFact   AS convFactor,
          im.StndRate   AS stdRate,

          bd.StdOutQty  AS standQty,
          bd.ReqQty     AS requestQty,
          bd.rdbts      AS updatedAt,

          agg.totalReqQty   AS totalReqQty,
          agg.totalStandQty AS totalStandQty

        FROM bomdet bd
        INNER JOIN bophd bh    ON TRIM(bd.BopPrdCd) = TRIM(bh.BopPrdCd) AND (TRIM(bd.LocCd) = TRIM(bh.LocCd) OR IFNULL(TRIM(bd.LocCd), '') = '')
        INNER JOIN itemmst im   ON bd.ItemCd   = im.ItemCd
        LEFT JOIN itemmst bom  ON bd.BopPrdCd = bom.ItemCd
        LEFT JOIN itemmst fg   ON bd.OutPrdCd = fg.ItemCd
        LEFT JOIN pstgmst ps   ON bd.PrdStgCd = ps.PrdStgCd

        LEFT JOIN (
           SELECT
             LocCd,
             ItemCd,
             BopPrdCd,
             SUM(ReqQty)    AS totalReqQty,
             SUM(StdOutQty) AS totalStandQty
             FROM bomdet
             WHERE ReqQty IS NOT NULL
               AND ReqQty > 0
               AND (MNITEMCD IS NULL OR TRIM(MNITEMCD) = '')
           GROUP BY LocCd, ItemCd, BopPrdCd
        ) agg ON bd.ItemCd = agg.ItemCd AND bd.BopPrdCd = agg.BopPrdCd AND TRIM(bd.LocCd) = TRIM(agg.LocCd)

        WHERE bd.ReqQty IS NOT NULL 
          AND bd.ReqQty > 0
          AND (bd.MNITEMCD IS NULL OR TRIM(bd.MNITEMCD) = '')
          ${whereClause}
        ORDER BY bd.BopPrdCd, bh.LocCd, bd.ItemSrl
      `;

      this.mysqlConnection.query(query, queryParams, (error, results) => {
        if (error) {
          console.error('❌ Error fetching BOM data from MySQL:', error);
          reject(error);
        } else {
          const uniqueResults = [];
          const seen = new Set();

          for (const row of results) {
            const uniqueKey = `${row.itemCode}-${row.bomCode}-${row.fgCode}-${row.locCode}`;
            if (!seen.has(uniqueKey)) {
              seen.add(uniqueKey);
              uniqueResults.push(row);
            }
          }

          console.log(`✅ Fetched ${uniqueResults.length} BOM records (last 2 days)`);
          resolve(uniqueResults);
        }
      });
    });
  }

  async fetchBOMCodeMySQL(codes) {
    return new Promise((resolve, reject) => {
      let whereClause = '';
      let queryParams = [];
      if (codes && codes.length > 0) {
        whereClause += ` AND (bd.OutPrdCd IN (?) OR bd.BopPrdCd IN (?))`;
        queryParams.push(codes, codes);
      }
      const query = `
        SELECT 
          bh.LocCd      AS locCode,
          bd.PrdStgCd   AS stageCode,
          ps.PrdStgDes  AS stageName,

          bd.BopPrdCd   AS bomCode,
          bom.ItemName  AS bomName,
          bom.UomCd     AS bomUom,

          bd.StdBtchQty AS batchQty,

          bd.OutPrdCd   AS fgCode,
          fg.ItemName   AS fgName,
          fg.UomCd      AS fgUom,
          fg.ItSubTpCd  AS fgSubtype,

          bd.ItemSrl    AS itemSrl,
          bd.ItemCd     AS itemCode,
          im.ItemName   AS itemName,
          im.ItemTpCd   AS itemType,
          im.ItSubTpCd  AS subType,
          im.UomCd      AS uom,
          im.IssUomCd   AS issueUom,
          im.ConvFact   AS convFactor,
          im.StndRate   AS stdRate,

          bd.StdOutQty  AS standQty,
          bd.ReqQty     AS requestQty,
          bd.rdbts      AS updatedAt,

          agg.totalReqQty   AS totalReqQty,
          agg.totalStandQty AS totalStandQty

        FROM bomdet bd
        INNER JOIN bophd bh    ON TRIM(bd.BopPrdCd) = TRIM(bh.BopPrdCd) AND (TRIM(bd.LocCd) = TRIM(bh.LocCd) OR IFNULL(TRIM(bd.LocCd), '') = '')
        INNER JOIN itemmst im   ON bd.ItemCd   = im.ItemCd
        LEFT JOIN itemmst bom  ON bd.BopPrdCd = bom.ItemCd
        LEFT JOIN itemmst fg   ON bd.OutPrdCd = fg.ItemCd
        LEFT JOIN pstgmst ps   ON bd.PrdStgCd = ps.PrdStgCd

        LEFT JOIN (
           SELECT
             LocCd,
             ItemCd,
             BopPrdCd,
             SUM(ReqQty)    AS totalReqQty,
             SUM(StdOutQty) AS totalStandQty
             FROM bomdet
             WHERE ReqQty IS NOT NULL
               AND ReqQty > 0
               AND (MNITEMCD IS NULL OR TRIM(MNITEMCD) = '')
           GROUP BY LocCd, ItemCd, BopPrdCd
        ) agg ON bd.ItemCd = agg.ItemCd AND bd.BopPrdCd = agg.BopPrdCd AND TRIM(bd.LocCd) = TRIM(agg.LocCd)

        WHERE bd.ReqQty IS NOT NULL 
          AND bd.ReqQty > 0
          AND (bd.MNITEMCD IS NULL OR TRIM(bd.MNITEMCD) = '')
          ${whereClause}
        ORDER BY bd.BopPrdCd, bh.LocCd, bd.ItemSrl
      `;

      this.mysqlConnection.query(query, queryParams, (error, results) => {
        if (error) {
          console.error('❌ Error fetching BOM data from MySQL:', error);
          reject(error);
        } else {
          const uniqueResults = [];
          const seen = new Set();

          for (const row of results) {
            const uniqueKey = `${row.itemCode}-${row.bomCode}-${row.fgCode}-${row.locCode}`;
            if (!seen.has(uniqueKey)) {
              seen.add(uniqueKey);
              uniqueResults.push(row);
            }
          }

          console.log(`✅ Fetched ${uniqueResults.length} BOM records (last 2 days)`);
          resolve(uniqueResults);
        }
      });
    });
  }
}
module.exports = migrationService;