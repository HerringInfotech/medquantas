# MedQuantas AI Chat Feature Documentation

## Overview

MedQuantas AI Chat is an intelligent assistant integrated into the MedQuantas pharmaceutical cost sheet and inventory management system. It allows users to query live system data using natural language — no forms or filters needed.

---

## How It Works

```
User types a question
        ↓
Angular frontend sends message + chat history to Node.js API
        ↓
Node.js fetches relevant live data from MongoDB
        ↓
Data + question sent to Groq (LLaMA 3 model)
        ↓
AI generates a response based on real system data
        ↓
Response shown in chat UI
```

---

## Features

| Feature | Details |
|---|---|
| Natural language queries | Ask in plain English |
| Live data | Reads directly from MongoDB — always up to date |
| Context-aware | Sends relevant data based on keywords in your question |
| Chat history | Remembers last 10 messages for follow-up questions |
| Multi-module | Covers BOMs, Items, Prices, Users, Cost Sheets, Sale Sheets, Customers, Activity Logs |

---

## What You Can Ask

### Counts & Summaries
```
total bom?
how many items?
total cost sheet?
total users?
how many TR items?
how many RM items?
```

### Items & Prices
```
high price item name?
list TR items
list RM items
what is the rate of SIMVASTATIN?
```

### BOMs
```
latest bom name?
show bom list
how many boms?
```

### Users & Activity
```
total user?
who is admin?
who is creator?
last login user name?
show recent activity
```

### Cost Sheets & Sale Sheets
```
total costsheet?
latest cost sheet?
total sale sheet?
```

### Customers
```
list customers
how many clients?
```

---

## Data Fetched Per Query Type

| Keyword in message | Data fetched from MongoDB |
|---|---|
| item / material / RM / TR / PM | ItemMaster (filtered by typeCode if specified) |
| price / rate | PriceMaster (sorted by highest rate) |
| bom / bill of material | BomMaster (sorted newest first) |
| customer / client | Customer |
| cost sheet / costsheet | Costsheet (sorted newest first) |
| sale sheet / salesheet | Salesheet (sorted newest first) |
| login / activity / log | ActivityLog (sorted newest first) |
| user / admin / role / who is | User (with role populated) |
| product / fg / finished | FgMaster |

**Always included (every query):**
- Total counts for all modules
- Item type breakdown: RM, TR, PM counts

---

## Technology Stack

| Component | Technology |
|---|---|
| AI Provider | Groq Cloud |
| AI Model | LLaMA 3.3 70B Versatile (`llama-3.3-70b-versatile`) |
| Backend | Node.js + Express |
| Database | MongoDB (Mongoose) |
| Frontend | Angular |

---

## Groq API — Pricing & Limits

> Source: https://console.groq.com/docs/rate-limits
> Model used: **llama-3.3-70b-versatile**

### Free Tier (Current)

| Limit | Value |
|---|---|
| Requests per minute | 30 RPM |
| Requests per day | 14,400 RPD |
| Tokens per minute | 6,000 TPM |
| Tokens per day | 500,000 TPD |
| Max context window | 128,000 tokens |
| Cost | **Free** |

### Groq Paid (On-Demand Pricing)

| Type | Price |
|---|---|
| Input tokens | $0.59 per 1M tokens |
| Output tokens | $0.79 per 1M tokens |

### Estimated Monthly Cost (Paid)

| Usage Level | Queries/day | Est. Monthly Cost |
|---|---|---|
| Light | ~50 queries/day | ~$2–5/month |
| Medium | ~200 queries/day | ~$10–20/month |
| Heavy | ~500 queries/day | ~$30–60/month |

> Each query uses approx. 500–1500 input tokens (system prompt + DB context + history) and 200–400 output tokens.

### Groq Paid Plans

| Plan | Monthly Fee | Best For |
|---|---|---|
| Free | $0 | Development / Low usage |
| On-Demand | Pay per token | Production / Variable usage |
| Batch | ~50% discount | Bulk/offline processing |

---

## Configuration

### Environment Variable (`.env`)
```
GROQ_API_KEY=your_groq_api_key_here
```

### API Settings (in `ai.js`)
```js
model: 'llama-3.3-70b-versatile'
max_tokens: 1024
temperature: 0.7
history: last 10 messages
DB limit per query: 20–50 records
```

---

## API Endpoints

### Chat
```
POST /api/ai/chat
Body: { message: "your question", history: [...] }
Response: { reply: "AI answer" }
```

### Price Anomaly Detection
```
GET /api/ai/price-anomalies?threshold=10
Response: { anomalies: [...], threshold: 10, total: N }
```

---

## File Structure

```
node_app/
  app/
    controllers/
      ai.js          ← Main AI controller (chat + price anomaly)
    routes/
      ai.js          ← API route definitions
    models/          ← MongoDB models used by AI
      item_master.js
      price_master.js
      bom_master.js
      fgmaster.js
      customer.js
      costsheet.js
      salesheet.js
      user.js
      ActivityLog.js

projects/master-app/src/app/
  shared/
    api/
      ai.service.ts  ← Angular service for AI API calls
  price-anomaly/     ← Price anomaly UI component
```

---

## Security Notes

- The Groq API key must be stored in `.env` only — never hardcoded in source code
- `.env` is listed in `.gitignore` and must never be committed to git
- The AI only reads data — it cannot create, update, or delete any records
- All AI requests go through the authenticated Node.js backend

---

## Known Limitations

| Limitation | Detail |
|---|---|
| DB sample limit | Returns max 20–50 records per query (not full dataset) |
| Keyword-based fetch | AI only gets data relevant to keywords — very specific queries may miss context |
| Free tier rate limit | 30 requests/minute on Groq free tier |
| No write access | AI can only read and answer — cannot modify data |
| Language | English only |

---

## Upgrade Path

When free tier limits are reached:
1. Go to [console.groq.com](https://console.groq.com)
2. Add billing → switches to On-Demand pricing automatically
3. No code changes needed — same API key continues to work
4. Monitor usage in Groq dashboard

---

## Alternative AI Providers (if needed)

| Provider | Model | Free Tier | Paid (per 1M tokens input) |
|---|---|---|---|
| **Groq** (current) | LLaMA 3.3 70B | Yes | $0.59 |
| OpenAI | GPT-4o mini | No | $0.15 |
| OpenAI | GPT-4o | No | $2.50 |
| Anthropic | Claude Haiku | No | $0.25 |
| Google | Gemini 1.5 Flash | Yes | $0.075 |
| Together AI | LLaMA 3 70B | No | $0.90 |

> Groq is currently the best choice for speed (fastest inference) + free tier availability.
