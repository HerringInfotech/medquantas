const mongoose = require("mongoose"); // Add at top of file
const { exec } = require("child_process");

const Fgmaster = require("../models/fgmaster");
const _ = require("lodash");
const commonHelper = require("../helpers/commonHelper");
const moment = require("moment");
const path = require("path");
const fs = require("fs");
const mime = require("mime");
const Error = require("../models/error");
const BomType = require("../models/bomtype");
const Costsheet = require("../models/costsheet");
const cron = require("node-cron");
const nodemailers = require("../../config/nodemailer");
const nodemailer = require("nodemailer");
const ExcelJS = require("exceljs");
const { v4: uuidv4 } = require("uuid");
const Customer = require("../models/customer");
const FGtype = require("../models/fgtype");
const Packtype = require("../models/packtype");
const Setting = require("../models/setting");
const Make = require("../models/make");
const ItemMaster = require("../models/item_master");
const Supplier = require("../models/supplier");
const EmailLog = require("../models/EmailLog");
const mailEmail = process.env.MAIL_USER;
const mailPass = process.env.MAIL_PASS;
const { logAction } = require("../helpers/logModel.helper");
const PriceMaster = require("../models/price_master");


const BomMaster = require("../models/bom_master");
const Salesheet = require("../models/salesheet");
const bulk_update_support = require('./bulk_update_support');
const MigrationLog = require("../models/migrationLog");
const ErbBom = require("../models/erb_bom")


function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

exports.generate_code = async (req, res, next) => {
  try {
    const allBrandCodes = await Fgmaster.find({
      brand_code: { $regex: /^[A-Z]+-\d{3}$/ },
    })
      .sort({ brand_code: 1 })
      .select("brand_code");

    if (allBrandCodes.length) {
      const firstCode = allBrandCodes[0].brand_code;
      const prefix = "FG";

      let newBrandCode = "";
      let missingCodeFound = false;

      for (let i = 0; i < allBrandCodes.length; i++) {
        const brandCode = allBrandCodes[i].brand_code;
        if (!brandCode || !brandCode.includes("-")) continue;

        const parts = brandCode.split("-");
        const numPart = parseInt(parts[1], 10);
        if (i + 1 !== numPart) {
          const missing = String(i + 1).padStart(3, "0");
          newBrandCode = `${prefix}-${missing}`;
          missingCodeFound = true;
          break;
        }
      }

      if (!missingCodeFound) {
        const lastCodeParts =
          allBrandCodes[allBrandCodes.length - 1].brand_code.split("-");
        const lastNum = parseInt(lastCodeParts[1], 10);
        const nextNum = String(lastNum + 1).padStart(3, "0");
        newBrandCode = `${prefix}-${nextNum}`;
      }

      return res.apiResponse(true, "Success", { code: newBrandCode });
    } else {
      return res.apiResponse(true, "Success", { code: "BRD-001" });
    }
  } catch (error) {
    console.log("generate_code error:", error);
    return res.apiResponse(false, "Failed to generate brand code", {});
  }
};

exports.brand_code = async (req, res, next) => {
  try {
    var requests = req.bodyParams;
    if (requests.code) {
      var checkbrandcode = await Fgmaster.findOne({ code: requests.code });
    } else {
      var checkbrandcode = false;
    }
    if (checkbrandcode) {
      return res.apiResponse(false, "brand Code Already Exists.");
    } else {
      return res.apiResponse(true);
    }
  } catch (error) {
    console.log("exports.brand_code -> error", error);
    return res.apiResponse(false, "brand_code check failed", {});
  }
};

exports.fG_sapcode = async (req, res, next) => {
  try {
    var requests = req.bodyParams;
    requests = await commonHelper.trimObjc(requests);
    if (requests.code) {
      var checkfgcode = await Fgmaster.findOne({ fg_sapcode: requests.code });
    } else {
      var checkfgcode = false;
    }
    if (checkfgcode) {
      return res.apiResponse(false, "Sap Code Already Exists.");
    } else {
      return res.apiResponse(true);
    }
  } catch (error) {
    console.log("exports.Sap_code -> error", error);
    return res.apiResponse(false, "Sap_code check failed", {});
  }
};

exports.brand_name = async (req, res, next) => {
  try {
    var requests = req.bodyParams;
    if (requests.name) {
      let escapedName = escapeRegExp(requests.name);
      var checkbrandname = await Fgmaster.findOne({
        name: { $regex: new RegExp("^" + escapedName, "i") },
      });
    } else {
      var checkbrandname = false;
    }
    if (checkbrandname) {
      return res.apiResponse(false, "Brand name Already Exists.");
    } else {
      return res.apiResponse(true);
    }
  } catch (error) {
    console.log("exports.brand_name -> error", error);
    return res.apiResponse(false, "brand_name check failed", {});
  }
};

exports.brand_name_suggestions = async (req, res, next) => {
  try {
    const { name } = req.bodyParams;
    if (!name || name.trim() === "") {
      return res.apiResponse(true, "No input", []);
    }

    const escaped = escapeRegExp(name.trim());
    const searchRegex = new RegExp(escaped, "i");

    const fgMatches = await Fgmaster.find({
      $or: [
        { name: { $regex: searchRegex } },
        { brand_code: { $regex: searchRegex } },
      ],
      status: "Active",
    })
      .limit(10)
      .select("_id name pack_id brand_code")
      .lean();

    if (!fgMatches.length) {
      return res.apiResponse(true, "No matches", []);
    }

    const fgIds = fgMatches.map((f) => f._id);

    const bomUsed = await BomMaster.find({
      fg_id: { $in: fgIds },
    })
      .select("fg_id")
      .lean();

    const usedIds = new Set(bomUsed.map((b) => String(b.fg_id)));

    const availableNames = fgMatches.filter((f) => !usedIds.has(String(f._id)));

    return res.apiResponse(true, "Suggestions fetched", availableNames);
  } catch (error) {
    console.error("brand_name_suggestions error:", error);
    return res.apiResponse(false, "Error fetching suggestions", []);
  }
};

exports.get_fg_by_id = async (req, res, next) => {
  try {
    const { id, code } = req.bodyParams || {};

    if ((!id || id.trim() === "") && (!code || code.trim() === "")) {
      return res.apiResponse(false, "FG ID or Code is required");
    }

    let fg;

    if (id && id.trim() !== "") {
      // Find by ID
      fg = await Fgmaster.findById(id).select("_id name pack_id brand_code");
    } else if (code && code.trim() !== "") {
      // Find by Code
      fg = await Fgmaster.findOne({ brand_code: code.trim() }).select(
        "_id name pack_id brand_code"
      );
    }

    if (!fg) {
      return res.apiResponse(false, "FG not found");
    }

    return res.apiResponse(true, "FG fetched", fg);
  } catch (error) {
    console.error("get_fg_by_id error:", error);
    return res.apiResponse(false, "Error fetching FG", null);
  }
};


exports.remove_file_from_folder = async (directory_path) => {
  return new Promise(async function (resolve, reject) {
    try {
      fs.readdir(directory_path, (err, files) => {
        if (err) throw err;
        for (const file of files) {
          fs.unlink(path.join(directory_path, file), (err) => {
            if (err) throw err;
          });
        }
      });
      return resolve({ status: true });
    } catch (error) {
      return reject({ status: false });
    }
  });
};

exports.get_brand = async (req, res, next) => {
  var requests = req.bodyParams;
  var page = requests.page || 1;
  var per_page = requests.per_page || 10;
  var pagination = requests.pagination || "false";
  const match = {};
  var sort = { createdAt: -1 };

  if (requests.sort != "") {
    switch (requests.sort) {
      case "sapcode_asc":
        sort = { fg_sapcode: 1 };
        break;
      case "sapcode_desc":
        sort = { fg_sapcode: -1 };
        break;
      case "code_asc":
        sort = { brand_code: 1 };
        break;
      case "code_desc":
        sort = { brand_code: -1 };
        break;
      case "name_asc":
        sort = { name: 1 };
        break;
      case "name_desc":
        sort = { name: -1 };
        break;
      case "bom_asc":
        sort = { isBom: 1 };
        break;
      case "bom_desc":
        sort = { isBom: -1 };
        break;
      case "costsheet_asc":
        sort = { isSheet: 1 };
        break;
      case "costsheet_desc":
        sort = { isSheet: -1 };
        break;
      default:
    }
  }

  if (requests.search && requests.search !== "") {
    let escapedName = escapeRegExp(requests.search.trim());
    match.$or = [
      { name: { $regex: new RegExp(escapedName, "i") } },
      { brand_code: { $regex: new RegExp("^" + escapedName, "i") } },
    ];
  }

  const options = {
    page: page,
    limit: per_page,
    sort: sort,
    populate: ["Pack_pop"],
  };

  if (typeof requests.id != "undefined" && requests.id != "") {
    match["_id"] = requests.id;
  }
  if (pagination == "true") {
    Fgmaster.paginate(match, options, function (err, brand) {
      return res.apiResponse(true, "Success", { brand });
    });
  } else {
    var brand = await Fgmaster.find(match)
      .sort(sort)
      .populate(options.populate);
    return res.apiResponse(true, "Success", { brand });
  }
};

