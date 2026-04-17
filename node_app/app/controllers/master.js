const commonHelper = require("../helpers/commonHelper");
const _ = require("lodash");
const Module = require("../models/module");
const Rolemanage = require("../models/rolemanage");
const Itemtype = require("../models/itemtype");
const Customer = require("../models/customer");
const Unit = require("../models/unit");
const Supplier = require("../models/supplier");
const BomType = require("../models/bomtype");
const Conversion = require("../models/conversion");
const Conversionmaster = require("../models/conversionmaster");
const Packtype = require("../models/packtype");
const Packing = require("../models/packing");
const Packingmaster = require("../models/packingmaster");
const { logAction } = require("../helpers/logModel.helper");
const PriceChangeLog = require("../models/PriceChangeLog");
const ErbBom = require("../models/erb_bom")
const ErbRate = require("../models/erb_rate")
const ErbItem = require("../models/erb_item")
const PriceMaster = require("../models/price_master");
const ItemMaster = require("../models/item_master");
const StageMaster = require("../models/stage_master");
const Role = require("../models/role");
const ConversionFactor = require("../models/conversionFactor");
const bulk_update_support = require('./bulk_update_support');


function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

exports.pack_code = async (req, res, next) => {
  try {
    var requests = req.bodyParams;
    if (requests.code) {
      var checkPackcode = await Packtype.findOne({ pack_code: requests.code });
    } else {
      var checkPackcode = false;
    }
    if (checkPackcode) {
      return res.apiResponse(false, "Pack Code Already Exists.");
    } else {
      return res.apiResponse(true);
    }
  } catch (error) {
    console.log("exports.Pack_code -> error", error);
    return res.apiResponse(false, "Pack_code check failed", {});
  }
};

exports.update_role = async (req, res, next) => {
  var requests = req.bodyParams;
  requests = await commonHelper.trimObjc(requests);
  const user = requests.user;
  if (requests.id) {
    const roles = await Role.findOneAndUpdate(
      { _id: requests.id },
      { $set: requests },
      { new: true }
    ).exec();
    await logAction({ section: "role", user: user?._id, action: "update", description: `Updated Role: <b>${roles.name}</b>`, data: requests });
    return res.apiResponse(true, "Role Updated Successfully", { roles });
  } else {
    var new_roles = new Role(requests);
    const savedRole = await new_roles.save();
    const savedRoleId = savedRole._id;
    var update_data = {};
    update_data.role_id = savedRoleId;
    update_data.permission = [];
    var new_manage = new Rolemanage(update_data);
    await new_manage.save();
    await logAction({ section: "role", user: user?._id, action: "create", description: `Created new Role: <b>${savedRole.name}</b>`, data: requests });
    return res.apiResponse(true, "Role Added Successfully");
  }
};

exports.get_role = async (req, res, next) => {
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
  };

  if (typeof requests.id != "undefined" && requests.id != "") {
    match["_id"] = requests.id;
  }
  if (pagination == "true") {
    Role.paginate(match, options, function (err, roles) {
      return res.apiResponse(true, "Success", { roles });
    });
  } else {
    var roles = await Role.find(match).sort(sort);
    return res.apiResponse(true, "Success", { roles });
  }
};

exports.delete_role = async (req, res, next) => {
  var requests = req.bodyParams;
  var role = await Role.findOne({ _id: requests.id });
  if (role) {
    role.deleteOne();
  }
  return res.apiResponse(true, "Role Deleted Successfully", role);
};

exports.update_module = async (req, res, next) => {
  try {
    let requests = req.bodyParams;
    requests = await commonHelper.trimObjc(requests);
    const user = requests.user;

    let logDescription = "";
    let logData = {};
    let actionType = "";

    if (requests.id) {
      const existingModule = await Module.findById(requests.id).lean();
      const updatedModule = await Module.findOneAndUpdate(
        { _id: requests.id },
        { $set: requests },
        { new: true }
      );

      // Build log fields comparison
      const changedFields = [];
      for (const key in requests) {
        if (
          key !== "user" &&
          JSON.stringify(existingModule[key]) !== JSON.stringify(requests[key])
        ) {
          changedFields.push(`<b>${key}</b>: "<b>${existingModule[key]}</b>" → "<b>${requests[key]}</b>"`);
          logData[key] = {
            from: existingModule[key],
            to: requests[key],
          };
        }
      }

      if (changedFields.length === 0) {
        logDescription = `Updated module "<b>${existingModule.name}</b>", but no fields changed.`;
      } else {
        logDescription = `Updated module "<b>${existingModule.name}</b>": ` + changedFields.join(", ");
      }

      actionType = "update";

      await logAction({
        section: "module",
        user: user?._id,
        action: actionType,
        description: logDescription,
        data: logData,
      });

      await update_modules(updatedModule);
      return res.apiResponse(true, "Module Updated Successfully");

    } else {
      const new_modules = new Module(requests);
      const savedModule = await new_modules.save();

      const retrievedModule = await Module.findById(savedModule._id).lean();

      await update_modules(retrievedModule);

      logDescription = `Created module "<b>${retrievedModule.name}</b>"`;
      logData = requests;
      actionType = "create";

      await logAction({
        section: "module",
        user: user?._id,
        action: actionType,
        description: logDescription,
        data: logData,
      });

      return res.apiResponse(true, "Module Added Successfully");
    }
  } catch (error) {
    console.error("Error in update_module:", error);
    return res.apiResponse(false, "update_module function failed");
  }
};

async function update_modules(data) {
  const role = await Rolemanage.find();
  for (let i = 0; i < role.length; i++) {
    const roles = role[i];
    roles.permission.push(data);
    await roles.save();
  }
}



exports.delete_module = async (req, res, next) => {
  try {
    var requests = req.bodyParams;
    const user = requests.user;

    if (requests.id) {
      const deletedModule = await Module.findByIdAndRemove(requests.id).lean();

      if (deletedModule) {
        await removeModuleFromRoles(deletedModule);

        const logDescription = `Deleted module "<b>${deletedModule.name}</b>"`;
        const logData = deletedModule;
        const actionType = "delete";

        await logAction({
          section: "module",
          user: user?._id,
          action: actionType,
          description: logDescription,
          data: logData,
        });

        return res.apiResponse(true, "Module Deleted Successfully");
      } else {
        return res.apiResponse(false, "Module not found");
      }
    } else {
      return res.apiResponse(false, "Module ID is missing");
    }
  } catch (error) {
    console.error("Error deleting Module:", error);
    return res.apiResponse(false, "delete_module function failed");
  }
};


async function removeModuleFromRoles(deletedModule) {
  const role = await Rolemanage.find();
  for (var i = 0; i < role.length; i++) {
    const roles = role[i];
    roles.permission = roles.permission.filter(
      (permission) => permission._id.toString() !== deletedModule._id.toString()
    );
    await roles.save();
  }
}

exports.get_module = async (req, res, next) => {
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
  };

  if (typeof requests.id != "undefined" && requests.id != "") {
    match["_id"] = requests.id;
  }
  if (pagination == "true") {
    Module.paginate(match, options, function (err, modules) {
      return res.apiResponse(true, "Success", { modules });
    });
  } else {
    var modules = await Module.find(match).sort(sort);
    return res.apiResponse(true, "Success", { modules });
  }
};

