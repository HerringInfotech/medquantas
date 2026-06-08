const Groq = require('groq-sdk');
const ItemMaster = require('../models/item_master');
const PriceMaster = require('../models/price_master');
const BomMaster = require('../models/bom_master');
const FgMaster = require('../models/fgmaster');
const Customer = require('../models/customer');

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
    const [bomCount, itemCount, priceCount, customerCount, fgCount] = await Promise.all([
      BomMaster.countDocuments({ is_deleted: { $ne: true } }),
      ItemMaster.countDocuments({ is_deleted: { $ne: true } }),
      PriceMaster.countDocuments({ is_deleted: { $ne: true } }),
      Customer.countDocuments({ is_deleted: { $ne: true } }),
      FgMaster.countDocuments({ is_deleted: { $ne: true } }),
    ]);
    context.push(`System summary:\n- Total BOMs: ${bomCount}\n- Total Items: ${itemCount}\n- Total Prices: ${priceCount}\n- Total Customers: ${customerCount}\n- Total Finished Goods: ${fgCount}`);

    if (msg.includes('item') || msg.includes('raw material') || msg.includes('material')) {
      const items = await ItemMaster.find({ is_deleted: { $ne: true } })
        .select('item_code item_name uom hsn_code type_code')
        .limit(20).lean();
      if (items.length) context.push(`Items in system (sample):\n${items.map(i => `- ${i.item_code}: ${i.item_name} (UOM: ${i.uom})`).join('\n')}`);
    }

    if (msg.includes('price') || msg.includes('rate') || msg.includes('cost')) {
      const prices = await PriceMaster.find({ is_deleted: { $ne: true } })
        .select('item_code item_name rate grn_rate currency gst')
        .limit(20).lean();
      if (prices.length) context.push(`Price master (sample):\n${prices.map(p => `- ${p.item_code}: ${p.item_name} | Rate: ${p.rate} | GRN Rate: ${p.grn_rate} | GST: ${p.gst}%`).join('\n')}`);
    }

    if (msg.includes('bom') || msg.includes('bill of material') || msg.includes('formula') || msg.includes('how many')) {
      const boms = await BomMaster.find({ is_deleted: { $ne: true } })
        .select('fg_code fg_name total_cost status')
        .limit(20).lean();
      if (boms.length) context.push(`BOM Master (sample):\n${boms.map(b => `- ${b.fg_code}: ${b.fg_name} | Total Cost: ₹${b.total_cost || 0}`).join('\n')}`);
    }

    if (msg.includes('customer') || msg.includes('client')) {
      const customers = await Customer.find({ is_deleted: { $ne: true } })
        .select('customer_code customer_name location')
        .limit(20).lean();
      if (customers.length) context.push(`Customers (sample):\n${customers.map(c => `- ${c.customer_code}: ${c.customer_name} (${c.location || ''})`).join('\n')}`);
    }

    if (msg.includes('product') || msg.includes('fg') || msg.includes('finished')) {
      const fgs = await FgMaster.find({ is_deleted: { $ne: true } })
        .select('fg_code fg_name pack_size uom')
        .limit(20).lean();
      if (fgs.length) context.push(`Finished Goods (sample):\n${fgs.map(f => `- ${f.fg_code}: ${f.fg_name} | Pack: ${f.pack_size} ${f.uom}`).join('\n')}`);
    }
  } catch (err) {
    // silently ignore DB errors — AI still responds without context
  }

  return context.join('\n\n');
}

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