exports.update_brand = async (req, res, next) => {
  try {
    let requests = req.bodyParams;
    const user = requests.user;

    requests = await commonHelper.trimObjc(requests);

    const isValidObjectId = (id) => {
      return id && mongoose.Types.ObjectId.isValid(id);
    };

    const safeUpdateReference = async (model, id) => {
      if (isValidObjectId(id)) {
        return model
          .findOneAndUpdate({ _id: id }, { $set: { is_deleted: false } })
          .exec();
      }
      return Promise.resolve();
    };

    function capitalizeFirstLetter(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function formatDateIfISO(value) {
      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
      if (typeof value === "string" && isoRegex.test(value)) {
        const date = new Date(value);
        return date.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      }
      return value;
    }

    const excludeFields = [
      "_id",
      "id",
      "__v",
      "createdAt",
      "updatedAt",
      "user",
    ];

    let actionType;
    let logDescription = "";
    let logData = {};

    const nameFilter = {
      name: requests.name,
    };
    if (requests.id && isValidObjectId(requests.id)) {
      nameFilter._id = { $ne: requests.id };
    }

    const existingFgmaster = await Fgmaster.findOne(nameFilter);
    if (existingFgmaster) {
      return res.apiResponse(false, "Fgmaster name already exists.");
    }

    await Promise.all([
      safeUpdateReference(FGtype, requests.type_id),
      safeUpdateReference(Packtype, requests.pack_id),
    ]);

    if (requests.id) {
      if (!isValidObjectId(requests.id)) {
        return res.apiResponse(false, "Invalid Fgmaster ID format");
      }

      if (!requests.brand_code || requests.brand_code.trim() === "") {
        const prefix = requests.name.split(" ")[0].toUpperCase();
        const existingCodes = await Fgmaster.find({
          brand_code: { $regex: `^${prefix}-\\d{3}$` },
        })
          .select("brand_code")
          .sort({ brand_code: 1 });

        let newBrandCode = "";
        let missingCodeFound = false;

        for (let i = 0; i < existingCodes.length; i++) {
          const numericPart = parseInt(
            existingCodes[i].brand_code.split("-")[1],
            10
          );
          if (i + 1 !== numericPart) {
            newBrandCode = `${prefix}-${String(i + 1).padStart(3, "0")}`;
            missingCodeFound = true;
            break;
          }
        }

        if (!missingCodeFound) {
          const lastNumeric = existingCodes.length
            ? parseInt(
              existingCodes[existingCodes.length - 1].brand_code.split(
                "-"
              )[1],
              10
            )
            : 0;
          newBrandCode = `${prefix}-${String(lastNumeric + 1).padStart(
            3,
            "0"
          )}`;
        }

        requests.brand_code = newBrandCode;
      }


      const oldData = await Fgmaster.findOne({ _id: requests.id }).lean();
      if (!oldData) {
        return res.apiResponse(false, "Fgmaster not found");
      }

      const updated = await Fgmaster.findOneAndUpdate(
        { _id: requests.id },
        { $set: requests },
        { new: true }
      ).lean();

      const referenceLookups = {
        type_id: FGtype,
        pack_id: Packtype,
      };

      const updatedFields = [];

      for (const key in requests) {
        if (
          excludeFields.includes(key) ||
          typeof requests[key] === "object" ||
          oldData[key] === requests[key]
        ) {
          continue;
        }

        let fromValue = oldData[key] ?? "";
        let toValue = requests[key];

        // Only lookup references if IDs are valid
        if (referenceLookups[key]) {
          const model = referenceLookups[key];
          const getLabel = async (id) => {
            if (!isValidObjectId(id)) return id;
            const doc = await model.findById(id).lean();
            return (
              doc?.name || doc?.subtype || doc?.sub_type || doc?.title || ""
            );
          };

          [fromValue, toValue] = await Promise.all([
            getLabel(fromValue),
            getLabel(toValue),
          ]);
        }

        updatedFields.push(
          `<b>${capitalizeFirstLetter(
            key.replace("_id", "")
          )}</b>: changed from <b>"${formatDateIfISO(
            fromValue
          )}"</b> to <b>"${formatDateIfISO(toValue)}"</b>`
        );

        logData[key] = {
          from: fromValue,
          to: toValue,
        };
      }

      if (updatedFields.length === 0) {
        logDescription = `Updated "<b>${requests.name}</b>", but no fields changed.`;
      } else {
        logDescription =
          `Updated FG "<b>${requests.name}</b>": ` + updatedFields.join(", ");
      }

      actionType = "update";

      await logAction({
        section: "fg",
        user: user?._id,
        action: actionType,
        description: logDescription,
        data: logData,
      });

      return res.apiResponse(true, "Fgmaster Updated Successfully", {
        brand: updated,
      });
    } else {
      // Create new brand logic remains the same
      const check_brand = await Fgmaster.findOne({
        brand_code: requests.brand_code,
      });

      if (check_brand && check_brand.brand_code) {
        const allBrandCodes = await Fgmaster.find({
          brand_code: check_brand.brand_code,
        })
          .sort({ brand_code: 1 })
          .select("brand_code");

        const prefix = check_brand.brand_code.split("-")[0];
        let missingCodeFound = false;
        let newBrandCode = "";

        for (let i = 0; i < allBrandCodes.length; i++) {
          const numericPart = parseInt(
            allBrandCodes[i].brand_code.split("-")[1],
            10
          );
          if (i + 1 !== numericPart) {
            newBrandCode = `${prefix}-${String(i + 1).padStart(3, "0")}`;
            missingCodeFound = true;
            break;
          }
        }

        if (!missingCodeFound) {
          const lastNumericPart = parseInt(
            allBrandCodes[allBrandCodes.length - 1].brand_code.split("-")[1],
            10
          );
          newBrandCode = `${prefix}-${String(lastNumericPart + 1).padStart(
            3,
            "0"
          )}`;
        }

        return res.apiResponse(true, "success", { code: newBrandCode });
      } else {
        const newBrand = new Fgmaster(requests);
        await newBrand.save();

        logDescription = `Created brand "<b>${requests.name}</b>"`;
        logData = requests;
        actionType = "create";

        await logAction({
          section: "fg",
          user: user?._id,
          action: actionType,
          description: logDescription,
          data: logData,
        });

        return res.apiResponse(true, "Fgmaster Added Successfully");
      }
    }
  } catch (error) {
    console.error("Error in update_brand:", error);
    return res.apiResponse(false, "Error updating Fgmaster: " + error.message);
  }
};

exports.delete_brand = async (req, res, next) => {
  const requests = req.bodyParams;
  const user = requests.user;

  try {
    const brand = await Fgmaster.findOne({ _id: requests.id });

    if (!brand) {
      return res.apiResponse(false, "Fgmaster not found");
    }

    await brand.deleteOne();

    await logAction({
      section: "fg",
      user: user?._id,
      action: "Delete",
      description: `Deleted FG: <b>${brand.name}</b>`,
      data: brand,
    });

    return res.apiResponse(true, "Fgmaster Deleted Successfully");
  } catch (error) {
    console.error(error);
    return res.apiResponse(false, "Error deleting Fgmaster");
  }
};

exports.get_error = async (req, res, next) => {
  var requests = req.bodyParams;
  var page = requests.page || 1;
  var per_page = requests.per_page || 10;
  var pagination = requests.pagination || "false";
  const match = {};
  var sort = { createdAt: 1 };

  if (requests.search && requests.search != "") {
    match.name = { $regex: new RegExp(requests.search, "i") };
  }
  if (requests.sort != "") {
    switch (requests.sort) {
      case "brand_asc":
        sort = { name: 1 };
        break;
      case "brand_desc":
        sort = { name: -1 };
        break;
      default:
    }
  }
  const options = {
    page: page,
    limit: per_page,
    sort: sort,
  };

  if (typeof requests.id != "undefined" && requests.id != "") {
    match["_id"] = requests.id;
  }
  if (pagination == "true") {
    Error.paginate(match, options, function (err, errors) {
      return res.apiResponse(true, "Success", { errors });
    });
  } else {
    var errors = await Error.find(match).sort(sort);
    return res.apiResponse(true, "Success", { errors });
  }
};

exports.get_view = async (req, res, next) => {
  var requests = req.bodyParams;
  var page = requests.page || 1;
  var per_page = requests.per_page || 10;
  var pagination = requests.pagination || "false";
  const match = {};
  var sort = { createdAt: 1 };

  if (requests.search && requests.search != "") {
    match.name = { $regex: new RegExp(requests.search, "i") };
  }
  if (requests.sort != "") {
    switch (requests.sort) {
      case "brand_asc":
        sort = { name: 1 };
        break;
      case "brand_desc":
        sort = { name: -1 };
        break;
      default:
    }
  }
  const options = {
    page: page,
    limit: per_page,
    sort: sort,
  };

  if (typeof requests.id != "undefined" && requests.id != "") {
    match["_id"] = requests.id;
  }
  if (pagination == "true") {
    Error.paginate(match, options, function (err, errors) {
      return res.apiResponse(true, "Success", { errors });
    });
  } else {
    var errors = await Error.find(match).sort(sort);
    return res.apiResponse(true, "Success", { errors });
  }
};

exports.update_bom = async (req, res, next) => {
  try {
    let requests = req.bodyParams;
    const user = requests.user;
    if (requests.id) {
      const updatedBom = await BomMaster.findOneAndUpdate({ _id: requests.id }, { $set: requests }, { new: true }).exec();
      await bulk_update_support.update_sheet_item(updatedBom);

      await logAction({
        section: "bom",
        user: user?._id,
        action: "update",
        description: `Updated BOM: <b>${updatedBom.name}</b> (Code: ${updatedBom.code})`,
        data: requests
      });

      return res.apiResponse(true, "BOM Updated Successfully");
    }
    else {
      const new_bom = new BomMaster(requests);
      await new_bom.save();

      await logAction({
        section: "bom",
        user: user?._id,
        action: "create",
        description: `Created new BOM: <b>${new_bom.name}</b> (Code: ${new_bom.code})`,
        data: requests
      });

      return res.apiResponse(true, "BOM Added Successfully");
    }
  } catch (error) {
    console.error("Error during Bom operation:", error);
    return res.apiResponse(false, "Error during Bom update", {
      error: error.message,
    });
  }
};

exports.get_bom = async (req, res, next) => {
  var requests = req.bodyParams;
  var page = requests.page || 1;
  var per_page = requests.per_page || 10;
  var pagination = requests.pagination || "false";
  const match = {};
  var sort = { createdAt: -1 };
  const fgtype = requests.fgtype || false;

  if (requests.search && requests.search !== "") {
    match.$or = [{ name: { $regex: new RegExp(requests.search.trim(), "i") } }];
  }

  if (requests.searchcode && requests.searchcode !== "") {
    match.$or = [
      { code: { $regex: new RegExp(requests.searchcode.trim(), "i") } },
    ];
  }

  if (requests.searchloc && requests.searchloc !== "") {
    match["locCd"] = { $regex: new RegExp(requests.searchloc.trim(), "i") };
  }
  if (typeof requests.status !== "undefined" && requests.status !== "") {
    if (requests.status === "Declined") {
      match["status"] = { $regex: /Declined/i };
    } else if (requests.status === "Pending") {
      match["status"] = { $regex: /^(Pending|Created)$/i };
    } else {
      match["status"] = requests.status;
    }
  }

  if (requests.sort != "") {
    switch (requests.sort) {
      case "name_asc":
        sort = { name: 1 };
        break;
      case "name_desc":
        sort = { name: -1 };
        break;
      case "code_asc":
        sort = { category_code: 1 };
        break;
      case "code_desc":
        sort = { category_code: -1 };
        break;
      default:
    }
  }

  const options = {
    page: page,
    limit: per_page,
    sort: sort,
    // populate: ['customer_pop', 'pack_pop', 'user_pop']
  };

  if (typeof requests.id != "undefined" && requests.id != "") {
    match["_id"] = requests.id;
  }

  if (typeof requests.customerID != "undefined" && requests.customerID != "") {
    match["customerID"] = requests.customerID;
  }

  if (requests.fgCode && requests.fgCode !== "") {
    match["packstage"] = {
      $elemMatch: { fgCode: { $regex: new RegExp(requests.fgCode.trim(), "i") } }
    };
  }

  if (pagination == "true") {
    BomMaster.paginate(match, options, function (err, boms) {
      return res.apiResponse(true, "Success", { boms });
    });
  } else {
    var boms = await BomMaster.find(match).sort(sort);
    return res.apiResponse(true, "Success", { boms });
  }
};

exports.get_sheet = async (req, res, next) => {
  const requests = req.bodyParams;
  // await updateBomSubtype()
  const page = parseInt(requests.page) || 1;
  const per_page = parseInt(requests.per_page) || 10;
  const pagination = requests.pagination || "false";
  const match = {};
  let sort = { createdAt: -1 };

  if (requests.search && requests.search.trim() !== "") {
    const searchRegex = new RegExp(requests.search.trim(), "i");
    match.name = { $regex: searchRegex };
  }

  if (requests.product && requests.product.trim() !== "") {
    const productRegex = new RegExp(requests.product.trim(), "i");
    match.$or = [
      { productname: { $regex: productRegex } },
      { productcode: { $regex: productRegex } }
    ];
  }

  if (requests.searchcode && requests.searchcode.trim() !== "") {
    const codeRegex = new RegExp(requests.searchcode.trim(), "i");
    match.productcode = { $regex: codeRegex };
  }

  if (requests.bomCode && requests.bomCode.trim() !== "") {
    const codeRegex = new RegExp(requests.bomCode.trim(), "i");
    match.code = { $regex: codeRegex };
  }


  if (requests.searchloc && requests.searchloc.trim() !== "") {
    match.locCd = { $regex: new RegExp(requests.searchloc.trim(), "i") };
  }

  if (typeof requests.status !== "undefined" && requests.status !== "") {
    if (requests.status === "Declined") {
      match.status = { $regex: /Declined/i };
    } else if (requests.status === "Pending") {
      match.status = { $regex: /^(Pending|Created)$/i };
    } else {
      match.status = requests.status;
    }
  }

  if (requests.sort && requests.sort !== "") {
    switch (requests.sort) {
      case "name_asc":
        sort = { name: 1 };
        break;
      case "name_desc":
        sort = { name: -1 };
        break;
    }
  }

  const options = {
    page,
    limit: per_page,
    sort,
  };

  if (requests.id) {
    match._id = requests.id;
  }

  if (pagination === "true") {
    Costsheet.paginate(match, options, (err, sheets) => {
      if (err) {
        console.error("Pagination Error:", err);
        return res.apiResponse(false, "Error fetching sheets", []);
      }
      return res.apiResponse(true, "Success", { sheets });
    });
  } else {
    const sheets = await Costsheet.find(match).sort(sort);
    return res.apiResponse(true, "Success", { sheets });
  }
};

async function updateBomSubtype() {
  try {
    const boms = await BomMaster.find({ "packstage.fgSubtype": { $exists: false } }).exec();
    for (const bom of boms) {
      let modified = false;
      for (let pack of bom.packstage || []) {
        if (!pack.fgSubtype && pack.fgCode) {
          const item = await ItemMaster.findOne({ code: pack.fgCode }).exec();
          if (item && item.subtypeCode) {
            pack.fgSubtype = item.subtypeCode;
            modified = true;
          }
        }
      }
      if (modified) {
        await BomMaster.updateOne({ _id: bom._id }, { $set: { packstage: bom.packstage } });
        await bulk_update_support.update_cost_Sheet(bom.code, bom.locCd);
      }
    }
  } catch (error) {
    console.error("Error updating BOM fgSubtypes:", error);
  }
}

exports.get_unique_locations = async (req, res, next) => {
  try {
    const locations = await BomMaster.distinct("locCd", { locCd: { $ne: null, $ne: "" } });
    return res.apiResponse(true, "Success", { locations: locations.sort() });
  } catch (error) {
    console.error("Error fetching unique locations:", error);
    return res.apiResponse(false, "Error fetching unique locations");
  }
};

exports.get_unique_currencies = async (req, res, next) => {
  try {
    const currencies = await PriceMaster.distinct("currency", {
      currency: { $nin: [null, ""] }
    });

    return res.apiResponse(true, "Success", {
      currencies: currencies.sort()
    });
  } catch (error) {
    console.error("Error fetching unique currencies:", error);
    return res.apiResponse(false, "Error fetching unique currencies");
  }
};

exports.update_sheet = async (req, res, next) => {
  try {
    let requests = req.bodyParams;
    const user = requests.user;
    requests = await commonHelper.trimObjc(requests);
    if (requests.id) {
      const sheet = await Costsheet.findOneAndUpdate({ _id: requests.id }, { "$set": requests }, { new: true }).exec();

      await logAction({
        section: "cost",
        user: user?._id,
        action: "update",
        description: `Updated Cost Sheet: <b>${sheet.productname || sheet.name}</b> (Code: ${sheet.productcode || sheet.code})`,
        data: requests
      });

      return res.apiResponse(true, "Costing Sheet Updated Successfully")
    }
    else {
      const existingSheet = await Costsheet.findOne({ code: requests.code, productcode: requests.productcode, locCd: requests.locCd })
      if (existingSheet) {
        return res.apiResponse(false, "Cost sheet already exist");
      }
      requests.status = 'Pending'
      requests.revision = '1'
      var new_sheet = new Costsheet(requests);
      await new_sheet.save()

      await logAction({
        section: "cost",
        user: user?._id,
        action: "create",
        description: `Created new Cost Sheet: <b>${new_sheet.productname || new_sheet.name}</b> (Code: ${new_sheet.productcode || new_sheet.code})`,
        data: requests
      });

      return res.apiResponse(true, "Costing Sheet Added Successfully")
    }
  } catch (error) {
    console.error("Error during Costing Sheet operation:", error);
    return res.apiResponse(false, "Error during Costing Sheet update", {
      error: error.message,
    });
  }
};

exports.get_report = async (req, res, next) => {
  try {
    const requests = req.bodyParams;
    const page = parseInt(requests.page) || 1;
    const per_page = parseInt(requests.per_page) || 10;
    const pagination = requests.pagination || "false";
    const match = {};

    var sort = { approve_time: -1, sheet_name: 1 };
    match["status"] = "Approved";

    if (
      typeof requests.selectbomtype != "undefined" &&
      requests.selectbomtype != ""
    ) {
      match["sheet_type"] = requests.selectbomtype;
    }

    if (typeof requests.search !== "undefined" && requests.search !== "") {
      const searchRegex = new RegExp(requests.search, "i");
      const customers = await Customer.find({
        name: { $regex: searchRegex },
      }).select("_id");
      const customerIds = customers.map((customer) => customer.id);
      match.$or = [
        { sheet_name: { $regex: searchRegex } },
        { customer_id: { $in: customerIds } },
      ];
    }

    await BomType.findOne({ name: "Brand" });

    const brand_data = await Costsheet.find({ ...match, status: "Approved" })
      .sort({ version: -1 })
      .populate("customer_pop")
      .exec();

    const groupedData = brand_data.reduce((acc, item) => {
      acc[item.bomcode] = acc[item.bomcode] || [];
      acc[item.bomcode].push(item);
      return acc;
    }, {});
    var reports;

    if (pagination !== "true") {
      reports = Object.values(groupedData)
        .map((entry) => entry)
        .sort((a, b) => new Date(b[0].updatedAt) - new Date(a[0].updatedAt));
    } else {
      reports = Object.values(groupedData)
        .map((entry) => entry)
        .sort((a, b) => new Date(b[0].updatedAt) - new Date(a[0].updatedAt));

      const totalItems = reports.length;
      const totalPages = Math.ceil(totalItems / per_page);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      reports = {
        data: reports.slice((page - 1) * per_page, page * per_page),
        hasNextPage,
        hasPrevPage,
        limit: per_page,
        nextPage: hasNextPage ? page + 1 : null,
        page,
        pagingCounter: (page - 1) * per_page + 1,
        prevPage: hasPrevPage ? page - 1 : null,
        totalDocs: totalItems,
        totalPages,
      };
    }

    return res.apiResponse(true, "Success", reports);
  } catch (error) {
    console.error("An error occurred in bom report:", error);
    return res.apiResponse(false, "Error occurred in bom report");
  }
};

async function fetchBomUpdateReport() {
  const since = new Date();
  since.setHours(0, 0, 0, 0); // User asked for Current Date
  const boms = await ErbBom.find({ updatedAt: { $gte: since } }).lean();
  let rows = [];

  for (const bom of boms) {
    const dateStr = moment(bom.updatedAt).format("DD/MM/YYYY");
    rows.push({
      Date: dateStr,
      "BOM Code": bom.bomcode || "",
      "Bom Name": bom.bomname || "",
      "Item Type (RM/PM)": bom.itemType || "",
      "FG Code": bom.fgCode || "",
      "FG Name": bom.fgName || "",
      "Item Code": bom.code || "",
      "Item Name": bom.itemname || "",
      "Requested Qty": bom.requestQty || 0,
    });
  }

  return rows;
}

async function fetchFgOverheadNotUpdatedList() {
  const boms = await BomMaster.find({}).lean();
  const rows = [];

  boms.forEach((bom) => {
    const packStage = Array.isArray(bom.packstage) ? bom.packstage : [];

    // If no specific packings exist, we only check the master BOM record
    if (packStage.length === 0) {
      const fields = {
        batch: bom.batch || '',
        costunit: bom.costunit || '',
        manufacture_qty: bom.manufacture_qty || '',
        manufacture_total: bom.manufacture_total || '',
        manufacture_matval: bom.manufacture_matval || '',
        pack_qty: bom.pack_qty || '',
        pack_total: bom.pack_total || '',
        pack_matval: bom.pack_matval || '',
        analytical_value: bom.analytical_value || '',
        punch_value: bom.punch_value || '',
      };

      const isMissing = Object.values(fields).some((v) =>
        v === undefined || v === null || v === '' || Number(v) === 0
      );

      if (isMissing) {
        rows.push({
          bomCode: bom.code || '',
          bomName: bom.name || '',
          fgCode: '',
          fgName: '',
          ...fields
        });
      }
      return;
    }

    // Process each packing individually (they must have their own data)
    packStage.forEach((pack) => {
      const detail = pack.bomDetail || {};

      const fields = {
        batch: detail.batch || '',
        costunit: detail.costunit || '',
        manufacture_qty: detail.manufacture_qty || '',
        manufacture_total: detail.manufacture_total || '',
        manufacture_matval: detail.manufacture_matval || '',
        pack_qty: detail.pack_qty || '',
        pack_total: detail.pack_total || '',
        pack_matval: detail.pack_matval || '',
        analytical_value: detail.analytical_value || '',
        punch_value: detail.punch_value || '',
      };

      // Check ALL 10 fields for missing values
      const isMissing = Object.values(fields).some((v) =>
        v === undefined || v === null || v === '' || Number(v) === 0
      );

      if (isMissing) {
        rows.push({
          bomCode: bom.code || '',
          bomName: bom.name || '',
          fgCode: pack.fgCode || '',
          fgName: pack.fgName || '',
          ...fields
        });
      }
    });
  });

  return rows;
}

async function fetchCostSheetSummary() {
  const sheets = await Costsheet.find({}).lean();
  return sheets.map((sheet) => {
    const dv = sheet.detailValues || {};
    const pct = sheet.percentage || {};
    const medo = sheet.medquantas || {};
    return {
      fgCode: sheet.productcode || sheet.code || '',
      fgName: sheet.productname || sheet.name || '',
      packingUnit: dv.costunit || '',
      batch: dv.batch || '',
      manufacture_qty: dv.manufacture_qty || '',
      pack_qty: dv.pack_qty || '',
      rm_cost: dv.manufacture_total || '',
      pm_cost: dv.pack_total || '',
      material_cost: pct.materialcost || '',
      conv_cost: pct.convcost || '',
      analytical_cost: dv.analytical_value || '',
      punch_value: dv.punch_value || '',
      freight: pct.freightcost || '',
      api: medo.api || '',
      rate_inr: medo.rupee || '',
      rate_usd: medo.doller || '',
      conversion_rate: medo.convertrate || '',
    };
  });
}

function buildReportHtml(bomUpdateData, fgOverheadData, costSheetData) {
  const formatTable = (rows, columns) => {
    if (!rows.length) return '<p>No rows found</p>';
    let html = '<table border="1" cellpadding="5" cellspacing="0" style="border-collapse:collapse; width:100%; font-size:12px;">';
    html += '<thead><tr>';
    columns.forEach((col) => {
      html += `<th style="background:#4472c4; color:#ffffff;">${col.header}</th>`;
    });
    html += '</tr></thead><tbody>';

    rows.forEach((row) => {
      html += '<tr>';
      columns.forEach((col) => {
        const value = row[col.key] !== undefined ? row[col.key] : '';
        html += `<td>${String(value)}</td>`;
      });
      html += '</tr>';
    });

    html += '</tbody></table>';
    return html;
  };

  const bomColumns = [
    { header: 'BOM Name', key: 'name' },
    { header: 'BOM Code', key: 'code' },
    { header: 'Location', key: 'locCd' },
    { header: 'Batch', key: 'batch' },
    { header: 'Status', key: 'status' },
    { header: 'Updated At', key: 'updatedAt' },
  ];

  const fgColumns = [
    { header: 'BOM Name', key: 'bomName' },
    { header: 'BOM Code', key: 'bomCode' },
    { header: 'FG Code', key: 'fgCode' },
    { header: 'FG Name', key: 'fgName' },
    { header: 'Batch', key: 'batch' },
    { header: 'Manufacture ITC', key: 'manufacture_matval' },
    { header: 'Pack ITC', key: 'pack_matval' },
    { header: 'Analytical Value', key: 'analytical_value' },
    { header: 'Punch Value', key: 'punch_value' },
    { header: 'Reason', key: 'reason' },
  ];

  const costColumns = [
    { header: 'BOM Code', key: 'bomCode' },
    { header: 'FG Code', key: 'fgCode' },
    { header: 'FG Name', key: 'fgName' },
    { header: 'Batch', key: 'batch' },
    { header: 'Yield', key: 'yield' },
    { header: 'Cost Unit', key: 'costunit' },
    { header: 'Manufacture Qty', key: 'manufacture_qty' },
    { header: 'Manufacture Total', key: 'manufacture_total' },
    { header: 'Pack Qty', key: 'pack_qty' },
    { header: 'Pack Total', key: 'pack_total' },
    { header: 'Analytical Value', key: 'analytical_value' },
    { header: 'Punch Value', key: 'punch_value' },
  ];

  const htmlParts = [];
  htmlParts.push('<h2>Daily Costing Reports</h2>');
  htmlParts.push(`<p>Generated on: ${new Date().toLocaleString()}</p>`);

  htmlParts.push('<h3>BOM Update Report (last 24 hours)</h3>');
  htmlParts.push(formatTable(bomUpdateData, bomColumns));

  htmlParts.push('<h3>FG Code-wise Overhead Values Not Updated</h3>');
  htmlParts.push(formatTable(fgOverheadData, fgColumns));

  htmlParts.push('<h3>Cost Sheet Summary</h3>');
  htmlParts.push(formatTable(costSheetData, costColumns));

  return htmlParts.join('<br />');
}

async function createReportWorkbook(bomUpdateData, fgOverheadData, costSheetData) {
  const workbook = new ExcelJS.Workbook();

  const addSheet = (sheetName, rows) => {
    const sheet = workbook.addWorksheet(sheetName);
    if (!rows.length) {
      sheet.addRow(["No data"]);
      return;
    }
    const columns = Object.keys(rows[0]).map((key) => ({ header: key, key, width: 20 }));
    sheet.columns = columns;
    rows.forEach((item) => sheet.addRow(item));
  };

  // ─── Styled FG Overhead Sheet (matches image design) ───
  const addFgOverheadSheet = async (sheetName, rows) => {
    const sheet = workbook.addWorksheet(sheetName);
    const COLS = 14;

    // --- Row 1: Logo & Title Together ---
    const logoPrimary = path.join(__dirname, '../../../public/master-app/assets/images/logo.png');
    const logoFallback = path.join(__dirname, '../../../projects/master-app/src/assets/images/logo.png');
    const logoPath = fs.existsSync(logoPrimary) ? logoPrimary : (fs.existsSync(logoFallback) ? logoFallback : null);

    if (logoPath) {
      const imgId = workbook.addImage({ filename: logoPath, extension: 'png' });
      sheet.addImage(imgId, { tl: { col: 0.3, row: 0.2 }, ext: { width: 100, height: 70 } });
    } else {
      console.warn('[FG Overhead Excel] Logo not found. Tried:', logoPrimary);
    }
    sheet.getRow(1).height = 85;

    // Title in the same row, merged from col 4 to end
    sheet.mergeCells(1, 4, 1, COLS);
    const titleCell = sheet.getCell(1, 4);
    titleCell.value = 'FG Code Wise Overhead Value Not Updated List';
    titleCell.font = { bold: true, size: 16, color: { argb: 'FF000000' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // --- Column Headers (Now in Row 2) ---
    const headers = [
      { header: 'BOP Code', key: 'bomCode', width: 20 },
      { header: 'BOP Name', key: 'bomName', width: 38 },
      { header: 'FG Code', key: 'fgCode', width: 14 },
      { header: 'FG Name', key: 'fgName', width: 38 },
      { header: 'Batch Size', key: 'batch', width: 12 },
      { header: 'Cost Unit', key: 'costunit', width: 12 },
      { header: 'Manufacture Qty', key: 'manufacture_qty', width: 16 },
      { header: 'Manufacture Total', key: 'manufacture_total', width: 18 },
      { header: 'Manufacture ITC', key: 'manufacture_matval', width: 16 },
      { header: 'Pack Qty', key: 'pack_qty', width: 12 },
      { header: 'Pack Total', key: 'pack_total', width: 12 },
      { header: 'Pack ITC', key: 'pack_matval', width: 12 },
      { header: 'Analytical Value', key: 'analytical_value', width: 16 },
      { header: 'Punch Value', key: 'punch_value', width: 14 },
    ];

    sheet.columns = headers.map(h => ({ key: h.key, width: h.width }));

    const headerRow = sheet.getRow(2);
    headers.forEach((h, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = h.header;
      cell.font = { bold: true, color: { argb: 'FF000000' }, size: 10 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDDDDDD' } };
      cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    });
    headerRow.height = 25;

    // --- Data Rows (Start from Row 3) ---
    if (!rows.length) {
      const noDataCell = sheet.getRow(3).getCell(1);
      noDataCell.value = 'No data found';
    } else {
      rows.forEach((row, rowIdx) => {
        const dataRow = sheet.getRow(3 + rowIdx);
        const isAlt = rowIdx % 2 === 1;
        headers.forEach((h, colIdx) => {
          const cell = dataRow.getCell(colIdx + 1);
          cell.value = row[h.key] !== undefined ? row[h.key] : '';
          cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' },
            bottom: { style: 'thin' }, right: { style: 'thin' }
          };
          if (isAlt) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
          }
          cell.alignment = { vertical: 'middle' };
        });
        dataRow.height = 18;
      });
    }
  };

  // ─── Styled Cost Sheet Summary (matches image design) ───
  const addCostSheetSummarySheet = async (sheetName, rows) => {
    const sheet = workbook.addWorksheet(sheetName);
    const CS_COLS = 17;

    // --- Row 1: Logo & Title Together ---
    const logoPrimary = path.join(__dirname, '../../../public/master-app/assets/images/logo.png');
    const logoFallback = path.join(__dirname, '../../../projects/master-app/src/assets/images/logo.png');
    const logoPath = fs.existsSync(logoPrimary) ? logoPrimary : (fs.existsSync(logoFallback) ? logoFallback : null);
    if (logoPath) {
      const imgId = workbook.addImage({ filename: logoPath, extension: 'png' });
      sheet.addImage(imgId, { tl: { col: 0.3, row: 0.2 }, ext: { width: 100, height: 70 } });
    }
    sheet.getRow(1).height = 85;

    sheet.mergeCells(1, 4, 1, CS_COLS);
    const titleCell = sheet.getCell(1, 4);
    titleCell.value = 'Cost Sheet Summary';
    titleCell.font = { bold: true, size: 16, color: { argb: 'FF000000' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // --- Column Headers (Row 2) ---
    const headers = [
      { header: 'FG Code', key: 'fgCode', width: 20 },
      { header: 'FG Name', key: 'fgName', width: 38 },
      { header: 'Packing Unit', key: 'packingUnit', width: 14 },
      { header: 'Batch Size', key: 'batch', width: 12 },
      { header: 'Manufacture Qty', key: 'manufacture_qty', width: 16 },
      { header: 'Packing Qty', key: 'pack_qty', width: 12 },
      { header: 'RM Cost', key: 'rm_cost', width: 13 },
      { header: 'PM Cost', key: 'pm_cost', width: 13 },
      { header: 'Material Cost', key: 'material_cost', width: 14 },
      { header: 'Conv Cost', key: 'conv_cost', width: 13 },
      { header: 'Analytical Cost', key: 'analytical_cost', width: 16 },
      { header: 'Punches', key: 'punch_value', width: 12 },
      { header: 'Freight 2%', key: 'freight', width: 12 },
      { header: 'API', key: 'api', width: 10 },
      { header: 'Rate in INR', key: 'rate_inr', width: 13 },
      { header: 'Rate in USD', key: 'rate_usd', width: 13 },
      { header: 'Conversion Rate', key: 'conversion_rate', width: 16 },
    ];

    sheet.columns = headers.map(h => ({ key: h.key, width: h.width }));

    const headerRow = sheet.getRow(2);
    headers.forEach((h, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = h.header;
      cell.font = { bold: true, color: { argb: 'FF000000' }, size: 10 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDDDDDD' } };
      cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    });
    headerRow.height = 25;

    // --- Data Rows (from Row 3) ---
    if (!rows.length) {
      sheet.getRow(3).getCell(1).value = 'No data found';
    } else {
      let totals = {
        rm_cost: 0, pm_cost: 0, material_cost: 0, conv_cost: 0,
        analytical_cost: 0, rate_inr: 0, rate_usd: 0
      };

      rows.forEach((row, rowIdx) => {
        const dataRow = sheet.getRow(3 + rowIdx);
        const isAlt = rowIdx % 2 === 1;
        headers.forEach((h, colIdx) => {
          const cell = dataRow.getCell(colIdx + 1);
          const val = row[h.key];
          cell.value = val !== undefined ? val : '';

          // Accumulate totals for numeric columns
          if (totals.hasOwnProperty(h.key) && !isNaN(parseFloat(val))) {
            totals[h.key] += parseFloat(val);
          }

          cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' },
            bottom: { style: 'thin' }, right: { style: 'thin' }
          };
          if (isAlt) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
          }
          cell.alignment = { vertical: 'middle' };
        });
        dataRow.height = 18;
      });

      // --- Add Overall Total Row ---
      const totalRowIdx = 3 + rows.length;
      const totalRow = sheet.getRow(totalRowIdx);
      totalRow.height = 22;

      const labelCell = totalRow.getCell(1);
      labelCell.value = 'OVERALL TOTAL';
      sheet.mergeCells(totalRowIdx, 1, totalRowIdx, 3);
      labelCell.font = { bold: true, color: { argb: 'FF000000' } };
      labelCell.alignment = { horizontal: 'center', vertical: 'middle' };

      headers.forEach((h, idx) => {
        const cell = totalRow.getCell(idx + 1);
        if (idx >= 3) { // After merged label
          if (totals.hasOwnProperty(h.key)) {
            cell.value = Number(totals[h.key].toFixed(2));
          } else {
            cell.value = '';
          }
        }
        cell.font = { bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE9E9E9' } };
        cell.border = {
          top: { style: 'thin' }, left: { style: 'thin' },
          bottom: { style: 'thin' }, right: { style: 'thin' }
        };
      });
    }
  };

  addSheet('BOM Update', bomUpdateData);
  await addFgOverheadSheet('FG Overhead Missing', fgOverheadData);
  await addCostSheetSummarySheet('Overall Cost Sheet Summary', costSheetData);

  return workbook.xlsx.writeBuffer();
}

async function sendDailyReportEmail() {
  try {
    const setting = await Setting.findOne().sort({ createdAt: -1 }).lean();
    const enabled = setting?.alert_enabled !== false;
    const recipients = Array.isArray(setting?.alert_emails)
      ? setting.alert_emails.filter((x) => x && x.trim())
      : [];

    const emailRecipients = recipients.length
      ? recipients
      : [
        'dinesh.hegde@medquantas.co.in',
        'aradhana.ganesh@medquantas.co.in',
        'kishore@medquantas.co.in',
        'lalithakarnad@medquantas.co.in',
      ];

    const bomUpdateData = await fetchBomUpdateReport();
    const fgOverheadData = await fetchFgOverheadNotUpdatedList();
    const costSheetData = await fetchCostSheetSummary();

    // --- Branded Email Content ---
    const logoPrimary = path.join(__dirname, '../../../public/master-app/assets/images/logo.png');
    const logoFallback = path.join(__dirname, '../../../projects/master-app/src/assets/images/logo.png');
    const logoPath = fs.existsSync(logoPrimary) ? logoPrimary : (fs.existsSync(logoFallback) ? logoFallback : null);

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.5;">
        <p>Please find the daily costing reports attached as an Excel file.</p>
        <br/>
        <p style="margin-bottom: 15px;">Regards,</p>
        ${nodemailers.getEmailSignature()}
      </div>
    `;

    const xlsxBuffer = await createReportWorkbook(bomUpdateData, fgOverheadData, costSheetData);

    const attachments = [
      {
        filename: `daily_costing_reports_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`,
        content: xlsxBuffer,
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    ];

    if (logoPath) {
      attachments.push({
        filename: 'logo.png',
        path: logoPath,
        cid: 'medo_logo_inline'
      });
    }

    console.log(`Sending daily report to ${emailRecipients.length} recipients:`, emailRecipients);

    const results = [];
    for (const recipient of emailRecipients) {
      try {
        const isSent = await nodemailers.sendRawMail({
          to: recipient,
          subject: `Daily Costing Report - ${new Date().toLocaleDateString()}`,
          html: htmlBody,
          attachments,
        });

        // Log the result
        const log = new EmailLog({
          to: recipient,
          subject: `Daily Costing Report - ${new Date().toLocaleDateString()}`,
          status: isSent ? 'Success' : 'Failed',
          reason: isSent ? null : 'Nodemailer returned false',
          type: 'DailyAlert'
        });
        await log.save();
        results.push(isSent);
      } catch (err) {
        console.error(`Error sending daily report to ${recipient}:`, err);
        const log = new EmailLog({
          to: recipient,
          subject: `Daily Costing Report (ERROR)`,
          status: 'Failed',
          reason: err.message,
          type: 'DailyAlert'
        });
        await log.save();
        results.push(false);
      }
    }

    const allSent = results.every(r => r === true);
    return { status: allSent, message: allSent ? 'All emails sent' : 'Some emails failed' };
  } catch (error) {
    console.error('sendDailyReportEmail outer error', error);
    return { status: false, message: 'Process error: ' + error.message };
  }
}

cron.schedule('* * * * *', async () => {
  const now = moment().format('HH:mm');
  const setting = await Setting.findOne().sort({ createdAt: -1 }).lean();
  if (setting?.alert_enabled !== false && (setting?.alert_time || '08:00') === now) {
    console.log('Running scheduled daily report email for ' + now);
    await sendDailyReportEmail();
  }
});


async function backupDatabase() {
  try {
    const DB_NAME = 'medquantas';
    const HOST = '127.0.0.1';
    const PORT = '27017';
    const BACKUP_DIR = process.env.BACKUP_DIR || 'C:/project/backup';
    const mongoBinPath = process.env.BACKUP_PATH || 'C:\\Program Files\\MongoDB\\Tools\\100\\bin';

    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const date = new Date().toISOString().replace(/[:]/g, '-').split('.')[0];
    const backupFile = path.join(BACKUP_DIR, `${DB_NAME}-backup-${date}.gz`);
    const escapedBackupFile = `"${backupFile}"`;
    const command = `"${mongoBinPath}\\mongodump" --host ${HOST} --port ${PORT} --db ${DB_NAME} --archive=${escapedBackupFile} --gzip`;

    return new Promise((resolve, reject) => {
      exec(command, async (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing backup: ${error.message}`);
          return reject({ status: false, message: `Backup failed: ${error.message}` });
        }

        console.log(`Backup completed successfully: ${backupFile}`);

        // Send Email Notification
        const setting = await Setting.findOne().sort({ createdAt: -1 }).lean();
        const recipients = Array.isArray(setting?.backup_emails) && setting.backup_emails.length
          ? setting.backup_emails
          : ['dhinesh.rajendran@medquantas.com', 'itms@medquantas.com', 'usman.kadher@medquantas.com'];

        const logoPath = path.join(process.cwd(), 'media', 'assets', 'logo', 'medquantas.png');
        const emailBody = `
                    <h3>Database Backup Successful</h3>
                    <p><b>Database:</b> ${DB_NAME}</p>
                    <p><b>Backup File:</b> ${backupFile}</p>
                    <p><b>Time:</b> ${new Date().toLocaleString()}</p>
                    <p>Status: Completed Successfully</p>
                    <br>
                    ${nodemailers.getEmailSignature()}
                `;

        console.log(`Sending backup notification to ${recipients.length} recipients:`, recipients);

        for (const recipient of recipients) {
          try {
            const isSent = await nodemailers.sendRawMail({
              to: recipient,
              subject: `Database Backup Success - ${DB_NAME} - ${new Date().toLocaleDateString()}`,
              html: emailBody,
            });

            // Log the result
            const log = new EmailLog({
              to: recipient,
              subject: `Database Backup Success - ${DB_NAME}`,
              status: isSent ? 'Success' : 'Failed',
              reason: isSent ? null : 'Nodemailer returned false',
              type: 'DatabaseBackup'
            });
            await log.save();
          } catch (err) {
            console.error(`Error sending backup notification to ${recipient}:`, err);
            const log = new EmailLog({
              to: recipient,
              subject: `Database Backup (ERROR)`,
              status: 'Failed',
              reason: err.message,
              type: 'DatabaseBackup'
            });
            await log.save();
          }
        }

        resolve({ status: true, file: backupFile });
      });
    });
  } catch (error) {
    console.error('backupDatabase outer error', error);
    return { status: false, message: error.message };
  }
}