exports.update_role_master = async (req, res, next) => {
  try {
    let requests = req.bodyParams;
    requests = await commonHelper.trimObjc(requests);
    const user = requests.user;

    let actionType;
    let logDescription = "";
    let logData = {};

    const formatPermissions = (perms) => {
      return (perms || [])
        .filter(
          (p) => Array.isArray(p.actions) && p.actions.some((a) => a.isSelected)
        )
        .map((p) => p.label || p.name || JSON.stringify(p))
        .join(", ");
    };

    const formatStatus = (status) => {
      return (status || [])
        .map((s) =>
          typeof s === "object" ? s.label || s.name || JSON.stringify(s) : s
        )
        .join(", ");
    };

    if (requests.id) {
      const existingRole = await Rolemanage.findById(requests.id).lean();

      const updatedRole = await Rolemanage.findOneAndUpdate(
        { _id: requests.id },
        { $set: { permission: requests.permission, status: requests.status } },
        { new: true }
      ).exec();

      const updatedFields = [];

      if (
        JSON.stringify(existingRole.permission) !==
        JSON.stringify(requests.permission)
      ) {
        updatedFields.push(
          `<b>Permission</b>: <b>${formatPermissions(requests.permission)}</b>`
        );
        logData.permission = requests.permission;
      }

      if (
        JSON.stringify(existingRole.status) !== JSON.stringify(requests.status)
      ) {
        const formattedStatus = formatStatus(requests.status);
        updatedFields.push(`<b>Status</b>: <b>${formattedStatus}</b>`);
        logData.status = requests.status;
      }

      const roleDoc = await Role.findById(existingRole.role_id).lean();
      const roleName = roleDoc?.name || existingRole.role_id;

      if (updatedFields.length === 0) {
        logDescription = `Updated role "<b>${roleName}</b>", but no fields changed.`;
      } else {
        logDescription =
          `Updated role "<b>${roleName}</b>": ` + updatedFields.join(", ");
      }

      actionType = "update";

      await logAction({
        section: "role",
        user: user?._id,
        action: actionType,
        description: logDescription,
        data: logData,
      });

      return res.apiResponse(true, "Role Updated Successfully", {
        roles: updatedRole,
      });
    } else {
      const newRole = new Role(requests);
      const savedRole = await newRole.save();

      requests.role_id = savedRole.id;
      const newManage = new Rolemanage(requests);
      await newManage.save();

      logDescription = `Created role "<b>${savedRole.name
        }</b>" with permissions: <b>${formatPermissions(
          requests.permission
        )}</b>`;
      logData = requests;
      actionType = "create";

      await logAction({
        section: "role",
        user: user?._id,
        action: actionType,
        description: logDescription,
        data: logData,
      });

      return res.apiResponse(true, "Role Added Successfully");
    }
  } catch (error) {
    console.log(error);
    return res.apiResponse(false, "update_role_master function failed");
  }
};

exports.get_role_master = async (req, res, next) => {
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

  if (typeof requests.id != "undefined" && requests.id != "") {
    match["_id"] = requests.id;
  }
  if (typeof requests.role_id != "undefined" && requests.role_id != "") {
    match["role_id"] = requests.role_id;
  }
  if (pagination == "true") {
    Rolemanage.paginate(match, options, function (err, rolemanager) {
      return res.apiResponse(true, "Success", { rolemanager });
    });
  } else {
    var rolemanager = await Rolemanage.find(match)
      .sort(sort)
      .populate(options.populate);
    return res.apiResponse(true, "Success", { rolemanager });
  }
};

exports.check_role = async (req, res, next) => {
  try {
    var requests = req.bodyParams;
    requests = await commonHelper.trimObjc(requests);
    if (requests.name) {
      var checkname = await Role.findOne({ name: requests.name });
    } else {
      var checkname = false;
    }
    if (checkname) {
      return res.apiResponse(false, "Role Already Exists.");
    } else {
      return res.apiResponse(true);
    }
  } catch (error) {
    console.log("exports.role_name -> error", error);
    return res.apiResponse(false, "role_name check failed", {});
  }
};

exports.create_role = async (req, res, next) => {
  var requests = req.bodyParams;
  var roles = await Rolemanage.find();
  var permission = roles[0].permission;
  _.forEach(permission, (data) => {
    data.isSelected = false;
    _.forEach(data.actions, (datum) => {
      datum.isSelected = false;
    });
  });
  var status = [
    {
      name: "Bom",
      isSelected: false,
      actions: [
        {
          name: "Created",
          isSelected: true,
        },
        {
          name: "Verified",
          isSelected: false,
        },
        {
          name: "Approved",
          isSelected: false,
        },
      ],
    },
    {
      name: "Costsheet",
      isSelected: false,
      actions: [
        {
          name: "Created",
          isSelected: true,
        },
        {
          name: "Verified",
          isSelected: false,
        },
        {
          name: "Approved",
          isSelected: false,
        },
      ],
    },
    {
      name: "Instantsheet",
      isSelected: false,
      actions: [
        {
          name: "Created",
          isSelected: true,
        },
        {
          name: "Verified",
          isSelected: false,
        },
        {
          name: "Approved",
          isSelected: false,
        },
      ],
    },
  ];
  _.forEach(status, (data) => {
    data.isSelected = false;
    _.forEach(data.actions, (datum) => {
      datum.isSelected = false;
    });
  });
  return res.apiResponse(true, "Success", { permission, status });
};

exports.update_item = async (req, res, next) => {
  try {
    let requests = req.bodyParams;
    const user = requests.user;

    requests = await commonHelper.trimObjc(requests);
    if (!requests.name || !requests.code) {
      return res.apiResponse(false, "Name and Code are required.");
    }

    function capitalizeFirstLetter(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }

    let item;
    let actionType;
    let logDescription = "";
    let logData = {};

    const excludeFields = [
      "_id",
      "id",
      "__v",
      "createdAt",
      "updatedAt",
      "user",
    ];

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

    if (requests.id) {
      const existingItem = await ItemMaster.findById(requests.id).lean();

      if (!existingItem) {
        return res.apiResponse(false, "Item not found.");
      }

      item = await ItemMaster.findOneAndUpdate(
        { _id: requests.id },
        { $set: requests },
        { new: true }
      ).exec();

      const updatedFields = [];

      for (const key in requests) {
        if (
          excludeFields.includes(key) ||
          typeof requests[key] === "object" ||
          existingItem[key] === requests[key]
        ) {
          continue;
        }

        updatedFields.push(
          `<b>${capitalizeFirstLetter(
            key
          )}</b>: changed from <b>"${formatDateIfISO(
            existingItem[key] ?? ""
          )}"</b> to <b>"${formatDateIfISO(requests[key])}"</b>`
        );

        logData[key] = {
          from: existingItem[key] ?? "",
          to: requests[key],
        };
      }

      if (updatedFields.length === 0) {
        logDescription = `Updated item "<b>${requests.name}</b>", but no fields changed.`;
      } else {
        logDescription =
          `Updated item "<b>${requests.name}</b>": ` + updatedFields.join(", ");
      }

      await PriceMaster.findOneAndUpdate(
        { itemID: item.id },
        {
          $set: {
            itemID: item.id,
            name: requests.name,
            code: requests.code,
          },
        },
        { new: true }
      ).exec();
      // await logAction({
      //   section: "price",
      //   user: user?._id,
      //   action: "update",
      //   description: `Updated rate "<b>${requests.name}</b>", but no fields changed.`,
      //   data: {
      //     itemID: item.id,
      //     name: requests.name,
      //     code: requests.code,
      //   },
      // });
      actionType = "update";
    } else {
      const new_item = new ItemMaster(requests);
      item = await new_item.save();

      const priceDetails = {
        itemID: item.id,
        name: requests.name,
        code: requests.code,
        rate: 0,
        gst: 0,
        gstCGST: 0,
        gstSGST: 0,
      };

      const new_rate = new PriceMaster(priceDetails);
      await new_rate.save();
      const priceFields = Object.entries(priceDetails)
        .filter(([key, val]) => val !== "")
        .map(([key, val]) => {
          return `<b>${capitalizeFirstLetter(key)}</b>: <b>"${formatDateIfISO(
            val
          )}"</b>`;
        })
        .join(", ");

      await logAction({
        section: "price",
        user: user?._id,
        action: "create",
        description: `Created rate "<b>${requests.name}</b>"`,
        data: priceDetails,
      });

      actionType = "create";

      const fields = Object.entries(requests)
        .filter(([key, val]) => !excludeFields.includes(key) && val !== "")
        .map(([key, val]) => {
          return `<b>${capitalizeFirstLetter(key)}</b>: <b>"${formatDateIfISO(
            val
          )}"</b>`;
        })
        .join(", ");

      logDescription = `Created item "<b>${requests.name}</b>"`;
      logData = requests;
    }

    await logAction({
      section: "item",
      user: user?._id,
      action: actionType,
      description: logDescription,
      data: logData,
    });
    await bulk_update_support.update_bom_percentage_bulk(item);

    return res.apiResponse(
      true,
      `Item ${actionType === "create" ? "Added" : "Updated"} Successfully`,
      { item }
    );
  } catch (error) {
    console.error("Error updating/creating item:", error);
    return res.apiResponse(
      false,
      "An error occurred while processing your request."
    );
  }
};

