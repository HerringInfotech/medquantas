require('dotenv').config({
  path: require('path').resolve(__dirname, '../../../.env')
});
const Groq = require('groq-sdk');
const ItemMaster = require('../models/item_master');
const PriceMaster = require('../models/price_master');
const BomMaster = require('../models/bom_master');
const FgMaster = require('../models/fgmaster');
const Customer = require('../models/customer');
const Costsheet = require('../models/costsheet');
const Salesheet = require('../models/salesheet');
const User = require('../models/user');
const ActivityLog = require('../models/ActivityLog');
let groq = null;
function getGroq() {
  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY is not set in .env');
  if (!groq) groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return groq;
}


const SYSTEM_PROMPT = `You are an AI assistant for MedQuantas, a pharmaceutical cost sheet and inventory management system.
You help users query and understand data about:
- Items/Raw materials (item master)
- BOMs (Bill of Materials) with stages and costs
- Price master and price history
- Customers
- Cost sheets and sales sheets

When answering questions:
- Be concise and professional
- Format numbers with 2 decimal places
- Use INR (₹) for prices unless otherwise specified
- If data is provided in context, use it directly
- If no data is provided, explain what you would need to look up
- For list questions, use bullet points`;

async function fetchContextData(message) {
  const msg = message.toLowerCase();
  const context = [];

  try {
    // Always include counts so AI can answer "how many" questions
    const [bomCount, itemCount, priceCount, customerCount, fgCount, costsheetCount, salesheetCount, userCount] = await Promise.all([
      BomMaster.countDocuments({}),
      ItemMaster.countDocuments({}),
      PriceMaster.countDocuments({}),
      Customer.countDocuments({}),
      FgMaster.countDocuments({}),
      Costsheet.countDocuments({}),
      Salesheet.countDocuments({}),
      User.countDocuments({}),
    ]);
    // Per-type item counts
    const [rmCount, trCount, pmCount] = await Promise.all([
      ItemMaster.countDocuments({ typeCode: 'RM' }),
      ItemMaster.countDocuments({ typeCode: 'TR' }),
      ItemMaster.countDocuments({ typeCode: 'PM' }),
    ]);
    context.push(`System summary:\n- Total BOMs: ${bomCount}\n- Total Items: ${itemCount} (RM: ${rmCount}, TR: ${trCount}, PM: ${pmCount})\n- Total Prices: ${priceCount}\n- Total Customers: ${customerCount}\n- Total Finished Goods: ${fgCount}\n- Total Cost Sheets: ${costsheetCount}\n- Total Sale Sheets: ${salesheetCount}\n- Total Users: ${userCount}`);

    if (msg.includes('item') || msg.includes('raw material') || msg.includes('material') || /\b(rm|tr|fg|pm)\b/.test(msg)) {
      // Extract type code if mentioned (e.g. "TR items", "RM items")
      const typeMatch = msg.match(/\b(rm|tr|fg|pm)\b/i);
      const filter = typeMatch ? { typeCode: typeMatch[1].toUpperCase() } : {};
      const items = await ItemMaster.find(filter)
        .select('code name buyUnit typeCode')
        .limit(50).lean();
      const typeLabel = typeMatch ? ` of type ${typeMatch[1].toUpperCase()}` : '';
      if (items.length) context.push(`Items${typeLabel} in system (total: ${items.length}):\n${items.map(i => `- [${i.typeCode || ''}] ${i.code}: ${i.name} (UOM: ${i.buyUnit || ''})`).join('\n')}`);
      else context.push(`No items found${typeLabel}.`);
    }

    if (msg.includes('price') || msg.includes('rate') || msg.includes('grn')) {
      const stopWords = ['price', 'rate', 'grn', 'how', 'many', 'show', 'list', 'what', 'is', 'the', 'me', 'for', 'a', 'an', 'high', 'highest', 'top', 'get'];
      const keywords = msg.split(/\s+/).filter(w => w.length > 2 && !stopWords.includes(w));
      let priceFilter = {};
      if (keywords.length > 0) {
        priceFilter = { $or: keywords.flatMap(k => [{ name: { $regex: k, $options: 'i' } }, { code: { $regex: k, $options: 'i' } }]) };
      }
      const prices = await PriceMaster.find(priceFilter)
        .select('code name rate grnRate stdrate currency gst')
        .sort({ rate: -1 })
        .limit(50).lean();
      if (prices.length) context.push(`Price master (matched, ${prices.length} records, sorted by highest rate):\n${prices.map(p => `- Code: ${p.code} | Name: ${p.name} | Rate: ${p.rate} | GRN Rate: ${p.grnRate} | Std Rate: ${p.stdrate || ''} | GST: ${p.gst}% | Currency: ${p.currency || 'INR'}`).join('\n')}`);
    }

    // Match BOM code pattern like 2FP001:BOP directly in message
    const bomCodeMatch = msg.match(/[a-z0-9]+:[a-z0-9]+/i);
    if (bomCodeMatch) {
      const bomByCode = await BomMaster.findOne({ code: { $regex: bomCodeMatch[0], $options: 'i' } })
        .select('name code locCd status batch costunit manufacture_qty manufacture_total manufacture_matval pack_qty pack_total pack_matval analytical_value punch_value freight percentage revision packstage rawstage bomraw')
        .lean();
      if (bomByCode) {
        const b = bomByCode;
        const rawItems = [];
        if (Array.isArray(b.rawstage)) {
          b.rawstage.forEach(stage => {
            if (Array.isArray(stage.ingredients)) {
              stage.ingredients.forEach(item => rawItems.push(`    * [${item.code}] ${item.name} | UOM: ${item.buyUnit} | Std Qty: ${item.standQty || item.originalStandQty} | Req Qty: ${item.requestQty || item.originalRequestQty}`));
            }
          });
        }
        const packItems = [];
        if (Array.isArray(b.packstage)) {
          b.packstage.forEach(stage => {
            packItems.push(`  [${stage.stageName} | FG: ${stage.fgName} | FG Code: ${stage.fgCode}]`);
            if (Array.isArray(stage.ingredients)) {
              stage.ingredients.forEach(item => packItems.push(`    * [${item.code}] ${item.name} | UOM: ${item.buyUnit} | Std Qty: ${item.standQty || item.originalStandQty} | Req Qty: ${item.requestQty || item.originalRequestQty}`));
            }
          });
        }
        context.push(`BOM Full Detail for ${b.code}:
Name: ${b.name} | Location: ${b.locCd} | Status: ${b.status} | Revision: ${b.revision || ''}
Batch Size: ${b.batch || ''} | Cost Unit: ${b.costunit || ''}
Manufacture Qty: ${b.manufacture_qty || ''} | Manufacture Total: ${b.manufacture_total || ''} | Manufacture Mat Val: ${b.manufacture_matval || ''}
Pack Qty: ${b.pack_qty || ''} | Pack Total: ${b.pack_total || ''} | Pack Mat Val: ${b.pack_matval || ''}
Analytical Value: ${b.analytical_value || ''} | Punch Value: ${b.punch_value || ''} | Freight: ${b.freight || ''} | Percentage: ${b.percentage || ''}
Total Packs (packstage count): ${Array.isArray(b.packstage) ? b.packstage.length : 0}
Raw Material Items (${rawItems.length}):
${rawItems.join('\n') || '  none'}
Pack Stage Items:
${packItems.join('\n') || '  none'}`);
      }
    }

    if (msg.includes('bom') || msg.includes('bill of material') || msg.includes('formula') || msg.includes('pack') || msg.includes('total pack') || msg.includes('packs') || msg.includes('batch') || msg.includes('manufacture') || msg.includes('ingredient')) {
      // Try to find specific BOM by product name keywords in the message
      const stopWords = ['bom', 'bill', 'of', 'material', 'formula', 'total', 'packs', 'pack', 'how', 'many', 'show', 'list', 'what', 'is', 'the', 'me', 'for', 'a', 'an', 'name', 'latest', 'last', 'and', 'get'];
      const keywords = msg.split(/\s+/).filter(w => w.length > 2 && !stopWords.includes(w));
      let bomFilter = {};
      if (keywords.length > 0) {
        bomFilter = { $or: keywords.map(k => ({ name: { $regex: k, $options: 'i' } })) };
      }
      const boms = await BomMaster.find(bomFilter)
        .select('name code locCd status pack_qty pack_total manufacture_qty revision batch packstage rawstage bomraw')
        .sort({ createdAt: -1 })
        .limit(10).lean();
      if (boms.length) {
        const bomDetails = boms.map(b => {
          // rawstage: each stage has stageCode, stageName, fgName, fgCode, ingredients[]
          const rawItems = [];
          if (Array.isArray(b.rawstage)) {
            b.rawstage.forEach(stage => {
              if (Array.isArray(stage.ingredients)) {
                stage.ingredients.forEach(item => rawItems.push(
                  `    * [${item.code || ''}] ${item.name || ''} | Type: ${item.typeCode || ''} | UOM: ${item.buyUnit || ''} | Std Qty: ${item.standQty || item.originalStandQty || ''} | Req Qty: ${item.requestQty || item.originalRequestQty || ''}`
                ));
              }
            });
          }
          // packstage: each stage has stageCode, stageName, fgName, fgCode, ingredients[]
          const packItems = [];
          if (Array.isArray(b.packstage)) {
            b.packstage.forEach(stage => {
              const stageLabel = `  [Pack Stage: ${stage.stageName || stage.stageCode || ''} | FG: ${stage.fgName || ''} | FG Code: ${stage.fgCode || ''}]`;
              packItems.push(stageLabel);
              if (Array.isArray(stage.ingredients)) {
                stage.ingredients.forEach(item => packItems.push(
                  `    * [${item.code || ''}] ${item.name || ''} | Type: ${item.typeCode || ''} | UOM: ${item.buyUnit || ''} | Std Qty: ${item.standQty || item.originalStandQty || ''} | Req Qty: ${item.requestQty || item.originalRequestQty || ''}`
                ));
              }
            });
          }
          return `BOM: ${b.code} | Name: ${b.name} | Location: ${b.locCd || ''} | Status: ${b.status || ''} | Total Packs: ${Array.isArray(b.packstage) ? b.packstage.length : 0} | Pack Qty: ${b.pack_qty || 0} | Mfg Qty: ${b.manufacture_qty || 0} | Revision: ${b.revision || ''}
  Raw Material Stage Items (${rawItems.length} items):
${rawItems.length ? rawItems.join('\n') : '    * none'}
  Packing Stage Items:
${packItems.length ? packItems.join('\n') : '    * none'}`;
        });
        context.push(`BOM Master - Full Detail (${boms.length} matched):\n\n${bomDetails.join('\n\n')}`);
      } else {
        const fallback = await BomMaster.find({}).select('name code locCd status pack_qty packstage').sort({ createdAt: -1 }).limit(20).lean();
        if (fallback.length) context.push(`BOM Master (latest 20):\n${fallback.map(b => `- Code: ${b.code} | Name: ${b.name} | Location: ${b.locCd || ''} | Packs: ${Array.isArray(b.packstage) ? b.packstage.length : 0} | Pack Qty: ${b.pack_qty || 0}`).join('\n')}`);
      }
    }

    if (msg.includes('customer') || msg.includes('client')) {
      const customers = await Customer.find({})
        .select('customer_code name city state')
        .limit(20).lean();
      if (customers.length) context.push(`Customers (sample):\n${customers.map(c => `- ${c.customer_code}: ${c.name} (${c.city || c.state || ''})`).join('\n')}`);
    }

    if (msg.includes('cost sheet') || msg.includes('costsheet') || msg.includes('cost')) {
      // Highest/lowest rate INR or USD query across all cost sheets
      if ((msg.includes('highest') || msg.includes('lowest') || msg.includes('top') || msg.includes('compare')) && (msg.includes('rate') || msg.includes('inr') || msg.includes('usd') || msg.includes('rupee') || msg.includes('dollar'))) {
        const allSheets = await Costsheet.find({})
          .select('code name productname productcode locCd status system medquantas')
          .lean();
        const sortField = msg.includes('usd') || msg.includes('dollar') ? 'doller' : 'rupee';
        const sorted = allSheets
          .filter(s => s.system && s.system[sortField] != null)
          .sort((a, b) => msg.includes('lowest') ? (a.system[sortField] - b.system[sortField]) : (b.system[sortField] - a.system[sortField]));
        const top = sorted.slice(0, 20);
        if (top.length) context.push(`Cost Sheets sorted by ${msg.includes('lowest') ? 'lowest' : 'highest'} Rate ${sortField === 'doller' ? 'USD' : 'INR'} (${top.length} records):\n${top.map((s, i) => `${i + 1}. ${s.productname || s.name} | Code: ${s.code} | Location: ${s.locCd || ''} | Rate INR: ₹${s.system?.rupee ?? ''} | Rate USD: $${s.system?.doller ?? ''} | Pack Type: ${s.system?.packtype || ''} | Status: ${s.status || ''}`).join('\n')}`);
      }

      // Direct code match like 2FP001:BOP in message
      const csCodeMatch = msg.match(/[a-z0-9]+:[a-z0-9]+/i);
      const stopWords = ['cost', 'sheet', 'costsheet', 'total', 'how', 'many', 'show', 'list', 'what', 'is', 'the', 'me', 'for', 'a', 'an', 'latest', 'last', 'get', 'give'];
      const keywords = msg.split(/\s+/).filter(w => w.length > 2 && !stopWords.includes(w));
      let csFilter = {};
      if (csCodeMatch) {
        csFilter = { $or: [{ code: { $regex: csCodeMatch[0], $options: 'i' } }, { productcode: { $regex: csCodeMatch[0], $options: 'i' } }] };
      } else if (keywords.length > 0) {
        csFilter = { $or: keywords.flatMap(k => [{ name: { $regex: k, $options: 'i' } }, { productname: { $regex: k, $options: 'i' } }, { productcode: { $regex: k, $options: 'i' } }, { code: { $regex: k, $options: 'i' } }]) };
      }
      const sheets = await Costsheet.find(csFilter)
        .select('code name productname productcode locCd status revision detailValues medo_raw medo_pack system medquantas percentage')
        .sort({ createdAt: -1 })
        .limit(5).lean();
      if (sheets.length) {
        const details = sheets.map(s => {
          const dv = s.detailValues || {};
          const rawItems = (s.medo_raw || []).map(i => `    * [${i.code}] ${i.name} | Type: ${i.typeCode} | UOM: ${i.buyUnit} | Std Qty: ${i.standQty || i.originalStandQty} | Req Qty: ${i.requestQty || i.originalRequestQty} | GRN Rate: ${i.grnRate || 0} | Total: ${i.total || 0} | Cost: ${i.cost || 0}`);
          const packItems = (s.medo_pack || []).map(i => `    * [${i.code}] ${i.name} | Type: ${i.typeCode} | UOM: ${i.buyUnit} | Std Qty: ${i.standQty || i.originalStandQty} | Req Qty: ${i.requestQty || i.originalRequestQty} | GRN Rate: ${i.grnRate || 0} | Total: ${i.total || 0} | Cost: ${i.cost || 0}`);
          const sys = s.system || {};
          const mq = s.medquantas || {};
          return `Cost Sheet: ${s.code} | Product: ${s.productname || s.name} | Product Code: ${s.productcode || ''} | Location: ${s.locCd || ''} | Status: ${s.status || ''} | Revision: ${s.revision || ''}
  Detail Values:
    Batch Size: ${dv.batch || ''} | Cost Unit: ${dv.costunit || ''} | Yield%: ${dv.yield || ''} | Yield Value: ${dv.yieldvalue || ''}
    Manufacture Qty: ${dv.manufacture_qty || ''} | Manufacture Total: ${dv.manufacture_total || ''} | Manufacture Mat Val: ${dv.manufacture_matval || ''}
    Manufacture Value: ${dv.manufacture_value || ''} | Manufacture Net Amt: ${dv.manufacture_netamt || ''} | Manufacture Cost: ${dv.manufacture_cost || ''}
    Pack Qty: ${dv.pack_qty || ''} | Pack Total: ${dv.pack_total || ''} | Pack Mat Val: ${dv.pack_matval || ''}
    Pack Value: ${dv.pack_value || ''} | Pack Net Amt: ${dv.pack_netamt || ''} | Pack Cost: ${dv.pack_cost || ''}
    Analytical Value: ${dv.analytical_value || ''} | Analytical Cost: ${dv.analytical_cost || ''}
    Punch Value: ${dv.punch_value || ''} | Punch Cost: ${dv.punch_cost || ''}
    Freight%: ${dv.freight || ''} | Percentage%: ${dv.percentage || ''}
  Systematic Cost: Product: ${sys.name || ''} | Pack Type: ${sys.packtype || ''} | Rate INR: ₹${sys.rupee || ''} | Rate USD: $${sys.doller || ''} | Convert Rate: ${sys.convertrate || ''} | Batch Size (Lakh): ${sys.batchsize || ''} | API: ${sys.api || ''}
  Medquantas Cost: Product: ${mq.name || ''} | Pack Type: ${mq.packtype || ''} | Rate INR: ₹${mq.rupee || ''} | Rate USD: $${mq.doller || ''} | Convert Rate: ${mq.convertrate || ''} | Batch Size (Lakh): ${mq.batchsize || ''} | API: ${mq.api || ''}
  API / Raw Materials (${rawItems.length} items):
${rawItems.join('\n') || '    none'}
  Packing Materials (${packItems.length} items):
${packItems.join('\n') || '    none'}`;
        });
        context.push(`Cost Sheet Full Detail (${sheets.length} matched):\n\n${details.join('\n\n')}`);
      } else {
        const fallback = await Costsheet.find({}).select('code name productname productcode locCd status revision').sort({ createdAt: -1 }).limit(20).lean();
        if (fallback.length) context.push(`Cost Sheets (latest 20):\n${fallback.map(s => `- Code: ${s.code} | Product: ${s.productname || s.name} | Location: ${s.locCd || ''} | Status: ${s.status || ''}`).join('\n')}`);
      }
    }

    if (msg.includes('sale sheet') || msg.includes('salesheet') || msg.includes('sales sheet')) {
      const stopWords = ['sale', 'sales', 'sheet', 'salesheet', 'total', 'how', 'many', 'show', 'list', 'what', 'is', 'the', 'me', 'for', 'a', 'an', 'latest', 'last', 'get', 'give'];
      const keywords = msg.split(/\s+/).filter(w => w.length > 2 && !stopWords.includes(w));
      let ssFilter = {};
      if (keywords.length > 0) {
        ssFilter = { $or: keywords.flatMap(k => [{ name: { $regex: k, $options: 'i' } }, { productname: { $regex: k, $options: 'i' } }, { productcode: { $regex: k, $options: 'i' } }, { code: { $regex: k, $options: 'i' } }]) };
      }
      const sheets = await Salesheet.find(ssFilter)
        .select('code name productname productcode locCd status revision')
        .sort({ createdAt: -1 })
        .limit(50).lean();
      if (sheets.length) context.push(`Sale Sheets (matched, ${sheets.length} records):\n${sheets.map(s => `- Code: ${s.code} | Product: ${s.productname || s.name} | Product Code: ${s.productcode || ''} | Location: ${s.locCd || ''} | Status: ${s.status || ''} | Revision: ${s.revision || ''}`).join('\n')}`);
      else {
        const fallback = await Salesheet.find({}).select('code name productname productcode locCd status revision').sort({ createdAt: -1 }).limit(20).lean();
        if (fallback.length) context.push(`Sale Sheets (latest 20):\n${fallback.map(s => `- Code: ${s.code} | Product: ${s.productname || s.name} | Location: ${s.locCd || ''} | Status: ${s.status || ''}`).join('\n')}`);
      }
    }

    if (msg.includes('login') || msg.includes('last login') || msg.includes('activity') || msg.includes('log') || msg.includes('recent action')) {
      const logs = await ActivityLog.find({})
        .select('userName userEmail module action description status timestamp')
        .sort({ timestamp: -1 })
        .limit(20).lean();
      if (logs.length) context.push(`Recent Activity Logs (newest first):\n${logs.map(l => `- ${new Date(l.timestamp).toLocaleString()}: ${l.userName} (${l.userEmail}) | ${l.module} | ${l.action} | ${l.description} | ${l.status}`).join('\n')}`);
    }

    if (msg.includes('user') || msg.includes('staff') || msg.includes('member') || msg.includes('admin') || msg.includes('who is') || msg.includes('role')) {
      const users = await User.find({})
        .select('name email status lastLogin')
        .populate('role_pop', 'name')
        .limit(50).lean();
      if (users.length) context.push(`Users in system (total: ${users.length}):\n${users.map(u => `- ${u.name} | Email: ${u.email} | Role: ${u.role_pop?.name || ''} | Status: ${u.status || ''}`).join('\n')}`);
    }

    if (msg.includes('product') || msg.includes('fg') || msg.includes('finished')) {
      const fgs = await FgMaster.find({})
        .select('brand_code name status')
        .limit(20).lean();
      if (fgs.length) context.push(`Finished Goods (sample):\n${fgs.map(f => `- ${f.brand_code}: ${f.name} | Status: ${f.status || ''}`).join('\n')}`);
    }
  } catch (err) {
    // silently ignore DB errors — AI still responds without context
  }

  return context.join('\n\n');
}

