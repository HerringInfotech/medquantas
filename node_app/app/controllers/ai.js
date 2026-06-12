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
  console.log('ENV:', process.env.GROQ_API_KEY);
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

    if (msg.includes('price') || msg.includes('rate') || msg.includes('cost')) {
      const prices = await PriceMaster.find({})
        .select('code name rate grnRate currency gst')
        .sort({ rate: -1 })
        .limit(20).lean();
      if (prices.length) context.push(`Price master (sample, sorted by highest rate):\n${prices.map(p => `- ${p.code}: ${p.name} | Rate: ${p.rate} | GRN Rate: ${p.grnRate} | GST: ${p.gst}%`).join('\n')}`);
    }

    if (msg.includes('bom') || msg.includes('bill of material') || msg.includes('formula') || msg.includes('how many')) {
      const boms = await BomMaster.find({})
        .select('name code locCd status')
        .sort({ createdAt: -1 })
        .limit(20).lean();
      if (boms.length) context.push(`BOM Master (sample, sorted newest first):\n${boms.map(b => `- ${b.code}: ${b.name} | Location: ${b.locCd || ''} | Status: ${b.status || ''}`).join('\n')}`);
    }

    if (msg.includes('customer') || msg.includes('client')) {
      const customers = await Customer.find({})
        .select('customer_code name city state')
        .limit(20).lean();
      if (customers.length) context.push(`Customers (sample):\n${customers.map(c => `- ${c.customer_code}: ${c.name} (${c.city || c.state || ''})`).join('\n')}`);
    }

    if (msg.includes('cost sheet') || msg.includes('costsheet')) {
      const sheets = await Costsheet.find({})
        .select('code name productname productcode locCd status revision')
        .sort({ createdAt: -1 })
        .limit(20).lean();
      if (sheets.length) context.push(`Cost Sheets (sample, newest first):\n${sheets.map(s => `- ${s.code}: ${s.name || s.productname} | Location: ${s.locCd || ''} | Status: ${s.status || ''}`).join('\n')}`);
    }

    if (msg.includes('sale sheet') || msg.includes('salesheet') || msg.includes('sales sheet')) {
      const sheets = await Salesheet.find({})
        .select('code name productname productcode locCd status revision')
        .sort({ createdAt: -1 })
        .limit(20).lean();
      if (sheets.length) context.push(`Sale Sheets (sample, newest first):\n${sheets.map(s => `- ${s.code}: ${s.name || s.productname} | Location: ${s.locCd || ''} | Status: ${s.status || ''}`).join('\n')}`);
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
