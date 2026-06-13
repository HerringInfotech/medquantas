const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType } = require('./node_app/node_modules/docx');
const fs = require('fs');

const teal = '008080';
const darkGray = '444444';
const lightGray = 'F2F2F2';
const white = 'FFFFFF';

function heading1(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, color: white, size: 28 })],
    spacing: { before: 400, after: 150 },
    shading: { type: ShadingType.SOLID, color: teal, fill: teal },
    indent: { left: 200, right: 200 },
  });
}

function heading2(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, color: teal, size: 26 })],
    spacing: { before: 300, after: 100 },
  });
}

function heading3(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, color: darkGray, size: 24 })],
    spacing: { before: 200, after: 80 },
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, color: darkGray, ...opts })],
    spacing: { after: 100 },
  });
}

function bullet(text) {
  return new Paragraph({
    children: [new TextRun({ text: `• ${text}`, size: 22, color: darkGray })],
    spacing: { after: 80 },
    indent: { left: 400 },
  });
}

function code(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: 'Courier New', size: 20, color: '1a1a1a' })],
    spacing: { after: 60 },
    indent: { left: 400 },
    shading: { type: ShadingType.SOLID, color: 'F0F0F0', fill: 'F0F0F0' },
  });
}

function divider() {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' } },
    spacing: { before: 200, after: 200 },
    text: '',
  });
}

function makeTable(headers, rows) {
  const headerRow = new TableRow({
    children: headers.map(h => new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: white, size: 20 })] })],
      shading: { type: ShadingType.SOLID, color: teal, fill: teal },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
    })),
    tableHeader: true,
  });

  const dataRows = rows.map((row, i) => new TableRow({
    children: row.map(cell => new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text: cell, size: 20, color: darkGray })] })],
      shading: { type: ShadingType.SOLID, color: i % 2 === 0 ? white : lightGray, fill: i % 2 === 0 ? white : lightGray },
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
    })),
  }));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
    margins: { top: 100, bottom: 200 },
  });
}

// Question table with category + example question + what AI returns
function questionTable(rows) {
  const headerRow = new TableRow({
    children: ['Category', 'Example Question', 'What the AI Returns'].map(h => new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: white, size: 20 })] })],
      shading: { type: ShadingType.SOLID, color: teal, fill: teal },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
    })),
    tableHeader: true,
  });

  const dataRows = rows.map((row, i) => new TableRow({
    children: row.map(cell => new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text: cell, size: 20, color: darkGray })] })],
      shading: { type: ShadingType.SOLID, color: i % 2 === 0 ? white : lightGray, fill: i % 2 === 0 ? white : lightGray },
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
    })),
  }));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
    margins: { top: 100, bottom: 200 },
  });
}

