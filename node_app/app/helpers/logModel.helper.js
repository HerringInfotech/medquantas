const ItemLog = require('../models/ItemLog');
const PriceLog = require('../models/PriceLog');
const CostLog = require('../models/CostLog');
const BomLog = require('../models/bomlog');
const FGLog = require('../models/fgLog');
const UserLog = require('../models/UserLog');
const RoleLog = require('../models/RoleLog');
const ModuleLog = require('../models/ModuleLog');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/user');

const logModels = {
  item: ItemLog,
  price: PriceLog,
  cost: CostLog,
  bom: BomLog,
  fg: FGLog,
  user: UserLog,
  role: RoleLog,
  module: ModuleLog,
};

const sectionToModuleMap = {
  item: 'Item Master',
  price: 'Price Master',
  cost: 'Cost Sheet',
  bom: 'BOM',
  fg: 'FG Master',
  user: 'User Management',
  role: 'Access Manager',
  module: 'Module List',
  conversion: 'Conversion Factor',
  unit: 'UOM Master',
  customer: 'Customer Master',
  group: 'Item Group',
  type: 'Item Type',
  subtype: 'Item Type',
  pack: 'Pack Master',
  stage: 'Stage Master',
  sales: 'Sales Sheet',
  other: 'Other'
};

async function logAction({ section, user, action, description, data }) {
  try {
    const LogModel = logModels[section.toLowerCase()];
    if (LogModel) {
      await new LogModel({
        user,
        action,
        description,
        data,
      }).save();
    }

    // Centralized Activity Logging
    let userName = '';
    let userEmail = '';
    
    // Try to resolve user ID from various possible locations in the payload
    let resolvedUserId = null;
    if (user) {
        resolvedUserId = user._id || (typeof user === 'string' ? user : null);
    }
    if (!resolvedUserId && data) {
        resolvedUserId = data.user?._id || data.user_id || data.userID || data.userId || data.user;
    }

    if (resolvedUserId && (typeof resolvedUserId === 'string' || resolvedUserId instanceof require('mongoose').Types.ObjectId)) {
      try {
        const userDoc = await User.findById(resolvedUserId).select('name email').lean();
        if (userDoc) {
          userName = userDoc.name;
          userEmail = userDoc.email;
        }
      } catch (e) {
        console.warn('Failed to fetch user for logging:', resolvedUserId);
      }
    } else if (user && typeof user === 'object' && !resolvedUserId) {
      userName = user.name || '';
      userEmail = user.email || '';
    }

    const activityModule = sectionToModuleMap[section.toLowerCase()] || 'Other';
    const activityAction = action.charAt(0).toUpperCase() + action.slice(1);

    await new ActivityLog({
      userId: (resolvedUserId && typeof resolvedUserId === 'object' ? resolvedUserId._id : resolvedUserId) || null,
      userName,
      userEmail,
      module: activityModule,
      action: activityAction,
      description: description.replace(/<\/?[^>]+(>|$)/g, ""), // strip HTML if any
      status: 'Success'
    }).save();

  } catch (err) {
    console.error('Logging failed:', err);
  }
}

module.exports = { logAction };