exports.delete_item = async (req, res, next) => {
  const requests = req.bodyParams;
  const user = requests.user;

  try {
    const item = await ItemMaster.findOne({ _id: requests.id }).lean();
    if (!item) {
      return res.apiResponse(false, "Item not found");
    }

    await ItemMaster.deleteOne({ _id: requests.id });

    const priceDeleteResult = await PriceMaster.deleteMany({ itemID: requests.id });

    await logAction({
      section: "item",
      user: user?._id,
      action: "delete",
      description: `Deleted item "<b>${item.name}</b>" with code "<b>${item.code}</b>".`,
      data: { item },
    });

    return res.apiResponse(true, "Item and related PriceMaster record(s) deleted successfully");
  } catch (error) {
    console.error("Error deleting item:", error);
    return res.apiResponse(false, "Error deleting Item");
  }
};
exports.get_item = async (req, res, next) => {
  try {
    var requests = req.bodyParams;
    var page = requests.page || 1;
    var per_page = requests.per_page || 10;
    var pagination = requests.pagination || "false";
    const match = {};
    var sort = { createdAt: -1 };

    if (requests.search && requests.search !== "") {
      var searchStr = await escapeRegExp(requests.search);
      match.$or = [
        { name: { $regex: new RegExp(searchStr, "i") } },
        { code: { $regex: new RegExp(searchStr, "i") } },
        // { itemCode: { $regex: new RegExp("^" + searchStr, "i") } },
      ];
    }

    if (requests.selectedtype && requests.selectedtype !== "") {
      match["typeCode"] = requests.selectedtype;
    }

    if (requests.selectedsubtype && requests.selectedsubtype !== "") {
      match["subtypeCode"] = requests.selectedsubtype;
    }

    if (requests.sort != "") {
      switch (requests.sort) {
        case "name_asc":
          sort = { itemName: 1 };
          break;
        case "name_desc":
          sort = { itemName: -1 };
          break;
        case "item_Code_asc":
          sort = { itemCode: 1 };
          break;
        case "item_Code_desc":
          sort = { itemCode: -1 };
          break;
        default:
      }
    }
    const options = {
      page: page,
      limit: per_page,
      sort: sort,
      // populate: ['itemtype_pop',]
    };

    if (typeof requests.id != "undefined" && requests.id != "") {
      match["_id"] = requests.id;
    }

    if (pagination == "true") {
      ItemMaster.paginate(match, options, function (err, item) {
        return res.apiResponse(true, "Success", { item });
      });
    } else {
      var item = await ItemMaster.find(match)
        .sort(sort)
        .populate(options.populate);
      return res.apiResponse(true, "Success", { item });
    }
  } catch (error) {
    console.log("exports.get_item -> error", error);
    return res.apiResponse(false, "get_item  failed", {});
  }
};

exports.get_item_suggestions = async (req, res, next) => {
  try {
    const { search, selectedtype } = req.bodyParams;
    const match = {};

    if (search && search.trim()) {
      const escaped = escapeRegExp(search.trim());
      match.name = { $regex: new RegExp("^" + escaped, "i") };
    }

    if (selectedtype) {
      match.typeCode = selectedtype;
    }

    const items = await ItemMaster.find(match).limit(10).sort({ name: 1 }).select("_id name code typeCode convertUnit").lean();
    return res.apiResponse(true, "Suggestions fetched", items);
  } catch (error) {
    console.log("get_item_suggestions error:", error);
    return res.apiResponse(false, "Suggestion fetch failed", []);
  }
};



