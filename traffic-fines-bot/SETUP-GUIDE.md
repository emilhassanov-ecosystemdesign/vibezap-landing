# Traffic Fines RAG Bot - n8n Setup Guide

## Overview
This bot answers questions about Azerbaijani traffic fines via Telegram using RAG (Retrieval-Augmented Generation).

## Files Included
- `n8n-workflow.json` - OpenAI version (requires paid API)
- `n8n-workflow-groq-free.json` - **Groq version (FREE)** ← Recommended for testing

---

## Step-by-Step Setup

### Step 1: Get a Free Groq API Key
1. Go to [console.groq.com](https://console.groq.com)
2. Sign up for free
3. Go to API Keys → Create new key
4. Copy your API key

### Step 2: Import Workflow into n8n

1. Open your n8n instance: **https://n8n.ecosystem.design**
2. Click **"Add workflow"** (+ button)
3. Click the **three dots menu (⋮)** → **"Import from file"**
4. Select `n8n-workflow-groq-free.json`

### Step 3: Configure Telegram Credentials

1. In the workflow, click on **"Telegram Trigger"** node
2. Click **"Credential to connect with"** → **"Create new credential"**
3. Enter:
   - **Name**: `Telegram Bot`
   - **Access Token**: `8573469178:AAFHacC-mW-Vcv-Y41DWlCAZjF6c8Rar8ks`
4. Click **Save**
5. Do the same for the **"Send Telegram Response"** node (use same credential)

### Step 4: Configure Groq API Credentials

1. Click on **"Groq LLM (Free)"** node
2. Click **"Credential to connect with"** → **"Create new credential"**
3. Select **"Header Auth"**
4. Enter:
   - **Name**: `Groq API`
   - **Header Name**: `Authorization`
   - **Header Value**: `Bearer YOUR_GROQ_API_KEY` (replace with your key)
5. Click **Save**

### Step 5: Activate the Workflow

1. Click the **"Inactive"** toggle in the top-right to make it **"Active"**
2. n8n will automatically register the webhook with Telegram

---

## Testing the Bot

Open Telegram and message **@Ecosystem_Weather_Bot** with questions like:

### English Questions:
- "What is the fine for speeding?"
- "How much is the fine for running a red light?"
- "What happens if I drive drunk?"
- "Fine for not wearing seatbelt?"
- "Parking violations and fines?"

### Azerbaijani Questions:
- "Sürət aşması cəriməsi nə qədərdir?"
- "Qırmızı işıqda keçmənin cəriməsi?"
- "Alkoqol altında idarə etmənin cəriməsi?"
- "Təhlükəsizlik kəməri taxmamağın cəriməsi?"
- "Parklanma qaydalarının pozulması?"

---

## Workflow Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│ Telegram        │────▶│ Search Knowledge │────▶│ Groq LLM    │
│ Trigger         │     │ Base (Code)      │     │ (Free API)  │
└─────────────────┘     └──────────────────┘     └─────────────┘
                                                        │
┌─────────────────┐     ┌──────────────────┐           │
│ Send Telegram   │◀────│ Parse AI         │◀──────────┘
│ Response        │     │ Response         │
└─────────────────┘     └──────────────────┘
```

## Knowledge Base Contents

The bot knows about these violation categories:
- **Article 327**: Traffic rules (signs, lights, lanes)
- **Article 328**: Speeding (10-20, 21-40, 41-60, 61+ km/h)
- **Article 329**: Safety equipment (seatbelt, helmet, lights)
- **Article 330**: Pedestrian right-of-way
- **Article 331**: Emergency vehicle right-of-way
- **Article 332**: Driving without license
- **Article 333**: Drunk driving (DUI)
- **Article 334**: No license + DUI
- **Article 335**: Giving vehicle to unlicensed driver
- **Article 338**: Pedestrian/cyclist violations
- **Article 342**: Vehicle operation violations
- **Article 343**: Refusing sobriety test
- **Article 346**: Stopping rules
- **Article 346-1**: Parking rules
- **Article 469**: Mandatory insurance
- **Article 511**: Road hooliganism (racing, wheelies)

---

## Troubleshooting

### Bot not responding?
1. Check workflow is **Active** (green toggle)
2. Check Telegram credentials are correct
3. Check n8n execution logs for errors

### Wrong answers?
- The bot uses keyword matching for RAG
- Try rephrasing your question with specific terms

### Rate limits?
- Groq free tier: 30 requests/minute
- For production, consider upgrading or using caching

---

## Upgrading to Production

For production use, consider:
1. **Vector database**: Add Pinecone/Qdrant for better semantic search
2. **Better embeddings**: Use OpenAI or Cohere embeddings
3. **Caching**: Add Redis to cache frequent questions
4. **Logging**: Add error handling and logging nodes
5. **Rate limiting**: Add rate limiting to prevent abuse