cron.schedule('* * * * *', async () => {
  const now = moment().format('HH:mm');
  const setting = await Setting.findOne().sort({ createdAt: -1 }).lean();
  if ((setting?.backup_time || '00:00') === now) {
    console.log('Starting scheduled daily database backup for ' + now);
    await backupDatabase();
  }
});


exports.run_backup = async (req, res, next) => {
  try {
    const result = await backupDatabase();
    const user = req.bodyParams?.user;
    if (result.status) {
      await logAction({
        section: "module",
        user: user?._id,
        action: "export",
        description: `Manual database backup triggered successfully. File: ${result.file}`,
        data: result
      });
      return res.apiResponse(true, 'Database backup completed successfully');
    } else {
      return res.apiResponse(false, result.message || 'Failed to complete database backup');
    }
  } catch (error) {
    console.error('run_backup error', error);
    return res.apiResponse(false, 'Error during database backup');
  }
};


exports.send_daily_reports = async (req, res, next) => {
  try {
    const result = await sendDailyReportEmail();
    if (result.status) {
      return res.apiResponse(true, 'Daily reports sent successfully');
    } else {
      return res.apiResponse(false, result.message || 'Failed to send daily report');
    }
  } catch (error) {
    console.error('send_daily_reports error', error);
    return res.apiResponse(false, 'Error sending daily reports');
  }
};