const doc = new Document({
  sections: [{
    properties: {},
    children: [

      // Title
      new Paragraph({
        children: [new TextRun({ text: 'MedQuantas AI Chat Feature', bold: true, size: 52, color: teal })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Technical & Business Documentation', size: 26, color: darkGray })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, size: 20, color: '888888' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),

      divider(),

      // 1. Overview
      heading1('1. Overview'),
      new Paragraph({ text: '', spacing: { after: 100 } }),
      para('MedQuantas AI Chat is an intelligent assistant built into the MedQuantas pharmaceutical cost sheet and inventory management system. It allows users to query live system data using plain English — no forms, filters, or technical knowledge required.'),
      para('The AI reads directly from the MongoDB database and answers questions about BOMs, items, prices, users, cost sheets, sale sheets, customers, and activity logs in real time.'),

      divider(),

      // 2. How It Works
      heading1('2. How It Works'),
      new Paragraph({ text: '', spacing: { after: 100 } }),
      para('Each user query goes through the following steps:'),
      bullet('User types a question in the chat panel'),
      bullet('Angular frontend sends the message + last 10 messages of history to the Node.js API'),
      bullet('Node.js detects keywords in the message and fetches relevant live data from MongoDB'),
      bullet('The live data + question + history are sent to Groq Cloud (LLaMA 3 model)'),
      bullet('Groq returns a natural language response based on the actual system data'),
      bullet('The response is displayed in the chat UI'),

      divider(),

      // 3. What You Can Ask
      heading1('3. What You Can Ask'),
      new Paragraph({ text: '', spacing: { after: 150 } }),
      para('The following table shows real example questions users can type in the chat, grouped by category:'),
      new Paragraph({ text: '', spacing: { after: 150 } }),

      questionTable([
        // BOM
        ['Bill of Materials', 'How many BOMs are there in the system?', 'Total BOM count from database'],
        ['Bill of Materials', 'Show me the latest BOM added', 'Most recently created BOM with code, name, location'],
        ['Bill of Materials', 'List all BOMs for MFM location', 'BOMs filtered by location code'],
        ['Bill of Materials', 'What is the status of the BOM list?', 'BOM names, codes, and approval status'],

        // Items
        ['Item Master', 'How many raw material items do we have?', 'Count of RM type items'],
        ['Item Master', 'How many TR items are in the system?', 'Count of TR type items'],
        ['Item Master', 'How many PM items are available?', 'Count of PM type items'],
        ['Item Master', 'Show me the list of RM items', 'All raw material items with code and UOM'],
        ['Item Master', 'What is the total number of items?', 'Total item count with RM / TR / PM breakdown'],

        // Price
        ['Price Master', 'Which item has the highest price?', 'Item with highest rate from price master'],
        ['Price Master', 'Show me the top 10 high price items', 'Items sorted by rate descending'],
        ['Price Master', 'What is the GRN rate for SIMVASTATIN?', 'GRN rate and standard rate for that item'],
        ['Price Master', 'List all items with GST above 18%', 'Items filtered by GST percentage'],

        // Cost Sheet
        ['Cost Sheet', 'How many cost sheets are in the system?', 'Total cost sheet count'],
        ['Cost Sheet', 'Show the latest cost sheet created', 'Most recent cost sheet with code, product, status'],
        ['Cost Sheet', 'Which cost sheets are in approved status?', 'Approved cost sheets list'],
        ['Cost Sheet', 'Show cost sheets for MFM location', 'Cost sheets filtered by location'],

        // Sale Sheet
        ['Sale Sheet', 'What is the total number of sale sheets?', 'Total sale sheet count'],
        ['Sale Sheet', 'Show the most recent sale sheet', 'Latest sale sheet details'],
        ['Sale Sheet', 'List pending sale sheets', 'Sale sheets with pending status'],

        // Users
        ['User Management', 'How many users are in the system?', 'Total user count'],
        ['User Management', 'Who is the admin user?', 'User with Admin role — name and email'],
        ['User Management', 'List all users with their roles', 'All users with name, email, role, status'],
        ['User Management', 'Who are the approver users?', 'Users with Approver role'],
        ['User Management', 'Which users are currently active?', 'Users with Active status'],

        // Activity / Login
        ['Activity Log', 'Who logged in last?', 'Most recent login — username and time'],
        ['Activity Log', 'Show recent system activity', 'Last 20 activity log entries'],
        ['Activity Log', 'Who made changes today?', 'Activity logs from today sorted by time'],
        ['Activity Log', 'Show all login history', 'All login entries from activity log'],

        // Customers
        ['Customers', 'How many customers are registered?', 'Total customer count'],
        ['Customers', 'List all customers', 'Customer names, codes, and locations'],

        // Finished Goods
        ['Finished Goods', 'How many finished goods are there?', 'Total FG count'],
        ['Finished Goods', 'Show me the finished goods list', 'FG names, codes, and status'],

        // General
        ['General Summary', 'Give me a system summary', 'Counts of all modules in one response'],
        ['General Summary', 'What data is available in the system?', 'Overview of all modules and counts'],
      ]),

      divider(),

      // 4. Data Mapping
      heading1('4. Data Fetched Per Query Type'),
      new Paragraph({ text: '', spacing: { after: 150 } }),
      para('The system detects keywords and fetches only the relevant data from MongoDB:'),
      new Paragraph({ text: '', spacing: { after: 100 } }),
      makeTable(
        ['Keyword in Message', 'Data Fetched From MongoDB'],
        [
          ['item / material / RM / TR / PM', 'ItemMaster (filtered by typeCode if specified)'],
          ['price / rate', 'PriceMaster (sorted by highest rate)'],
          ['bom / bill of material', 'BomMaster (sorted newest first)'],
          ['customer / client', 'Customer collection'],
          ['cost sheet / costsheet', 'Costsheet (sorted newest first)'],
          ['sale sheet / salesheet', 'Salesheet (sorted newest first)'],
          ['login / activity / log', 'ActivityLog (sorted newest first)'],
          ['user / admin / role / who is', 'User (with role populated)'],
          ['product / fg / finished', 'FgMaster'],
        ]
      ),
      new Paragraph({ text: '', spacing: { after: 150 } }),
      para('Always included in every query: Total counts for all modules + item type breakdown (RM, TR, PM counts).', { bold: true }),

      divider(),

      // 5. Technology Stack
      heading1('5. Technology Stack'),
      new Paragraph({ text: '', spacing: { after: 150 } }),
      makeTable(
        ['Component', 'Technology'],
        [
          ['AI Provider', 'Groq Cloud'],
          ['AI Model', 'LLaMA 3.3 70B Versatile (llama-3.3-70b-versatile)'],
          ['Backend', 'Node.js + Express'],
          ['Database', 'MongoDB (Mongoose)'],
          ['Frontend', 'Angular'],
          ['Environment Config', '.env file (dotenv)'],
        ]
      ),

      divider(),

      // 6. Groq Free Tier
      heading1('6. Groq API — Free Tier Limits'),
      new Paragraph({ text: '', spacing: { after: 150 } }),
      para('The current setup uses the Groq free tier. Model: llama-3.3-70b-versatile'),
      new Paragraph({ text: '', spacing: { after: 100 } }),
      makeTable(
        ['Limit Type', 'Value'],
        [
          ['Requests per Minute (RPM)', '30'],
          ['Requests per Day (RPD)', '14,400'],
          ['Tokens per Minute (TPM)', '6,000'],
          ['Tokens per Day (TPD)', '500,000'],
          ['Max Context Window', '128,000 tokens'],
          ['Monthly Cost', 'FREE — $0'],
        ]
      ),

      divider(),

      // 7. Paid Pricing
      heading1('7. Groq Paid Pricing'),
      new Paragraph({ text: '', spacing: { after: 150 } }),
      heading3('On-Demand Token Pricing (LLaMA 3.3 70B)'),
      makeTable(
        ['Token Type', 'Price'],
        [
          ['Input tokens', '$0.59 per 1 Million tokens'],
          ['Output tokens', '$0.79 per 1 Million tokens'],
        ]
      ),
      new Paragraph({ text: '', spacing: { after: 200 } }),

      heading3('Estimated Monthly Cost (Paid)'),
      para('Each query uses approx. 500–1,500 input tokens and 200–400 output tokens.'),
      new Paragraph({ text: '', spacing: { after: 100 } }),
      makeTable(
        ['Usage Level', 'Queries / Day', 'Est. Monthly Cost'],
        [
          ['Light', '~50 queries/day', '~$2 – $5 / month'],
          ['Medium', '~200 queries/day', '~$10 – $20 / month'],
          ['Heavy', '~500 queries/day', '~$30 – $60 / month'],
        ]
      ),
      new Paragraph({ text: '', spacing: { after: 200 } }),

      heading3('Groq Plans'),
      makeTable(
        ['Plan', 'Monthly Fee', 'Best For'],
        [
          ['Free', '$0', 'Development / Low usage'],
          ['On-Demand', 'Pay per token', 'Production / Variable usage'],
          ['Batch', '~50% discount on tokens', 'Bulk / Offline processing'],
        ]
      ),

      divider(),

      // 8. Alternative Providers
      heading1('8. Alternative AI Providers'),
      new Paragraph({ text: '', spacing: { after: 150 } }),
      para('If Groq limits are exceeded or a different model is preferred:'),
      new Paragraph({ text: '', spacing: { after: 100 } }),
      makeTable(
        ['Provider', 'Model', 'Free Tier', 'Input Cost (per 1M tokens)'],
        [
          ['Groq (current)', 'LLaMA 3.3 70B', 'Yes', '$0.59'],
          ['OpenAI', 'GPT-4o mini', 'No', '$0.15'],
          ['OpenAI', 'GPT-4o', 'No', '$2.50'],
          ['Anthropic', 'Claude Haiku 4.5', 'No', '$0.25'],
          ['Google', 'Gemini 1.5 Flash', 'Yes', '$0.075'],
          ['Together AI', 'LLaMA 3 70B', 'No', '$0.90'],
        ]
      ),
      new Paragraph({ text: '', spacing: { after: 150 } }),
      para('Groq is currently the best choice: fastest inference speed + free tier available.', { bold: true, color: teal }),

      divider(),

      // 9. Upgrade Path
      heading1('9. Upgrade Path'),
      new Paragraph({ text: '', spacing: { after: 150 } }),
      para('When free tier limits are reached, upgrading is simple:'),
      bullet('Go to console.groq.com'),
      bullet('Navigate to Billing → Add payment method'),
      bullet('Switches to On-Demand pricing automatically'),
      bullet('No code changes required — same API key continues to work'),
      bullet('Monitor usage and costs in the Groq dashboard'),

      divider(),

      // 10. Configuration
      heading1('10. Configuration'),
      new Paragraph({ text: '', spacing: { after: 150 } }),
      heading3('Environment Variable (.env file)'),
      code('GROQ_API_KEY=your_groq_api_key_here'),
      new Paragraph({ text: '', spacing: { after: 100 } }),
      heading3('AI Model Settings (ai.js)'),
      code('Model:        llama-3.3-70b-versatile'),
      code('Max tokens:   1024 (per response)'),
      code('Temperature:  0.7 (balanced accuracy/creativity)'),
      code('History:      Last 10 messages included'),
      code('DB limit:     20–50 records per query'),

      divider(),

      // 11. API Endpoints
      heading1('11. API Endpoints'),
      new Paragraph({ text: '', spacing: { after: 150 } }),
      heading3('Chat Endpoint'),
      code('POST /api/ai/chat'),
      code('Body:     { "message": "your question", "history": [...] }'),
      code('Response: { "reply": "AI answer text" }'),
      new Paragraph({ text: '', spacing: { after: 150 } }),
      heading3('Price Anomaly Detection'),
      code('GET /api/ai/price-anomalies?threshold=10'),
      code('Response: { "anomalies": [...], "threshold": 10, "total": N }'),

      divider(),

      // 12. Security
      heading1('12. Security Notes'),
      new Paragraph({ text: '', spacing: { after: 150 } }),
      bullet('The Groq API key must be stored in .env only — never hardcoded in source code'),
      bullet('.env is listed in .gitignore and must never be committed to git'),
      bullet('The AI only reads data — it cannot create, update, or delete any records'),
      bullet('All AI requests go through the authenticated Node.js backend'),
      bullet('If the API key is accidentally exposed, regenerate it immediately at console.groq.com'),

      divider(),

      // 13. Limitations
      heading1('13. Known Limitations'),
      new Paragraph({ text: '', spacing: { after: 150 } }),
      makeTable(
        ['Limitation', 'Detail'],
        [
          ['DB sample limit', 'Returns max 20–50 records per query, not the full dataset'],
          ['Keyword-based fetch', 'Data is fetched based on keywords — very niche queries may miss context'],
          ['Free tier rate limit', '30 requests/minute on Groq free tier'],
          ['No write access', 'AI can only read and answer — cannot modify system data'],
          ['Language', 'English only'],
          ['Token limit', '1024 tokens max per AI response'],
        ]
      ),

      divider(),

      // Footer
      new Paragraph({
        children: [new TextRun({ text: 'MedQuantas — Confidential Internal Document', size: 18, color: '999999' })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 },
      }),
    ],
  }],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('MedQuantas_AI_Chat_Documentation.docx', buffer);
  console.log('Word document created: MedQuantas_AI_Chat_Documentation.docx');
});
