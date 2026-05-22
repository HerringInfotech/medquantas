const ErpItemMaster  = require('../models/erp_item_master');
const ErpPriceMaster = require('../models/erp_price_master');
const ErpItemSync    = require('../models/erp_item_sync');
const ErpPriceSync   = require('../models/erp_price_sync');

// ── Item Master — Form Submit ────────────────────────────────

exports.update_item_master = async (req, res) => {
  try {
    var requests = req.bodyParams;
    if (!requests.itemCode || !requests.itemName) {
      return res.apiResponse(false, 'itemCode and itemName are required');
    }
    if (requests._id) {
      const doc = await ErpItemMaster.findOneAndUpdate(
        { _id: requests._id },
        { $set: requests },
        { new: true }
      );
      return res.apiResponse(true, 'Item Master Updated Successfully', { doc });
    } else {
      requests.syncedAt = new Date();
      const doc = await ErpItemMaster.create(requests);
      return res.apiResponse(true, 'Item Master Saved Successfully', { doc });
    }
  } catch (error) {
    console.log('exports.update_item_master -> error', error);
    return res.apiResponse(false, 'Item Master save failed', {});
  }
};

exports.get_item_master = async (req, res) => {
  try {
    var requests = req.bodyParams;
    var page     = requests.page     || 1;
    var per_page = requests.per_page || 50;
    var skip     = (page - 1) * per_page;

    var query = {};
    if (requests.search) {
      query.$or = [
        { itemCode: { $regex: requests.search, $options: 'i' } },
        { itemName: { $regex: requests.search, $options: 'i' } },
      ];
    }

    var total = await ErpItemMaster.countDocuments(query);
    var docs  = await ErpItemMaster.find(query).sort({ createdAt: -1 }).skip(skip).limit(per_page).lean();
    return res.apiResponse(true, 'Item Master List', { docs, total, page, per_page });
  } catch (error) {
    console.log('exports.get_item_master -> error', error);
    return res.apiResponse(false, 'Item Master fetch failed', {});
  }
};

// ── Price Master — Form Submit ───────────────────────────────

exports.update_price_master = async (req, res) => {
  try {
    var requests = req.bodyParams;
    if (!requests.itemCode || !requests.itemName) {
      return res.apiResponse(false, 'itemCode and itemName are required');
    }
    if (requests._id) {
      const doc = await ErpPriceMaster.findOneAndUpdate(
        { _id: requests._id },
        { $set: requests },
        { new: true }
      );
      return res.apiResponse(true, 'Price Master Updated Successfully', { doc });
    } else {
      requests.syncedAt = new Date();
      const doc = await ErpPriceMaster.create(requests);
      return res.apiResponse(true, 'Price Master Saved Successfully', { doc });
    }
  } catch (error) {
    console.log('exports.update_price_master -> error', error);
    return res.apiResponse(false, 'Price Master save failed', {});
  }
};

exports.get_price_master = async (req, res) => {
  try {
    var requests = req.bodyParams;
    var page     = requests.page     || 1;
    var per_page = requests.per_page || 50;
    var skip     = (page - 1) * per_page;

    var query = {};
    if (requests.search) {
      query.$or = [
        { itemCode: { $regex: requests.search, $options: 'i' } },
        { itemName: { $regex: requests.search, $options: 'i' } },
      ];
    }

    var total = await ErpPriceMaster.countDocuments(query);
    var docs  = await ErpPriceMaster.find(query).sort({ createdAt: -1 }).skip(skip).limit(per_page).lean();
    return res.apiResponse(true, 'Price Master List', { docs, total, page, per_page });
  } catch (error) {
    console.log('exports.get_price_master -> error', error);
    return res.apiResponse(false, 'Price Master fetch failed', {});
  }
};

// ── Item Sync — ERP Sync Now ─────────────────────────────────

exports.save_item_sync = async (req, res) => {
  try {
    var requests = req.bodyParams;
    var records  = Array.isArray(requests.records) ? requests.records : [requests];
    var docs     = await ErpItemSync.insertMany(
      records.map(r => ({ ...r, syncedAt: new Date() }))
    );
    return res.apiResponse(true, 'Item Sync Saved Successfully', { count: docs.length });
  } catch (error) {
    console.log('exports.save_item_sync -> error', error);
    return res.apiResponse(false, 'Item Sync save failed', {});
  }
};

exports.get_item_sync = async (req, res) => {
  try {
    var requests = req.bodyParams;
    var page     = requests.page     || 1;
    var per_page = requests.per_page || 50;
    var skip     = (page - 1) * per_page;

    var total = await ErpItemSync.countDocuments();
    var docs  = await ErpItemSync.find().sort({ createdAt: -1 }).skip(skip).limit(per_page).lean();
    return res.apiResponse(true, 'Item Sync List', { docs, total, page, per_page });
  } catch (error) {
    console.log('exports.get_item_sync -> error', error);
    return res.apiResponse(false, 'Item Sync fetch failed', {});
  }
};

// ── Price Sync — ERP Sync Now ────────────────────────────────

exports.save_price_sync = async (req, res) => {
  try {
    var requests = req.bodyParams;
    var records  = Array.isArray(requests.records) ? requests.records : [requests];
    var docs     = await ErpPriceSync.insertMany(
      records.map(r => ({ ...r, syncedAt: new Date() }))
    );
    return res.apiResponse(true, 'Price Sync Saved Successfully', { count: docs.length });
  } catch (error) {
    console.log('exports.save_price_sync -> error', error);
    return res.apiResponse(false, 'Price Sync save failed', {});
  }
};

exports.get_price_sync = async (req, res) => {
  try {
    var requests = req.bodyParams;
    var page     = requests.page     || 1;
    var per_page = requests.per_page || 50;
    var skip     = (page - 1) * per_page;

    var total = await ErpPriceSync.countDocuments();
    var docs  = await ErpPriceSync.find().sort({ createdAt: -1 }).skip(skip).limit(per_page).lean();
    return res.apiResponse(true, 'Price Sync List', { docs, total, page, per_page });
  } catch (error) {
    console.log('exports.get_price_sync -> error', error);
    return res.apiResponse(false, 'Price Sync fetch failed', {});
  }
};

exports.delete_all_item_master = async (req, res) => {
  try {
    await ErpPriceSync.deleteMany({});
    await ErpItemSync.deleteMany({});
    await ErpPriceMaster.deleteMany({});
    await ErpItemMaster.deleteMany({});
    return res.apiResponse(true, 'All Item Master records deleted successfully');
  } catch (error) {
    console.log('exports.delete_all_item_master -> error', error);
    return res.apiResponse(false, 'Item Master delete failed', {});
  }
};