exports.get_dashboard_metrics = async (req, res, next) => {
  try {
    const bomCount = await BomMaster.countDocuments();
    const costsheetCount = await Costsheet.countDocuments();
    const salesheetCount = await Salesheet.countDocuments();

    const erpBomMigration = await MigrationLog.findOne({ type: "BOM" }).sort({ lastRunAt: -1 });
    const erpItemMigration = await MigrationLog.findOne({ type: "ITEM" }).sort({ lastRunAt: -1 });
    const erpGrnMigration = await MigrationLog.findOne({ type: "GRN" }).sort({ lastRunAt: -1 });

    const ErbBom = require("../models/erb_bom");
    const ErbItem = require("../models/erb_item");
    const ErbRate = require("../models/erb_rate");

    const getStartOfDay = (dateStr) => {
      const d = new Date(dateStr);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    const erbBomCount = await ErbBom.countDocuments();
    const erbItemCount = await ErbItem.countDocuments();
    const erbGrnCount = await ErbRate.countDocuments();

    // Calculate how many records were updated in the most recent migration run
    const erbBomUpdatedCount = erpBomMigration ? await ErbBom.countDocuments({ updatedAt: { $gte: getStartOfDay(erpBomMigration.lastRunAt) } }) : 0;
    const erbItemUpdatedCount = erpItemMigration ? await ErbItem.countDocuments({ updatedAt: { $gte: getStartOfDay(erpItemMigration.lastRunAt) } }) : 0;
    const erbGrnUpdatedCount = erpGrnMigration ? await ErbRate.countDocuments({ updatedAt: { $gte: getStartOfDay(erpGrnMigration.lastRunAt) } }) : 0;

    const recentSalesheets = await Salesheet.find().sort({ createdAt: -1 }).limit(5).populate(['user']);

    return res.apiResponse(true, "Success", {
      total_bom: bomCount,
      total_costsheet: costsheetCount,
      total_salesheet: salesheetCount,

      update_erb_bom: erpBomMigration ? erpBomMigration.lastRunAt : null,
      update_item: erpItemMigration ? erpItemMigration.lastRunAt : null,
      update_grn: erpGrnMigration ? erpGrnMigration.lastRunAt : null,

      erb_bom_count: erbBomCount,
      erb_item_count: erbItemCount,
      erb_grn_count: erbGrnCount,

      erb_bom_updated: erbBomUpdatedCount,
      erb_item_updated: erbItemUpdatedCount,
      erb_grn_updated: erbGrnUpdatedCount,

      recent_salesheets: recentSalesheets
    });
  } catch (error) {
    console.error(error);
    return res.apiResponse(false, "Error retrieving dashboard metrics");
  }
};

exports.upload_file = async (req, res, next) => {
  var requests = req.bodyParams;
  if (req.files && req.files.file) {
    const media = req.files.file;
    const ext = media.name.split(".").pop();
    const iconName = "document" + requests.name + moment().unix() + "." + ext;

    const path = "media/assets/uploads/" + iconName;
    media.mv(path, async (err) => {
      if (err) {
        console.error("File move error: " + err);
        return res.apiResponse(false, "File move failed");
      } else {
        // send mail using nodemailers config
        nodemailers.sendRawMail({
          to: requests.to,
          subject: "File Attachment",
          html: "Attached is the Instant file",
          attachments: [
            {
              filename: requests.name,
              path: path,
            },
          ],
        }).then(isSent => {
          if (!isSent) {
            return res.apiResponse(false, "Sheet send failed");
          } else {
            fs.unlink(path, (err) => {
              if (err) {
                console.error("File deletion error: " + err);
              }
            });
            return res.apiResponse(true, "Sheet sent successfully");
          }
        }).catch(error => {
          console.error("upload_file email error:", error);
          return res.apiResponse(false, "Sheet send failed", error);
        });

        // const transporter = nodemailer.createTransport(smtpTransport({
        //     host: 'smtp.office365.com',
        //     port: 587,
        //     secure: false, // Use TLS
        //     auth: {
        //         user: mailEmail,
        //         pass: mailPass
        //     }
        // }));

        // const mailOptions = {
        //     from: mailEmail,
        //     to: requests.to,
        //     subject: 'File Attachment',
        //     text: 'Attached is the PDF file',
        //     attachments: [
        //         {
        //             filename: requests.document_name,
        //             path: path,
        //         },
        //     ],
        // };
        // transporter.sendMail(mailOptions, (error, info) => {
        //     if (error) {
        //         console.log('Email send error: ' + error);
        //         return res.apiResponse(false, "Report send failed");
        //     } else {
        //         console.log('Email sent: ' + info.response);
        //         return res.apiResponse(true, "Report sent successfully");
        //     }
        // });
      }
    });
  }
};

exports.update_setting = async (req, res, next) => {
  try {
    var requests = req.bodyParams;
    requests = await commonHelper.trimObjc(requests);
    let setting;
    if (requests.id) {
      setting = await Setting.findOneAndUpdate({ _id: requests.id }, { $set: requests }, { new: true }).exec();
      return res.apiResponse(true, "Setting Updated Successfully", { setting });
    } else {
      const newSetting = new Setting(requests);
      setting = await newSetting.save();
      return res.apiResponse(true, "Setting Added Successfully", { setting });
    }
  } catch (error) {
    console.error("Error updating/adding setting:", error);
    return res.apiResponse(false, "Error updating/adding setting");
  }
};

exports.get_setting = async (req, res, next) => {
  var requests = req.bodyParams;
  var page = requests.page || 1;
  var per_page = requests.per_page || 20;
  var pagination = requests.pagination || "false";
  const match = {};
  var sort = { createdAt: -1 };

  const options = {
    page: page,
    limit: per_page,
    sort: sort,
  };

  if (typeof requests.id != "undefined" && requests.id != "") {
    match["_id"] = requests.id;
  }

  if (pagination == "true") {
    Setting.paginate(match, options, function (err, setting) {
      return res.apiResponse(true, "Success", { setting });
    });
  } else {
    var setting = await Setting.find(match).sort(sort);
    return res.apiResponse(true, "Success", { setting });
  }
};

upload_setting = async (req, id) => {
  if (
    req.body.image &&
    typeof req.body.image != "undefined" &&
    req.body.image != null
  ) {
    var matches = req.body.image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
      response = {};
    if (matches == null) {
      return false;
    }
    if (matches.length !== 3) {
      return false;
    }

    response.type = matches[1];
    response.data = new Buffer.from(matches[2], "base64");
    let decodedImg = response;
    let imageBuffer = decodedImg.data;
    let type = decodedImg.type;
    let extension = mime.getExtension(type);
    if (extension == "jpg" || extension == "png" || extension == "jpeg") {
      var d = new Date();
      let imageName = "logo" + d.getTime() + id + "." + extension;
      const path = "media/assets/logo/";
      commonHelper.prepareUploadFolder(path);
      try {
        fs.writeFileSync(path + imageName, imageBuffer, "utf8");
        var update_data = {};
        update_data.image = imageName;
        await Setting.findOneAndUpdate(
          { _id: id },
          { $set: update_data },
          { new: true }
        ).exec();
      } catch (e) {
        return false;
      }
    }
  }
  return true;
};



const formatDate = (date) => {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};


exports.export_item = async (req, res, next) => {
  try {
    const requests = req.bodyParams;
    const page = parseInt(requests.page) > 0 ? parseInt(requests.page) : 1;
    const limit = parseInt(requests.limit) > 0 ? parseInt(requests.limit) : 10;

    const skip = (page - 1) * limit;
    const search = requests.search || "";
    const user = requests.user;
    const match = {};
    let sort = { createdAt: -1 };

    if (search && search !== "") {
      const searchStr = await escapeRegExp(search);
      match.$or = [
        { name: { $regex: new RegExp(searchStr, "i") } },
        { code: { $regex: new RegExp(searchStr, "i") } },
      ];
    }

    if (requests.sort && requests.sort !== "") {
      switch (requests.sort) {
        case "name_asc":
          sort = { name: 1 };
          break;
        case "name_desc":
          sort = { name: -1 };
          break;
        case "item_Code_asc":
          sort = { code: 1 };
          break;
        case "item_Code_desc":
          sort = { code: -1 };
          break;
        default:
          sort = { createdAt: -1 };
      }
    }

    const itemsRaw = await ItemMaster.find(match)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const itemsWithMakes = await Promise.all(
      itemsRaw.map(async (item) => {
        const itemObj = item.toObject();
        const selectMakes = item.selectMakes || [];

        const makesData = selectMakes.length
          ? await Make.find({ _id: { $in: selectMakes } })
          : [];

        itemObj.assign_Makes = makesData;

        return itemObj;
      })
    );

    const total = await ItemMaster.countDocuments(match);
    const totalPages = Math.ceil(total / limit);

    await logAction({
      section: "item",
      user: user?._id,
      action: "export",
      description: `Exported item list. Page: <b>${page}</b>, Total Items: <b>${itemsWithMakes.length}</b>`,
      data: {
        page,
        limit,
        totalItems: itemsWithMakes.length,
        timestamp: new Date().toISOString(),
      },
    });

    return res.apiResponse(true, "Success", {
      currentPage: page,
      totalPages,
      items: itemsWithMakes,
    });
  } catch (error) {
    console.error("Error exporting items:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.export_log = async (req, res) => {
  try {
    const { user, name, type, format } = req.bodyParams;

    if (!user || !type || !format || !name) {
      return res.apiResponse(false, "Missing required parameters");
    }

    await logAction({
      section: type,
      user: user?._id || user,
      action: "export",
      description: `Exported <b>${name}</b> as <b>${format.toUpperCase()}</b>`,
      data: {},
    });

    return res.apiResponse(true, "Export log recorded");
  } catch (error) {
    console.error("Error logging export:", error);
    return res.apiResponse(false, "Failed to log export");
  }
};

exports.export_fgmaster = async (req, res, next) => {
  try {
    const match = {};
    const sort = {};
    const options = {
      populate: [
        { path: "Customer_pop", options: { sort: { name: 1 } } },
        { path: "Fgtype_pop", options: { sort: { name: 1 } } },
        { path: "Pack_pop", options: { sort: { name: 1 } } },
      ],
    };

    const result = await Fgmaster.find(match)
      .sort(sort)
      .populate(options.populate);
    const items = [];

    return res.apiResponse(true, "Success", result);
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.export_supplier = async (req, res, next) => {
  try {
    const match = {};
    const sort = {};
    const options = {
      populate: [
        // { path: 'Customer_pop', options: { sort: { name: 1 } } },
        // { path: 'Fgtype_pop', options: { sort: { name: 1 } } },
        // { path: 'Fgsubtype_pop', options: { sort: { name: 1 } } },
        // { path: 'Pack_pop', options: { sort: { name: 1 } } },
      ],
    };

    const result = await Supplier.find(match)
      .sort(sort)
      .populate(options.populate);
    const items = [];

    return res.apiResponse(true, "Success", result);
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.export_customer = async (req, res, next) => {
  try {
    const match = {};
    const sort = {};
    const options = {
      populate: [
        { path: "customertype_pop", options: { sort: { name: 1 } } },
        // { path: 'Fgtype_pop', options: { sort: { name: 1 } } },
        // { path: 'Fgsubtype_pop', options: { sort: { name: 1 } } },
        // { path: 'Pack_pop', options: { sort: { name: 1 } } },
      ],
    };

    const result = await Customer.find(match)
      .sort(sort)
      .populate(options.populate);
    const items = [];

    return res.apiResponse(true, "Success", result);
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.export_make = async (req, res, next) => {
  try {
    const match = {};
    const sort = {};
    const options = {
      populate: [
        // { path: 'customertype_pop', options: { sort: { name: 1 } } },
        // { path: 'Fgtype_pop', options: { sort: { name: 1 } } },
        // { path: 'Fgsubtype_pop', options: { sort: { name: 1 } } },
        // { path: 'Pack_pop', options: { sort: { name: 1 } } },
      ],
    };

    const result = await Make.find(match).sort(sort).populate(options.populate);
    const items = [];

    return res.apiResponse(true, "Success", result);
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.fetch_bom = async (req, res, next) => {
  try {
    const requests = req.bodyParams;
    const match = {};

    if (requests.search && requests.search.trim() !== "") {
      const escaped = escapeRegExp(requests.search.trim());
      const searchRegex = new RegExp(escaped, "i");

      match.$or = [
        { name: { $regex: searchRegex } },
        { code: { $regex: searchRegex } },
      ];
    }

    if (requests.searchloc && requests.searchloc !== "") {
      match.locCd = requests.searchloc;
    }

    const boms = await BomMaster.aggregate([
      { $match: match },
      { $sort: { revision: -1 } },
      {
        $group: {
          _id: {
            code: "$code",
            name: "$name",
          },
          doc: { $first: "$$ROOT" },
        },
      },
      { $replaceRoot: { newRoot: "$doc" } },
      { $sort: { name: 1 } },
    ]).collation({ locale: "en", strength: 2 });

    return res.apiResponse(true, "Success", { boms });
  } catch (error) {
    console.error("Error fetching BOM:", error);
    return res.status(500).send("Internal Server Error");
  }
};

exports.get_sale_sheet = async (req, res, next) => {
  var requests = req.bodyParams;
  var page = requests.page || 1;
  var per_page = requests.per_page || 10;
  var pagination = requests.pagination || "false";
  const match = {};
  var sort = { createdAt: -1 };

  const options = {
    page: page,
    limit: per_page,
    sort: sort,
    populate: ["user"],
  };

  if (requests.search && requests.search !== "") {
    match.$or = [
      { productname: { $regex: new RegExp(requests.search, "i") } },
      { productcode: { $regex: new RegExp("^" + requests.search, "i") } },
    ];
  }

  if (requests.from_date && requests.to_date) {
    const fromDate = new Date(requests.from_date);
    const toDate = new Date(requests.to_date);
    toDate.setHours(23, 59, 59, 999);
    match.createdAt = { $gte: fromDate, $lte: toDate };
  }

  if (requests.searchcode && requests.searchcode !== "") {
    match.uniqueID = { $regex: new RegExp(requests.searchcode, "i") };
  }

  if (requests.searchloc && requests.searchloc.trim() !== "") {
    match.locCd = { $regex: new RegExp(requests.searchloc.trim(), "i") };
  }

  if (typeof requests.id != "undefined" && requests.id != "") {
    match["_id"] = requests.id;
  }

  if (requests.role_name === 'Sale' && requests.user_id) {
    match["userID"] = requests.user_id;
  }

  if (pagination == "true") {
    Salesheet.paginate(match, options, function (err, sheets) {
      return res.apiResponse(true, "Success", { sheets });
    });
  } else {
    var sheets = await Salesheet.find(match).sort(sort).populate(options.populate);;
    return res.apiResponse(true, "Success", { sheets });
  }
};


exports.update_sale_sheet = async (req, res, next) => {
  try {
    var requests = req.bodyParams;
    const user = requests.user;
    if (requests._id) {
      const updated_sale = await Salesheet.findOneAndUpdate({ _id: requests._id }, { $set: requests }, { new: true });

      await logAction({
        section: "sales",
        user: user?._id || requests.userID || requests.user_id,
        action: "update",
        description: `Updated Sales Sheet: <b>${updated_sale.productname}</b> (ID: ${updated_sale.uniqueID})`,
        data: requests
      });

      return res.apiResponse(true, "Updated Successfully", { updated_sale });
    } else {
      requests.uniqueID = generateMedoID(requests.productcode);
      var new_sale = new Salesheet(requests);
      await new_sale.save();

      await logAction({
        section: "sales",
        user: user?._id || requests.userID || requests.user_id,
        action: "create",
        description: `Created new Sales Sheet: <b>${new_sale.productname}</b> (ID: ${new_sale.uniqueID})`,
        data: requests
      });

      return res.apiResponse(true, "Success", { new_sale });
    }
  } catch (error) {
    console.error("Error updating sale sheet:", error);
    return res.status(500).send("Internal Server Error");
  }
};

function generateMedoID(productID) {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `Medo-${productID}-${date}-${random}`;
}

cron.schedule('0 0 * * *', async () => {
  try {
    const bomList = await BomMaster.find({ batch: { $exists: true } });
    for (const item of bomList) {
      if (!Array.isArray(item.packstage) || !item.packstage.length) continue;
      item.packstage[0].bomDetail = {
        batch: Number(item.batch),
        analytical_value: item.analytical_value,
        costunit: item.costunit,
        freight: item.freight,
        manufacture_matval: item.manufacture_matval,
        manufacture_qty: item.manufacture_qty,
        manufacture_total: item.manufacture_total,
        pack_matval: item.pack_matval,
        pack_qty: item.pack_qty,
        pack_total: item.pack_total,
        punch_value: item.punch_value
      };
      item.markModified('packstage');
      console.log("t")
      await item.save();
    }
    console.log('BOM cron saved successfully');
  } catch (err) {
    console.error('BOM cron error:', err);
  }
});

exports.get_email_logs = async (req, res, next) => {
  try {
    const requests = req.bodyParams;
    const page = parseInt(requests.page) || 1;
    const per_page = parseInt(requests.per_page) || 10;
    const type = requests.type;

    const match = {};
    if (type) match.type = type;
    if (requests.status) match.status = requests.status;

    const options = {
      page: page,
      limit: per_page,
      sort: { createdAt: -1 }
    };

    EmailLog.paginate(match, options, (err, logs) => {
      if (err) return res.apiResponse(false, "Pagination error", err);
      return res.apiResponse(true, "Logs fetched", { logs });
    });
  } catch (error) {
    return res.apiResponse(false, "Error fetching logs: " + error.message);
  }
};