exports.get_conversion_factor = async (req, res) => {
  try {
    const { id } = req.bodyParams;

    let query = { is_deleted: false };
    if (id) {
      query._id = id;
    }

    const factors = await ConversionFactor.find(query);
    return res.json({ success: true, data: factors });
  } catch (error) {
    console.error("get_conversion_factor error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


exports.update_conversion_factor = async (req, res) => {
  try {
    let { name, inrToUsd } = req.bodyParams;
    inrToUsd = Number(inrToUsd);
    if (!name || isNaN(inrToUsd)) {
      return res.apiResponse(false, "Invalid input");
    }
    const factor = await ConversionFactor.findOneAndUpdate(
      { name },
      { $set: { name, inrToUsd } },
      { new: true }
    ).exec();
    await bulk_update_support.update_sheet_factor(factor)

    await logAction({
      section: "conversion",
      user: req.bodyParams?.user?._id,
      action: "update",
      description: `Updated Conversion Factor: <b>${name}</b> (INR to USD: ${inrToUsd})`,
      data: { name, inrToUsd }
    });

    return res.apiResponse(true, "Conversion factor saved", factor);
  } catch (error) {
    console.error("update_conversion_factor error:", error);
    return res.apiResponse(false, "Server error");
  }
};

exports.vendor_code = async (req, res, next) => {
  try {
    var requests = req.bodyParams;
    requests = await commonHelper.trimObjc(requests);
    if (requests.code) {
      var checkSuppliercode = await Supplier.findOne({ code: requests.code });
    } else {
      var checkSuppliercode = false;
    }
    if (checkSuppliercode) {
      return res.apiResponse(false, "Supplier Code Already Exists.");
    } else {
      return res.apiResponse(true);
    }
  } catch (error) {
    console.log("exports.Supplier_code -> error", error);
    return res.apiResponse(false, "Supplier_code check failed", {});
  }
};

exports.customer_code = async (req, res, next) => {
  try {
    var requests = req.bodyParams;
    requests = await commonHelper.trimObjc(requests);
    if (requests.code) {
      var checkcustomercode = await Customer.findOne({
        customer_code: requests.code,
      });
    } else {
      var checkcustomercode = false;
    }
    if (checkcustomercode) {
      return res.apiResponse(false, "Customer Code Already Exists.");
    } else {
      return res.apiResponse(true);
    }
  } catch (error) {
    console.log("exports.customer_code -> error", error);
    return res.apiResponse(false, "customer_code check failed", {});
  }
};

exports.update_rate = async (req, res, next) => {
  try {
    let requests = req.bodyParams;
    requests = await commonHelper.trimObjc(requests);
    if (requests._id) {
      if (requests.gst !== undefined) {
        let gstVal = 0;
        if ((requests.currency || '').toUpperCase() === 'INR') {
          gstVal = Number(requests.gst) || 0;
        }
        requests.gst = gstVal;
        requests.gstCGST = Number((gstVal / 2).toFixed(3));
        requests.gstSGST = Number((gstVal / 2).toFixed(3));
      }
      if (requests.rate !== undefined) {
        requests.rate = Number(Number(requests.rate).toFixed(3));
      }
      const existPrice = await PriceMaster.findOne({ _id: requests._id })
      if (!existPrice) {
        return res.apiResponse(false, "PriceMaster record not found");
      }
      if (existPrice.rate !== requests.prevrate) {
        requests.prevrate = existPrice.rate
        requests.basicUpdatedate = new Date()
      }
      const masterrate = await PriceMaster.findOneAndUpdate(
        { _id: requests._id },
        { $set: requests },
        { new: true }
      ).exec();

      if (!masterrate) {
        return res.apiResponse(false, "PriceMaster record not found");
      }
      await bulk_update_support.update_sheet_price(masterrate)

      await logAction({
        section: "price",
        user: requests.user?._id,
        action: "update",
        description: `Updated Price for <b>${masterrate.name}</b> (Code: ${masterrate.code}, Rate: ${masterrate.rate})`,
        data: requests
      });

      return res.apiResponse(true, "Price Updated Successfully", { masterrate });
    } else {
      requests.prevrate = 0
      requests.prevGrnrate = 0
      const new_rate = new PriceMaster(requests);
      await new_rate.save();

      await logAction({
        section: "price",
        user: requests.user?._id,
        action: "create",
        description: `Created new Price for <b>${new_rate.name}</b> (Code: ${new_rate.code}, Rate: ${new_rate.rate})`,
        data: requests
      });

      return res.apiResponse(true, "Price Added Successfully");
    }
  } catch (error) {
    console.error("Error in update_rate:", error);
    return res.apiResponse(false, "Something went wrong", {
      error: error.message,
    });
  }
};

exports.update_group = async (req, res, next) => {
  try {
    let requests = req.bodyParams || req.body;
    const user = requests.user;
    requests = await commonHelper.trimObjc(requests);

    const { id, _id, name: reqName, ...cleanedRequests } = requests;

    if (!reqName) {
      return res.apiResponse(false, "Name is required for group update.");
    }

    const priceMasters = await PriceMaster.find({ name: reqName });

    if (!priceMasters.length) {
      return res.apiResponse(
        false,
        "No PriceMaster records found for name: " + reqName
      );
    }

    if ("name" in cleanedRequests) {
      delete cleanedRequests.name;
    }

    const updatedPriceMasters = [];
    const logData = {};
    const logChanges = [];

    const excludeFields = [
      "createdAt",
      "updatedAt",
      "_id",
      "id",
      "__v",
      "user",
    ];

    for (let pm of priceMasters) {
      const changes = {};
      const updateFields = {};

      for (let key in cleanedRequests) {
        if (
          excludeFields.includes(key) ||
          pm[key] === undefined ||
          cleanedRequests[key] === undefined ||
          pm[key] === cleanedRequests[key]
        ) {
          continue;
        }

        // Record only actual changes
        changes[key] = {
          from: pm[key],
          to: cleanedRequests[key],
        };
        updateFields[key] = cleanedRequests[key];
      }

      if (Object.keys(updateFields).length > 0) {
        const updated = await PriceMaster.findOneAndUpdate(
          { _id: pm._id },
          { $set: updateFields },
          { new: true }
        ).exec();

        updatedPriceMasters.push(updated);
        logData[pm.code] = changes;

        const changeStrings = Object.keys(changes).map(
          (key) =>
            `<b>${key}</b>: <b>"${changes[key].from}"</b> → <b>"${changes[key].to}"</b>`
        );

        logChanges.push(
          `Updated code <b>${pm.code}</b>: ` + changeStrings.join(", ")
        );
      }
    }

    const updateCostSheets = async (code, rateData) => {
      const costSheets = await Costsheet.find({
        "stage.ingredients.code": code,
      });

      const bulkOperations = [];

      for (let sheet of costSheets) {
        if (!Array.isArray(sheet.stage)) continue;

        let isUpdated = false;

        for (let stage of sheet.stage) {
          for (let item of stage.ingredients) {
            if (item.code === code) {
              const rate = parseFloat(rateData.rate);
              const gst = parseFloat(rateData.gst || "18");
              const excise = parseFloat(((rate * gst) / 100).toFixed(2));
              const cess = 0;
              const percentage = 2;
              const cst = parseFloat(
                (((rate + excise + cess) * percentage) / 100).toFixed(2)
              );
              const total = parseFloat((rate + excise + cess + cst).toFixed(2));
              const value = parseFloat(
                (parseFloat(item.requestQty) * total).toFixed(2)
              );
              const modvat = parseFloat(
                ((excise + cess) * parseFloat(item.requestQty)).toFixed(2)
              );
              const netamt = parseFloat((value - modvat).toFixed(2));

              item.rate = rate;
              item.gst = gst;
              item.excise = excise;
              item.cess = cess;
              item.percentage = percentage;
              item.cst = cst;
              item.total = total;
              item.value = value;
              item.modvat = modvat;
              item.netamt = netamt;

              isUpdated = true;
            }
          }
        }

        if (isUpdated) {
          bulkOperations.push({
            updateOne: {
              filter: { _id: sheet._id },
              update: { $set: { stage: sheet.stage } },
            },
          });
        }
      }

      if (bulkOperations.length > 0) {
        await Costsheet.bulkWrite(bulkOperations);
        console.log(
          `Updated ${bulkOperations.length} cost sheets for code: ${code}`
        );
      }
    };

    for (let updatedPM of updatedPriceMasters) {
      await updateCostSheets(updatedPM.code, cleanedRequests);
    }

    if (logChanges.length > 0) {
      await logAction({
        section: "price",
        user: user?._id,
        action: "update",
        description:
          `Group update for <b>${reqName}</b>:<br>` + logChanges.join("<br>"),
        data: logData,
      });
    }

    return res.apiResponse(
      true,
      `Rates Updated Successfully for name: ${reqName}`,
      {
        updated: updatedPriceMasters.length,
      }
    );
  } catch (err) {
    console.error("Error updating rates:", err);
    return res.apiResponse(false, "Error updating rates: " + err.message);
  }
};

exports.check_price = async (req, res, next) => {
  try {
    var requests = await commonHelper.trimObjc(req.bodyParams);
    if (requests.code) {
      var item = await ItemMaster.findOne({ item_code: requests.code });
      var existingItem = await PriceMaster.findOne({ item_id: item._id });
      if (existingItem) {
        return res.apiResponse(false, "Item Already Exists.");
      } else {
        return res.apiResponse(true);
      }
    } else {
      return res.apiResponse(true);
    }
  } catch (error) {
    console.log("exports.check_price -> error", error);
    return res.apiResponse(false, "Item code check failed", {});
  }
};

exports.delete_rate = async (req, res, next) => {
  const requests = req.bodyParams;
  const user = requests.user;

  try {
    const rate = await PriceMaster.findOne({ _id: requests.id }).lean();
    if (!rate) {
      return res.apiResponse(false, "Rate not found");
    }

    await PriceMaster.deleteOne({ _id: requests.id });

    await logAction({
      section: "price",
      user: user?._id,
      action: "delete",
      description: `Deleted "<b>${rate.name}</b>" with code "<b>${rate.code}</b>"`,
      data: rate,
    });

    return res.apiResponse(true, "Price Deleted Successfully");
  } catch (error) {
    console.error("Error deleting Price:", error);
    return res.apiResponse(false, "Error deleting Price");
  }
};


exports.get_bulk_rate = async (req, res, next) => {
  try {
    const requests = req.bodyParams;
    const match = {};
    let sort = { createdAt: -1 };
    if (requests.codes && Array.isArray(requests.codes)) {
      match["code"] = { $in: requests.codes };
    }
    const rate = await PriceMaster.find(match).sort(sort).lean();

    const items = await ItemMaster.find(match).select("code percentage").lean();
    const itemMap = new Map();
    items.forEach(item => itemMap.set(item.code, item.percentage || 0));

    const enrichedRate = rate.map(r => ({
      ...r,
      percentage: itemMap.has(r.code) ? itemMap.get(r.code) : 0
    }));

    return res.apiResponse(true, "Success", { rate: enrichedRate });
  } catch (error) {
    console.error("get_bulk_rate error:", error);
    return res.apiResponse(false, "Error fetching rates", []);
  }
};



exports.get_rate = async (req, res, next) => {
  try {
    const requests = req.bodyParams;
    const page = requests.page || 1;
    const per_page = requests.per_page || 10;
    const pagination = requests.pagination === "true";
    const match = {};
    let sort = { createdAt: -1 };

    if (requests.sort) {
      switch (requests.sort) {
        case "rate_asc":
          sort = { item_rate: 1 };
          break;
        case "rate_desc":
          sort = { item_rate: -1 };
          break;
        case "code_asc":
          sort = { code: 1 };
          break;
        case "code_desc":
          sort = { code: -1 };
          break;
      }
    }

    if (requests.id) {
      match["_id"] = requests.id;
    }

    if (requests.item_code) {
      match["code"] = requests.item_code;
    }

    if (requests.category) {
      match["item_category"] = requests.category;
    }

    if (requests.type_code) {
      const item_detail = await ItemMaster.find({ typeCode: { $in: requests.type_code } }).lean();
      const itemIDs = item_detail.map((item) => String(item._id));
      match["itemID"] = itemIDs.length > 0 ? { $in: itemIDs } : [];
    }

    if (requests.code && requests.code.length > 0) {
      const item_detail = await ItemMaster.find({ code: { $in: requests.code } }).lean();
      const itemIDs = item_detail.map((item) => String(item._id));
      match["itemID"] = itemIDs.length > 0 ? { $in: itemIDs } : [];
    }

    if (requests.search && requests.search !== "") {
      match.$or = [
        { name: { $regex: new RegExp(requests.search.trim(), "i") } },
        { code: { $regex: new RegExp("^" + requests.search.trim(), "i") } },
      ];
    }

    if (requests.currency && requests.currency.length > 0) {
      match["currency"] = { $in: requests.currency };
    }

    const options = {
      page,
      limit: per_page,
      sort,
      populate: ['item_pop'],
    };

    if (pagination) {
      PriceMaster.paginate(match, options, function (err, rate) {
        return res.apiResponse(true, "Success", { rate });
      });
    } else {
      const rate = await PriceMaster.find(match).sort(sort).lean().populate(options.populate);
      return res.apiResponse(true, "Success", { rate });
    }
  } catch (error) {
    console.error("get_rate error:", error);
    return res.apiResponse(false, "Error fetching rates", []);
  }
};




exports.get_group = async (req, res, next) => {
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
  };

  // Handle sorting logic
  if (requests.sort) {
    switch (requests.sort) {
      case "rate_asc":
        sort = { item_rate: 1 };
        options.sort = sort;
        break;
      case "rate_desc":
        sort = { item_rate: -1 };
        options.sort = sort;
        break;
    }
  }

  // Filtering logic
  let filtersApplied = false;

  if (requests.id) {
    match["_id"] = requests.id;
    filtersApplied = true;
  }

  if (requests.category) {
    match["item_category"] = requests.category;
    filtersApplied = true;
  }

  // Search logic
  if (requests.search && requests.search.trim() !== "") {
    filtersApplied = true;
    const searchStr = await escapeRegExp(requests.search.trim());

    const item_detail = await PriceMaster.find({
      $or: [
        { name: { $regex: new RegExp(searchStr, "i") } },
        { code: { $regex: new RegExp("^" + searchStr, "i") } },
      ],
    });

    const itemIDs = item_detail.map((item) => item._id); // Keep as ObjectId
    if (itemIDs.length) {
      match["_id"] = { $in: itemIDs };
    } else {
      // Ensure no documents match if search yields nothing
      match["_id"] = { $in: [] };
    }
  }

  // If any filter or search is applied, use normal logic
  if (filtersApplied) {
    const allRates = await PriceMaster.find(match).sort(sort).populate([]);

    // Unique by name
    const seenNames = new Set();
    const uniqueRates = [];

    for (let item of allRates) {
      if (!seenNames.has(item.name)) {
        seenNames.add(item.name);
        uniqueRates.push(item);
      }
    }

    const totalDocs = uniqueRates.length;
    const totalPages = Math.ceil(totalDocs / per_page);
    const currentPage = page;
    const pagedRates = uniqueRates.slice(
      (page - 1) * per_page,
      page * per_page
    );

    if (pagination === "true") {
      return res.apiResponse(true, "Success", {
        pagedRates,
        totalDocs,
        page: currentPage,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
        nextPage: currentPage < totalPages ? currentPage + 1 : null,
        prevPage: currentPage > 1 ? currentPage - 1 : null,
        pagingCounter: (page - 1) * per_page + 1,
        limit: per_page,
      });
    } else {
      try {
        const rate = await PriceMaster.find(match).sort(sort).populate([]);
        return res.apiResponse(true, "Success", { pagedRates: rate });
      } catch (err) {
        return res.apiResponse(false, "Error while fetching rates", {
          error: err,
        });
      }
    }
  } else {
    // No filters/search → group by base code (first segment)
    // let allRates = await PriceMaster.find(match).sort(sort);
    // let seen = new Set();
    // let uniqueRates = [];

    // for (let rate of allRates) {
    //     let code = rate.code || '';
    //     // let baseCode = code.split('-')[0]; // Only the first segment
    //     let baseCode = code.includes(':') || code.includes('-')
    //         ? code.split(/[:\-]/).slice(0, -1).join(code.includes(':') ? ':' : '-')
    //         : code;
    //         if (!seen.has(baseCode)) {
    //             seen.add(baseCode);
    //             uniqueRates.push(rate);
    //         }
    //     }
    // }

    const allRates = await PriceMaster.find(match).sort(sort).populate([]);

    // Unique by name
    const seenNames = new Set();
    const uniqueRates = [];

    for (let item of allRates) {
      if (!seenNames.has(item.name)) {
        seenNames.add(item.name);
        uniqueRates.push(item);
      }
    }
    // Manual pagination, but return in paginate format
    const totalDocs = uniqueRates.length;
    const totalPages = Math.ceil(totalDocs / per_page);
    const currentPage = page;
    const pagedRates = uniqueRates.slice(
      (page - 1) * per_page,
      page * per_page
    );

    if (pagination === "true") {
      return res.apiResponse(true, "Success", {
        pagedRates,
        totalDocs,
        page: currentPage,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
        nextPage: currentPage < totalPages ? currentPage + 1 : null,
        prevPage: currentPage > 1 ? currentPage - 1 : null,
        pagingCounter: (page - 1) * per_page + 1,
        limit: per_page,
      });
    } else {
      return res.apiResponse(true, "Success", { pagedRates });
    }
  }
};

exports.customer_sapcode = async (req, res, next) => {
  try {
    var requests = req.bodyParams;
    requests = await commonHelper.trimObjc(requests);
    if (requests.code) {
      var checkcustomercode = await Customer.findOne({
        customer_sapcode: requests.code,
      });
    } else {
      var checkcustomercode = false;
    }
    if (checkcustomercode) {
      return res.apiResponse(false, "Sap Code Already Exists.");
    } else {
      return res.apiResponse(true);
    }
  } catch (error) {
    console.log("exports.Sap_code -> error", error);
    return res.apiResponse(false, "Sap_code check failed", {});
  }
};

exports.update_customer = async (req, res, next) => {
  var requests = req.bodyParams;
  requests = await commonHelper.trimObjc(requests);
  const user = requests.user;
  requests.email = requests.email.toLowerCase();
  if (requests.id) {
    const customer = await Customer.findOneAndUpdate(
      { _id: requests.id },
      { $set: requests },
      { new: true }
    ).exec();
    await logAction({ section: "customer", user: user?._id, action: "update", description: `Updated Customer: <b>${customer.name}</b>`, data: requests });
    return res.apiResponse(true, "Customer Updated Successfully", { customer });
  } else {
    var new_customer = new Customer(requests);
    await new_customer.save();
    await logAction({ section: "customer", user: user?._id, action: "create", description: `Created new Customer: <b>${new_customer.name}</b>`, data: requests });
    return res.apiResponse(true, "Customer Added Successfully");
  }
};

exports.delete_customer = async (req, res, next) => {
  var requests = req.bodyParams;
  try {
    const customer = await Customer.findOne({ _id: requests.id });
    if (customer) {
      const customerName = customer.name;
      await customer.deleteOne();

      await logAction({
        section: "customer",
        user: requests.user?._id,
        action: "delete",
        description: `Deleted Customer: <b>${customerName}</b>`,
        data: customer
      });

      return res.apiResponse(true, "customer Deleted Successfully");
    } else {
      return res.apiResponse(false, "customer not found");
    }
  } catch (error) {
    console.error(error);
    return res.apiResponse(false, "Error deleting customer ");
  }
};

exports.get_customer = async (req, res, next) => {
  var requests = req.bodyParams;
  var page = requests.page || 1;
  var per_page = requests.per_page || 10;
  var pagination = requests.pagination || "false";
  const match = {};
  var sort = { createdAt: -1 };

  if (requests.sort != "") {
    switch (requests.sort) {
      case "sapcode_asc":
        sort = { customer_sapcode: 1 };
        break;
      case "sapcode_desc":
        sort = { customer_sapcode: -1 };
        break;
      case "code_asc":
        sort = { customer_code: 1 };
        break;
      case "code_desc":
        sort = { customer_code: -1 };
        break;
      case "name_asc":
        sort = { name: 1 };
        break;
      case "name_desc":
        sort = { name: -1 };
        break;
      case "gst_asc":
        sort = { gst: 1 };
        break;
      case "gst_desc":
        sort = { gst: -1 };
        break;
      case "address_asc":
        sort = { address: 1 };
        break;
      case "address_desc":
        sort = { address: -1 };
        break;
      default:
    }
  }

  const options = {
    page: page,
    limit: per_page,
    sort: sort,
  };

  if (requests.search_customer && requests.search_customer !== "") {
    match.name = { $regex: new RegExp(requests.search_customer, "i") };
  }
  if (requests.customer && requests.customer !== "") {
    match._id = requests.customer;
  }

  if (requests.search && requests.search !== "") {
    match.$or = [
      { customer_code: { $regex: new RegExp("^" + requests.search, "i") } },
      { name: { $regex: new RegExp(requests.search, "i") } },
      { email: { $regex: new RegExp("^" + requests.search, "i") } },
    ];
  }

  if (typeof requests.id != "undefined" && requests.id != "") {
    match["_id"] = requests.id;
  }
  if (pagination == "true") {
    Customer.paginate(match, options, function (err, customers) {
      return res.apiResponse(true, "Success", { customers });
    });
  } else {
    var customers = await Customer.find(match).sort(sort);
    return res.apiResponse(true, "Success", { customers });
  }
};

exports.update_unit = async (req, res, next) => {
  try {
    var requests = req.bodyParams;
    const user = requests.user;
    requests = await commonHelper.trimObjc(requests);
    if (requests.id) {
      const units = await Unit.findOneAndUpdate(
        { _id: requests.id },
        { $set: requests },
        { new: true }
      ).exec();

      await logAction({
        section: "unit",
        user: user?._id,
        action: "update",
        description: `Updated Unit Master: <b>${units.name}</b>`,
        data: requests
      });

      return res.apiResponse(true, "Licence Updated Successfully", { units });
    } else {
      var new_unit = new Unit(requests);
      await new_unit.save();

      await logAction({
        section: "unit",
        user: user?._id,
        action: "create",
        description: `Created new Unit Master: <b>${new_unit.name}</b>`,
        data: requests
      });

      return res.apiResponse(true, "Unit Added Successfully");
    }
  } catch (error) {
    console.error(error);
    return res.apiResponse(false, "Error update Unit");
  }
};

exports.get_unit = async (req, res, next) => {
  try {
    var requests = req.bodyParams;
    var page = requests.page || 1;
    var per_page = requests.per_page || 10;
    var pagination = requests.pagination || "false";
    const match = {};
    var sort = { createdAt: -1 };

    if (requests.sort != "") {
      switch (requests.sort) {
        case "name_asc":
          sort = { name: 1 };
          break;
        case "name_desc":
          sort = { name: -1 };
          break;
        case "abbr_asc":
          sort = { abbreviation: 1 };
          break;
        case "abbr_desc":
          sort = { abbreviation: -1 };
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
      Unit.paginate(match, options, function (err, units) {
        return res.apiResponse(true, "Success", { units });
      });
    } else {
      var units = await Unit.find(match).sort(sort);
      return res.apiResponse(true, "Success", { units });
    }
  } catch (error) {
    console.error(error);
    return res.apiResponse(false, "Error getting Unit");
  }
};

exports.delete_unit = async (req, res, next) => {
  var requests = req.bodyParams;
  try {
    const unit = await Unit.findOne({ _id: requests.id });
    if (unit) {
      await unit.deleteOne();
      return res.apiResponse(true, "Unit Deleted Successfully");
    } else {
      return res.apiResponse(false, "Unit not found");
    }
  } catch (error) {
    console.error(error);
    return res.apiResponse(false, "Error deleting Unit");
  }
};

exports.update_bomType = async (req, res, next) => {
  try {
    var requests = req.bodyParams;
    requests = await commonHelper.trimObjc(requests);
    if (requests.id) {
      const bomtype = await BomType.findOneAndUpdate(
        { _id: requests.id },
        { $set: requests },
        { new: true }
      ).exec();
      return res.apiResponse(true, "bomtype Updated Successfully", { bomtype });
    } else {
      var new_bomtype = new BomType(requests);
      await new_bomtype.save();
      return res.apiResponse(true, "bomtype Added Successfully");
    }
  } catch (error) {
    update;
    console.error(error);
    return res.apiResponse(false, "Error update bomtype");
  }
};

exports.get_bomType = async (req, res, next) => {
  try {
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
    };

    if (typeof requests.id != "undefined" && requests.id != "") {
      match["_id"] = requests.id;
    }
    if (pagination == "true") {
      BomType.paginate(match, options, function (err, bomtype) {
        return res.apiResponse(true, "Success", { bomtype });
      });
    } else {
      var bomtype = await BomType.find(match).sort(sort);
      return res.apiResponse(true, "Success", { bomtype });
    }
  } catch (error) {
    console.error(error);
    return res.apiResponse(false, "Error getting bomtype");
  }
};


exports.update_pack = async (req, res, next) => {
  try {
    let requests = req.bodyParams;
    const user = requests.user;

    requests = await commonHelper.trimObjc(requests);

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

    if (requests.id) {
      const existingPack = await Packtype.findById(requests.id).lean();
      const packtype = await Packtype.findOneAndUpdate(
        { _id: requests.id },
        { $set: requests },
        { new: true }
      ).exec();

      if (!packtype) {
        return res.apiResponse(false, "Pack type not found");
      }

      const updatedFields = [];

      for (const key in requests) {
        if (
          excludeFields.includes(key) ||
          typeof requests[key] === "object" ||
          existingPack[key] === requests[key]
        ) {
          continue;
        }

        updatedFields.push(
          `<b>${capitalizeFirstLetter(
            key
          )}</b>: changed from <b>"${formatDateIfISO(
            existingPack[key] ?? ""
          )}"</b> to <b>"${formatDateIfISO(requests[key])}"</b>`
        );

        logData[key] = {
          from: existingPack[key] ?? "",
          to: requests[key],
        };
      }

      if (updatedFields.length === 0) {
        logDescription = `Updated "<b>${requests.name}</b>", but no fields changed.`;
      } else {
        logDescription =
          `Updated "<b>${requests.name}</b>": ` + updatedFields.join(", ");
      }

      actionType = "update";

      await logAction({
        section: "fg",
        user: user?._id,
        action: actionType,
        description: logDescription,
        data: logData,
      });

      return res.apiResponse(true, "Pack type Updated Successfully", {
        packtype,
      });
    } else {
      const new_pack = new Packtype(requests);
      await new_pack.save();

      const fields = Object.entries(requests)
        .filter(([key, val]) => !excludeFields.includes(key) && val !== "")
        .map(([key, val]) => {
          return `<b>${capitalizeFirstLetter(key)}</b>: <b>"${formatDateIfISO(
            val
          )}"</b>`;
        })
        .join(", ");

      logDescription =
        `Created pack type "<b>${requests.name}</b>" with fields: ` + fields;
      logData = requests;
      actionType = "create";

      await logAction({
        section: "fg",
        user: user?._id,
        action: actionType,
        description: logDescription,
        data: logData,
      });

      return res.apiResponse(true, "Pack type Added Successfully");
    }
  } catch (error) {
    console.error(error);
    return res.apiResponse(false, "Error updating Pack type");
  }
};

exports.delete_pack = async (req, res, next) => {
  const requests = req.bodyParams;
  try {
    const pack = await Packtype.findOne({ _id: requests.id });
    if (pack) {
      await pack.deleteOne();

      const logDescription = `Deleted Pack type "<b>${pack.name}</b>"`;
      const logData = {
        id: pack._id,
        name: pack.name,
      };

      await logAction({
        section: "fg",
        user: requests.user?._id,
        action: "delete",
        description: logDescription,
        data: logData,
      });

      return res.apiResponse(true, "Pack type Deleted Successfully");
    } else {
      return res.apiResponse(false, "Pack type not found");
    }
  } catch (error) {
    console.error(error);
    return res.apiResponse(false, "Error deleting Pack type");
  }
};

exports.get_pack = async (req, res, next) => {
  try {
    var requests = req.bodyParams;
    var page = requests.page || 1;
    var per_page = requests.per_page || 10;
    var pagination = requests.pagination || "false";
    const match = {};
    var sort = { createdAt: -1 };

    if (requests.sort != "") {
      switch (requests.sort) {
        case "name_asc":
          sort = { name: 1 };
          break;
        case "name_desc":
          sort = { name: -1 };
          break;
        case "code_asc":
          sort = { code: 1 };
          break;
        case "code_desc":
          sort = { code: -1 };
          break;
        default:
      }
    }

    const options = {
      page: page,
      limit: per_page,
      sort: sort,
    };

    if (requests.search && requests.search !== "") {
      match.$or = [
        { code: { $regex: new RegExp("^" + requests.search, "i") } },
        { name: { $regex: new RegExp(requests.search, "i") } },
      ];
    }

    if (typeof requests.id != "undefined" && requests.id != "") {
      match["_id"] = requests.id;
    }
    if (pagination == "true") {
      Packtype.paginate(match, options, function (err, packtype) {
        return res.apiResponse(true, "Success", { packtype });
      });
    } else {
      var packtype = await Packtype.find(match).sort(sort);
      return res.apiResponse(true, "Success", { packtype });
    }
  } catch (error) {
    console.error(error);
    return res.apiResponse(false, "Error getting packtype");
  }
};

exports.update_conversion = async (req, res, next) => {
  try {
    var requests = req.bodyParams;
    const user = requests.user;
    requests = await commonHelper.trimObjc(requests);
    if (requests.id) {
      const updatedConversion = await Conversion.findOneAndUpdate(
        { _id: requests.id },
        { $set: requests },
        { new: true }
      ).exec();
      await Conversionmaster.deleteMany({ conversionID: requests.id });
      for (let data of requests.conversionData) {
        const update = {
          conversionID: requests.id,
          particularTo: data.particularTo,
          particularFrom: data.particularFrom,
          amount: data.amount,
        };
        const new_conversion_master = new Conversionmaster(update);
        await new_conversion_master.save();
      }
      await logAction({ section: "conversion", user: user?._id, action: "update", description: `Updated Conversion Master: <b>${updatedConversion.name || 'Factor'}</b>`, data: requests });
      return res.apiResponse(true, "DPCO conversion Updated Successfully", {
        conversion: updatedConversion,
      });
    } else {
      var new_conversion = new Conversion(requests);
      await new_conversion.save();
      for (let data of requests.conversionData) {
        var update = {
          conversionID: new_conversion.id,
          particularTo: data.particularTo,
          particularFrom: data.particularFrom,
          amount: data.amount,
        };
        var new_conversion_master = new Conversionmaster(update);
        await new_conversion_master.save();
      }
      await logAction({ section: "conversion", user: user?._id, action: "create", description: `Created new Conversion Master: <b>${new_conversion.name || 'Factor'}</b>`, data: requests });
      return res.apiResponse(true, "DPCO conversion Added Successfully");
    }
  } catch (error) {
    console.error(error);
    return res.apiResponse(false, "Error update conversion");
  }
};

exports.get_conversion = async (req, res, next) => {
  try {
    var requests = req.bodyParams;
    var page = requests.page || 1;
    var per_page = requests.per_page || 10;
    var pagination = requests.pagination || "false";
    const match = {};
    var sort = { createdAt: -1 };

    if (requests.sort != "") {
      switch (requests.sort) {
        case "name_asc":
          sort = { name: 1 };
          break;
        case "name_desc":
          sort = { name: -1 };
          break;
        default:
      }
    }

    const options = {
      page: page,
      limit: per_page,
      sort: sort,
      populate: [
        "fGtypePOP",
        "subtypePOP",
        "dosagePOP",
        "uomID",
        "conversionPOP",
      ],
    };

    if (typeof requests.id != "undefined" && requests.id != "") {
      match["_id"] = requests.id;
    }

    if (typeof requests.fGtypeID != "undefined" && requests.fGtypeID != "") {
      match["fGtypeID"] = requests.fGtypeID;
    }
    if (typeof requests.subtypeID != "undefined" && requests.subtypeID != "") {
      match["subtypeID"] = requests.subtypeID;
    }
    if (typeof requests.dosageID != "undefined" && requests.dosageID != "") {
      match["dosageID"] = requests.dosageID;
    }

    if (pagination == "true") {
      Conversion.paginate(match, options, function (err, conversion) {
        return res.apiResponse(true, "Success", { conversion });
      });
    } else {
      var conversion = await Conversion.find(match)
        .sort(sort)
        .populate(["fGtypePOP", "subtypePOP", "dosagePOP", "conversionPOP"]);
      return res.apiResponse(true, "Success", { conversion });
    }
  } catch (error) {
    console.error(error);
    return res.apiResponse(false, "Error getting conversion");
  }
};

exports.delete_conversion = async (req, res, next) => {
  try {
    const requests = req.bodyParams;
    const conversion = await Conversion.findOne({ _id: requests.id });
    if (conversion) {
      await Conversionmaster.deleteMany({ conversionID: requests.id });
      await conversion.deleteOne();
      return res.apiResponse(true, "DPCO conversion deleted successfully");
    } else {
      return res.apiResponse(false, "DPCO conversion not found");
    }
  } catch (error) {
    console.error("Error in delete_conversion:", error);
    return res.apiResponse(false, "Error deleting DPCO conversion");
  }
};

exports.get_packing = async (req, res, next) => {
  try {
    var requests = req.bodyParams;
    var page = requests.page || 1;
    var per_page = requests.per_page || 10;
    var pagination = requests.pagination || "false";
    const match = {};
    var sort = { createdAt: -1 };

    if (requests.sort != "") {
      switch (requests.sort) {
        case "name_asc":
          sort = { name: 1 };
          break;
        case "name_desc":
          sort = { name: -1 };
          break;
        default:
      }
    }

    const options = {
      page: page,
      limit: per_page,
      sort: sort,
      populate: ["Packing_pop", "uomID", "packmasterPOP"],
    };

    if (requests.search && requests.search !== "") {
      const packIDs = await Packtype.find({
        name: { $regex: new RegExp(requests.search, "i") },
      });
      if (packIDs.length > 0) {
        match.packingID = { $in: packIDs.map((pack) => pack._id) };
      }
    }

    if (typeof requests.id != "undefined" && requests.id != "") {
      match["_id"] = requests.id;
    }

    if (typeof requests.uomID != "undefined" && requests.uomID != "") {
      match["uomID"] = requests.uomID;
    }

    if (typeof requests.packingID != "undefined" && requests.packingID != "") {
      match["packingID"] = requests.packingID;
    }

    if (pagination == "true") {
      Packing.paginate(match, options, function (err, packing) {
        return res.apiResponse(true, "Success", { packing });
      });
    } else {
      var packing = await Packing.find(match)
        .sort(sort)
        .populate(["packmasterPOP"]);
      return res.apiResponse(true, "Success", { packing });
    }
  } catch (error) {
    console.error(error);
    return res.apiResponse(false, "Error getting packing");
  }
};

exports.delete_packing = async (req, res, next) => {
  try {
    var requests = req.bodyParams;
    const packing = await Packing.findOne({ _id: requests.id });
    if (packing) {
      await Packingmaster.deleteMany({ packID: requests.id });
      await packing.deleteOne();
      return res.apiResponse(true, "DPCO packing Deleted Successfully");
    } else {
      return res.apiResponse(false, "DPCO packing not found");
    }
  } catch (error) {
    console.error(error);
    return res.apiResponse(false, "Error deleting DPCO packing");
  }
};

exports.get_itemtype = async (req, res, next) => {
  var requests = req.bodyParams;
  var page = requests.page || 1;
  var per_page = requests.per_page || 10;
  var pagination = requests.pagination || "false";
  const match = {};
  var sort = { createdAt: -1 };

  if (requests.search && requests.search !== "") {
    match.$or = [
      { name: { $regex: new RegExp(requests.search, "i") } },
      { code: { $regex: new RegExp("^" + requests.search, "i") } },
    ];
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
        sort = { code: 1 };
        break;
      case "code_desc":
        sort = { code: -1 };
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
    Itemtype.paginate(match, options, function (err, itemtype) {
      return res.apiResponse(true, "Success", { itemtype });
    });
  } else {
    var itemtype = await Itemtype.find(match).sort(sort);
    return res.apiResponse(true, "Success", { itemtype });
  }
};

exports.update_itemtype = async (req, res, next) => {
  var requests = req.bodyParams;
  requests = await commonHelper.trimObjc(requests);
  if (requests.id) {
    const itemtype = await Itemtype.findOneAndUpdate(
      { _id: requests.id },
      { $set: requests },
      { new: true }
    ).exec();
    return res.apiResponse(true, "Itemtype Updated Successfully", { itemtype });
  } else {
    var new_itemtype = new Itemtype(requests);
    await new_itemtype.save();
    return res.apiResponse(true, "Itemtype Added Successfully");
  }
};

exports.delete_itemtype = async (req, res, next) => {
  var requests = req.bodyParams;
  try {
    const itemtype = await Itemtype.findOne({ _id: requests.id });
    if (itemtype) {
      await itemtype.deleteOne();
      return res.apiResponse(true, "Itemtype Deleted Successfully");
    } else {
      return res.apiResponse(false, "Itemtype not found");
    }
  } catch (error) {
    console.error(error);
    return res.apiResponse(false, "Error deleting Price");
  }
};


exports.get_subtype = async (req, res, next) => {
  try {
    const subtypes = await ItemMaster.distinct("subtypeCode", { subtypeCode: { $ne: null, $ne: "" } });
    return res.apiResponse(true, "Success", { subtypes: subtypes.sort() });
  } catch (error) {
    console.error("Error fetching unique subtypes:", error);
    return res.apiResponse(false, "Error fetching unique subtypes");
  }
};

exports.update_stage = async (req, res, next) => {
  let requests = req.bodyParams;
  requests = await commonHelper.trimObjc(requests);

  try {
    const existingStage = await StageMaster.findOne({
      $or: [{ name: requests.name }, { code: requests.code }],
    }).exec();
    if (
      existingStage &&
      (!requests.id || existingStage._id.toString() !== requests.id)
    ) {
      const duplicateField =
        existingStage.name === requests.name ? "name" : "code";
      return res.apiResponse(false, `Stage ${duplicateField} must be unique`);
    }

    if (requests.id) {
      const stage = await StageMaster.findOneAndUpdate(
        { _id: requests.id },
        { $set: requests },
        { new: true }
      ).exec();
      return res.apiResponse(true, "Stage Updated Successfully", { stage });
    } else {
      const new_stage = new StageMaster(requests);
      await new_stage.save();
      return res.apiResponse(true, "Stage Added Successfully");
    }
  } catch (error) {
    console.error("Error updating/creating stage:", error);
    return res.apiResponse(false, "An error occurred", { error });
  }
};

exports.delete_stage = async (req, res, next) => {
  var requests = req.bodyParams;
  try {
    const subcategory = await StageMaster.findOne({ _id: requests.id });
    if (subcategory) {
      await subcategory.deleteOne();
      return res.apiResponse(true, "Stage Deleted Successfully");
    } else {
      return res.apiResponse(false, "Stage not found");
    }
  } catch (error) {
    console.error(error);
    return res.apiResponse(false, "Error deleting Stage");
  }
};

exports.get_stage = async (req, res, next) => {
  var requests = req.bodyParams;
  var page = requests.page || 1;
  var per_page = requests.per_page || 10;
  var pagination = requests.pagination || "false";
  const match = {};
  var sort = { createdAt: -1 };

  if (requests.search && requests.search !== "") {
    match.$or = [
      { name: { $regex: new RegExp(requests.search, "i") } },
      { code: { $regex: new RegExp("^" + requests.search, "i") } },
    ];
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
        sort = { type_code: 1 };
        break;
      case "code_desc":
        sort = { type_code: -1 };
        break;
      default:
    }
  }

  const options = {
    page: page,
    limit: per_page,
    sort: sort,
    populate: ["type_pop"],
  };

  if (typeof requests.id != "undefined" && requests.id != "") {
    match["_id"] = requests.id;
  }

  if (pagination == "true") {
    StageMaster.paginate(match, options, function (err, stage) {
      return res.apiResponse(true, "Success", { stage });
    });
  } else {
    var stage = await StageMaster.find(match)
      .sort(sort)
      .populate(options.populate);
    return res.apiResponse(true, "Success", { stage });
  }
};

exports.get_price_log = async (req, res, next) => {
  var requests = req.bodyParams;
  var page = requests.page || 1;
  var per_page = requests.per_page || 10;
  var pagination = requests.pagination || "false";
  const match = {};
  var sort = { createdAt: -1 };

  if (requests.search && requests.search !== "") {
    match.$or = [
      { name: { $regex: new RegExp(requests.search, "i") } },
      { code: { $regex: new RegExp("^" + requests.search, "i") } },
    ];
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
        sort = { type_code: 1 };
        break;
      case "code_desc":
        sort = { type_code: -1 };
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
    PriceChangeLog.paginate(match, options, function (err, logs) {
      return res.apiResponse(true, "Success", { logs });
    });
  } else {
    var logs = await PriceChangeLog.find(match)
      .sort(sort);
    return res.apiResponse(true, "Success", { logs });
  }
};

exports.get_erb_logs = async (req, res, next) => {
  try {
    const requests = req.bodyParams || {};

    const page = parseInt(requests.page) || 1;
    const per_page = parseInt(requests.per_page) || 10;
    const pagination = requests.pagination !== "false"; // default true

    const match = {};
    const sort = { createdAt: -1 };

    // 🔍 Search filter
    if (requests.search_customer) {
      const searchRegex = new RegExp(requests.search_customer, "i");
      match.$or = [
        { name: { $regex: searchRegex } },
        { code: { $regex: searchRegex } },
        { bomname: { $regex: searchRegex } },
        { bomcode: { $regex: searchRegex } },
        { itemname: { $regex: searchRegex } }
      ];
    }

    // 📌 Filter by ID
    if (requests.id) {
      match._id = requests.id;
    }

    // 📅 Filter by Date Range
    if (requests.from_date && requests.to_date) {
      const startDate = new Date(requests.from_date);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(requests.to_date);
      endDate.setHours(23, 59, 59, 999);

      match.createdAt = {
        $gte: startDate,
        $lte: endDate
      };
    }

    const options = {
      page,
      limit: per_page,
      sort,
      pagination
    };

    // 📂 Select model based on type
    let Model;

    switch (requests.type) {
      case "BOM":
        Model = ErbBom;
        break;
      case "ITEM":
        Model = ErbItem;
        break;
      case "GRN":
        Model = ErbRate;
        break;
      default:
        return res.apiResponse(false, "Invalid type", {});
    }

    const result = await Model.paginate(match, options);

    return res.apiResponse(true, "Success", result);

  } catch (error) {
    console.error("❌ Error fetching ERP logs:", error);
    return res.apiResponse(false, "Something went wrong", {});
  }
};