exports.getPriceAnomalies = async (req, res) => {
  try {
    const threshold = parseFloat(req.query.threshold) || 10; // % change threshold

    const prices = await PriceMaster.find({ is_deleted: { $ne: true } })
      .select('itemID name code rate prevrate grnRate prevGrnrate currency basicUpdatedate grnUpdatedate')
      .lean();

    const anomalies = [];

    for (const item of prices) {
      const alerts = [];

      const rate = parseFloat(item.rate);
      const prevRate = parseFloat(item.prevrate);
      const grnRate = parseFloat(item.grnRate);
      const prevGrnRate = parseFloat(item.prevGrnrate);

      if (prevRate > 0 && !isNaN(rate) && !isNaN(prevRate)) {
        const pct = ((rate - prevRate) / prevRate) * 100;
        if (Math.abs(pct) >= threshold) {
          alerts.push({
            field: 'Standard Rate',
            previous: prevRate,
            current: rate,
            change_pct: parseFloat(pct.toFixed(2)),
            direction: pct > 0 ? 'increase' : 'decrease',
            updated_on: item.basicUpdatedate || null,
          });
        }
      }

      if (prevGrnRate > 0 && !isNaN(grnRate) && !isNaN(prevGrnRate)) {
        const pct = ((grnRate - prevGrnRate) / prevGrnRate) * 100;
        if (Math.abs(pct) >= threshold) {
          alerts.push({
            field: 'GRN Rate',
            previous: prevGrnRate,
            current: grnRate,
            change_pct: parseFloat(pct.toFixed(2)),
            direction: pct > 0 ? 'increase' : 'decrease',
            updated_on: item.grnUpdatedate || null,
          });
        }
      }

      if (alerts.length) {
        anomalies.push({
          item_code: item.code,
          item_name: item.name,
          currency: item.currency || 'INR',
          alerts,
        });
      }
    }

    // Sort by highest absolute % change first
    anomalies.sort((a, b) => {
      const maxA = Math.max(...a.alerts.map(x => Math.abs(x.change_pct)));
      const maxB = Math.max(...b.alerts.map(x => Math.abs(x.change_pct)));
      return maxB - maxA;
    });

    return res.apiResponse(true, 'Success', { anomalies, threshold, total: anomalies.length });
  } catch (err) {
    console.error('Price anomaly error:', err.message);
    return res.apiResponse(false, err.message || 'Error detecting price anomalies');
  }
};

exports.chat = async (req, res) => {
  try {
    const params = req.bodyParams || {};
    const { message, history = [] } = params;

    if (!message || !message.trim()) {
      return res.apiResponse(false, 'Message is required');
    }

    const contextData = await fetchContextData(message);

    const systemContent = contextData
      ? `${SYSTEM_PROMPT}\n\nCurrent data from the system:\n${contextData}`
      : SYSTEM_PROMPT;

    const messages = [
      { role: 'system', content: systemContent },
      ...history.slice(-10).map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message }
    ];

    const completion = await getGroq().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: 1024,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    return res.apiResponse(true, 'Success', { reply });
  } catch (err) {
    console.error('AI chat error:', err.message);
    return res.apiResponse(false, err.message || 'AI service error');
  }
};
