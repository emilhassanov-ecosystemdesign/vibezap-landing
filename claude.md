# n8n Workflow Automation Project

## Project Purpose
This workspace enables Claude Code to create and manage n8n workflows and AI agents through natural language prompts using:
- **n8n MCP Server** - Direct API access to n8n instance (1,084+ nodes)
- **n8n Skills** - 7 specialized skills for expert workflow building

---

## Setup Instructions

### 1. Install n8n MCP Server

The n8n MCP server provides Claude with comprehensive access to n8n node documentation, workflow management, and real-time API integration.

**GitHub Repository:** https://github.com/czlonkowski/n8n-mcp

#### Installation Options

**Option A: Hosted Service (Quickest)**
```json
{
  "mcpServers": {
    "n8n-mcp": {
      "command": "npx",
      "args": ["-y", "n8n-mcp", "--hosted"]
    }
  }
}
```
- Free tier: 100 tool calls/day
- Dashboard: https://dashboard.n8n-mcp.com
- No setup required

**Option B: Local npx (Recommended)**
```json
{
  "mcpServers": {
    "n8n-mcp": {
      "command": "npx",
      "args": ["-y", "n8n-mcp"]
    }
  }
}
```

**Option C: With n8n API Integration**
```json
{
  "mcpServers": {
    "n8n-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "n8n-mcp",
        "--api-key",
        "YOUR_N8N_API_KEY",
        "--base-url",
        "YOUR_N8N_INSTANCE_URL"
      ]
    }
  }
}
```

**To get your n8n API credentials:**
1. Open your n8n instance
2. Go to Settings → API
3. Generate an API key
4. Use your instance URL (e.g., `https://your-instance.app.n8n.cloud` or `http://localhost:5678`)

**Option D: Docker**
```bash
docker pull ghcr.io/czlonkowski/n8n-mcp:latest
docker run -e MCP_MODE=stdio ghcr.io/czlonkowski/n8n-mcp:latest
```

#### MCP Server Capabilities
- **1,084+ Nodes**: 537 core + 547 community nodes
- **2,709 Workflow Templates** with metadata and examples
- **2,646 Real-world Configurations** from production use
- **265 AI Tool Variants** documented
- **87% Documentation Coverage** from official n8n docs
- **99% Schema Coverage** for node properties

---

### 2. Install n8n Skills

The n8n Skills are 7 specialized Claude Code skills that teach expert n8n workflow patterns and best practices.

**GitHub Repository:** https://github.com/czlonkowski/n8n-skills

#### Installation Methods

**Method 1: Claude Code Plugin (Recommended)**
```bash
/plugin install czlonkowski/n8n-skills
```

**Method 2: Manual Installation**
1. Clone the repository:
   ```bash
   git clone https://github.com/czlonkowski/n8n-skills
   ```
2. Copy skill folders to `~/.claude/skills/`
3. Restart Claude Code

**Method 3: Via Marketplace**
- Add `https://github.com/czlonkowski/n8n-skills` as a marketplace source
- Browse and install individual skills

#### The 7 n8n Skills

**1. n8n-expression-syntax**
- Master n8n templating and expression language
- Key syntax: `{{ }}` expressions
- Core variables: `$json`, `$node`, `$now`, `$env`
- **CRITICAL**: Webhook data is under `$json.body` NOT root `$json`
- Common mistakes to avoid
- When NOT to use expressions

**2. n8n-mcp-tools-expert** (Priority Skill)
- Effective use of MCP server tools
- Node search strategies
- Understanding nodeType formats
- Validation profiles
- Smart parameter usage for specific nodes

**3. n8n-workflow-patterns**
- 5 proven architectural patterns:
  1. **Webhook Processing**: Real-time event handling
  2. **HTTP API Integration**: External service connections
  3. **Database Operations**: Data persistence and queries
  4. **AI Workflows**: LLM and agent integrations
  5. **Scheduled Tasks**: Time-based automation
- Based on 2,653+ real workflow templates

**4. n8n-validation-expert**
- Interpret and fix validation errors
- Understand validation loops
- Auto-sanitization behavior
- Distinguish real errors from false positives

**5. n8n-node-configuration**
- Proper node setup with dependencies
- Operation-aware configuration
- Property dependencies (e.g., `sendBody` → `contentType`)
- AI connection types
- Required vs optional properties

**6. n8n-code-javascript**
- JavaScript in Code nodes
- Data access: `$input.first()`, `$input.all()`, `$input.item`
- Return format: `[{json: {...}}]`
- Built-in helpers: `$helpers.httpRequest()`
- Best practices

**7. n8n-code-python**
- Python capabilities in Code nodes
- When to use Python vs JavaScript (JS handles 95% of cases)
- Limitations: No external libraries
- Use cases for Python

---

## How MCP and Skills Work Together

### Complementary Roles

**MCP Server Provides:**
- Real-time node documentation
- Property schemas and validation
- Template examples
- Node discovery and search
- Direct API access to n8n instance

**Skills Provide:**
- Contextual knowledge and patterns
- Best practices and conventions
- Error interpretation guidance
- Expression syntax expertise
- Language-specific code examples

### Typical Workflow Phases

1. **Discovery Phase** (MCP Heavy)
   - Use MCP tools to search for nodes
   - Review node documentation
   - Examine template examples

2. **Design Phase** (Skills Heavy)
   - Apply workflow patterns (n8n-workflow-patterns)
   - Plan node sequence
   - Identify data transformations

3. **Implementation Phase** (MCP + Skills)
   - Configure nodes using MCP documentation
   - Apply configuration best practices (n8n-node-configuration)
   - Write expressions (n8n-expression-syntax)
   - Add Code nodes if needed (n8n-code-javascript/python)

4. **Validation Phase** (MCP + Skills)
   - Validate using MCP tools
   - Interpret errors (n8n-validation-expert)
   - Fix configuration issues

---

## Claude Code Instructions

### When User Requests a Workflow

Follow this 5-step process:

**Step 1: Clarify Requirements**
If requirements are vague, ask for:
- Trigger type (webhook, schedule, manual, etc.)
- Input data format and source
- Required transformations
- Output destination and format
- Error handling preferences

**Step 2: Invoke Relevant Skills**
- Automatically invoke `n8n-workflow-patterns` to identify pattern
- Invoke `n8n-mcp-tools-expert` for node discovery
- Invoke other skills as needed based on requirements

**Step 3: Use MCP Tools**
- Search for appropriate nodes
- Review node documentation
- Check property requirements
- Look for template examples

**Step 4: Design Workflow**
- Outline node sequence
- Identify required configurations
- Plan data transformations
- Design error handling

**Step 5: Present to User**
- Explain the workflow design
- List required credentials
- Highlight key configuration points
- Provide workflow JSON or step-by-step build instructions
- Include testing recommendations

### Response Format

Every workflow proposal should include:

1. **Overview**: What the workflow does
2. **Node Sequence**: List of nodes in order with descriptions
3. **Key Configurations**: Important settings for each node
4. **Expressions**: Any expressions needed with explanations
5. **Credentials Needed**: List of required credentials
6. **Testing Steps**: How to test the workflow
7. **Next Steps**: What user should do next

### Validation Checklist

Before presenting any workflow, verify:
- [ ] All required properties are configured
- [ ] Expressions are syntactically correct
- [ ] Property dependencies are satisfied
- [ ] Error handling is included
- [ ] Credentials are identified
- [ ] Data format matches between nodes

---

## Workflow Building Guidelines

### 6-Step Development Process

1. **Understand Use Case**
   - Clarify trigger type
   - Identify data sources and destinations
   - Map out required transformations
   - Define success criteria

2. **Search for Nodes**
   - Use MCP tools to find appropriate nodes
   - Check node documentation and properties
   - Review real-world examples from templates
   - Prefer core nodes over community when possible

3. **Design Workflow**
   - Start with trigger node
   - Add processing/transformation nodes
   - Include error handling
   - Add output/action nodes
   - Follow workflow patterns from n8n-workflow-patterns skill

4. **Configure Nodes**
   - Follow property dependencies
   - Use expressions for dynamic data
   - Set up credentials properly
   - Configure error workflows

5. **Validate and Test**
   - Use validation tools from MCP
   - Test with sample data
   - Check error handling paths
   - Verify output format

6. **Document**
   - Add node notes for complex logic
   - Document credential requirements
   - Note any external dependencies

### Best Practices

**Expression Usage:**
- Use `{{ $json.body }}` for webhook payloads (NOT `{{ $json }}`)
- Use `{{ $node["Node Name"].json }}` for specific node data
- Use `{{ $now }}` for timestamps
- Use `{{ $env.VARIABLE }}` for environment variables
- Avoid expressions when static values work

**Error Handling:**
- Always include error workflows for critical paths
- Use IF nodes to validate data before processing
- Set appropriate retry policies
- Log errors for debugging

**Performance:**
- Minimize HTTP requests in loops
- Use batch operations when available
- Consider pagination for large datasets
- Set appropriate timeouts

**Security:**
- Never hardcode credentials
- Use n8n credential system
- Validate webhook signatures
- Sanitize user inputs

---

## Common Workflow Patterns

### Pattern 1: Webhook Processing
```
Webhook Trigger → Validate Data → Transform → Action → Respond
```

**Use Cases:**
- Form submissions
- Payment notifications
- External service webhooks
- Real-time events

**Example:**
```
Nodes:
1. Webhook Trigger (POST)
2. IF Node (Validate required fields)
3. Set Node (Format data)
4. [Action Node] (Database/API/Notification)
5. Respond to Webhook (Success message)

Error Path:
2b. Respond to Webhook (Error message)
```

### Pattern 2: Scheduled Data Sync
```
Schedule Trigger → Fetch Data → Transform → Store → Notify
```

**Use Cases:**
- Daily reports
- Data backups
- API synchronization
- Batch processing

### Pattern 3: HTTP API Integration
```
HTTP Request → Parse Response → IF (Success/Error) → Handle Each Path
```

**Use Cases:**
- External API calls
- Data enrichment
- Third-party integrations

### Pattern 4: AI-Powered Workflow
```
Trigger → Prepare Prompt → AI Node → Parse Response → Action
```

**Use Cases:**
- Content generation
- Data classification
- Sentiment analysis
- Automated decision making

### Pattern 5: Database Operations
```
Trigger → Query Database → Transform Results → Action
```

**Use Cases:**
- Data queries
- CRUD operations
- Reporting
- Data validation

---

## Common Pitfalls & Solutions

### Expression Mistakes

**Pitfall: Accessing webhook data at root**
```javascript
{{ $json.name }}  // WRONG
{{ $json.body.name }}  // CORRECT for webhooks
```

**Pitfall: Not handling undefined values**
```javascript
{{ $json.optional.field }}  // May error if undefined
{{ $json.optional?.field || 'default' }}  // BETTER
```

**Pitfall: Using expressions for static values**
```javascript
{{ "static text" }}  // UNNECESSARY
static text  // CORRECT
```

### Configuration Mistakes

- Missing property dependencies (e.g., `sendBody: true` without `contentType`)
- Using wrong credential type for node
- Not setting credential access properly

### Workflow Design Mistakes

- No error handling on critical paths
- Processing in loops inefficiently (use batch operations)
- Not considering rate limits (add delays, implement backoff)
- Assuming data structure (always validate)
- Not sanitizing inputs (clean user data before queries)

---

## Use Case Template

Use this template for defining specific workflows:

```markdown
## Use Case: [Name]

**Trigger:** [Webhook/Schedule/Manual/etc.]
**Priority:** [High/Medium/Low]
**Status:** [Planning/In Progress/Complete]

### Overview
[Brief description of what this workflow does]

### Input Data
- **Source:** [Where data comes from]
- **Format:** [JSON/XML/CSV/etc.]
- **Example:**
```json
{
  "example": "data"
}
```

### Required Processing
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Output/Actions
- **Destination:** [Where data goes]
- **Format:** [Required output format]
- **Actions:** [What should happen]

### Success Criteria
- [ ] Criterion 1
- [ ] Criterion 2

### Error Handling
- **Scenario 1:** [What to do]
- **Scenario 2:** [What to do]

### Required Credentials
- [ ] Service 1 API key
- [ ] Service 2 credentials

### Notes
[Any special considerations]
```

---

## Example Workflows

### Example 1: Simple Webhook to Slack

**Use Case:** Receive form submissions and post to Slack

**Workflow:**
```
Nodes:
1. Webhook Trigger (POST, path: /form-submit)
2. IF Node (Validate: {{ $json.body.email !== undefined }})
3. Set Node (Format Slack message)
4. Slack Node (Post to #submissions channel)
5. Respond to Webhook (Success)

Error Path:
2b. Respond to Webhook (Error: Missing fields)
```

**Key Expressions:**
```javascript
{{ $json.body.name }}
{{ $json.body.email }}
{{ $json.body.message }}
{{ $now.format('YYYY-MM-DD HH:mm') }}
```

**Credentials Needed:**
- Slack API credentials

### Example 2: Scheduled Data Sync

**Use Case:** Daily sync from API to Google Sheets

**Workflow:**
```
Nodes:
1. Schedule Trigger (Daily at 9 AM)
2. HTTP Request (Fetch from API)
3. Code Node (Transform data)
4. Google Sheets (Update rows)
5. Slack (Notify completion)

Error Path:
2-4. Error Workflow → Slack (Notify failure)
```

**Credentials Needed:**
- API key for data source
- Google Sheets OAuth
- Slack credentials

### Example 3: AI Content Processing

**Use Case:** Process incoming content with AI and store results

**Workflow:**
```
Nodes:
1. Webhook Trigger
2. OpenAI Node (Analyze content)
3. IF Node (Check confidence score > 0.8)
4a. PostgreSQL (Store high confidence)
4b. Set Node → Email (Flag for manual review)
5. Respond to Webhook
```

**Credentials Needed:**
- OpenAI API key
- PostgreSQL credentials
- Email service credentials

---

## Prompt Engineering Guide

### Effective Prompt Structure

```
Build a workflow that [ACTION] when [TRIGGER] by [METHOD].

Input: [DATA FORMAT AND SOURCE]
Processing: [TRANSFORMATIONS NEEDED]
Output: [DESTINATION AND FORMAT]

Requirements:
- [Requirement 1]
- [Requirement 2]

Error Handling:
- [Error scenario and handling]
```

### Example Good Prompt

```
Build a workflow that sends Slack notifications when a webhook receives
form submissions by transforming the data and posting to a channel.

Input: Webhook POST with JSON body containing name, email, message
Processing: Validate required fields, format message for Slack
Output: Send to #submissions channel in Slack

Requirements:
- Validate email format
- Include timestamp
- Handle missing fields gracefully

Error Handling:
- If Slack fails, retry 3 times
- Log failures to database
```

### What Makes a Good Prompt

**Be Specific About:**
- Exact trigger type
- Data format and structure
- Required transformations
- Output destination
- Error handling needs
- Validation requirements

**Provide Examples:**
- Sample input data
- Expected output
- Edge cases to handle

**Clarify Priorities:**
- Performance requirements
- Error tolerance
- Must-have vs nice-to-have features

---

## Reference & Resources

### Official Documentation
- **n8n Official Docs**: https://docs.n8n.io/
- **n8n MCP Server Docs**: https://docs.n8n.io/advanced-ai/accessing-n8n-mcp-server/
- **n8n Community Forum**: https://community.n8n.io/

### GitHub Repositories
- **n8n MCP Server**: https://github.com/czlonkowski/n8n-mcp
- **n8n Skills**: https://github.com/czlonkowski/n8n-skills
- **n8n Core**: https://github.com/n8n-io/n8n

### Quick Reference

**Install Skills:**
```bash
/plugin install czlonkowski/n8n-skills
```

**MCP Server (npx):**
```bash
npx n8n-mcp
```

**MCP Server (Docker):**
```bash
docker run -e MCP_MODE=stdio ghcr.io/czlonkowski/n8n-mcp:latest
```

### Key Statistics
- **Total Nodes**: 1,084 (537 core + 547 community)
- **Workflow Templates**: 2,709
- **Real-world Examples**: 2,646
- **AI Tool Variants**: 265
- **Documentation Coverage**: 87%
- **Schema Coverage**: 99%
- **Operations Coverage**: 63.6%

---

## Troubleshooting

### MCP Connection Issues
**Problem**: MCP tools not available
**Solution**:
- Check MCP server is running
- Verify configuration in `.mcp.json` or Claude settings
- Check environment variables
- Review logs for errors

### Skills Not Working
**Problem**: Skills not activating
**Solution**:
- Verify Claude Pro subscription
- Check skills are installed correctly: `ls ~/.claude/skills/`
- Reload Claude Code
- Try manual skill invocation

### Workflow Validation Errors
**Problem**: Workflow fails validation
**Solution**:
- Invoke `n8n-validation-expert` skill
- Check property dependencies
- Verify expression syntax with `n8n-expression-syntax`
- Review node documentation via MCP

### Expression Errors
**Problem**: Expression not evaluating correctly
**Solution**:
- Check syntax: `{{ }}` required
- Verify data path (especially `$json.body` for webhooks)
- Use Code node for complex logic
- Check for undefined values with optional chaining `?.`

### Authentication Issues
**Problem**: Node fails with auth error
**Solution**:
- Verify credentials are configured in n8n
- Check credential type matches node requirements
- Test credentials manually in n8n UI
- Review API key/token permissions

---

## Hostinger Container Setup & Recovery

### Infrastructure Overview

This n8n setup runs on a Hostinger VPS with Docker containers:
- **Host path**: `/docker/n8n/`
- **Compose file**: `/docker/n8n/docker-compose.yml`
- **VS Code access**: https://code.ecosystem.design (via Traefik reverse proxy)
- **n8n instance**: https://n8n.ecosystem.design

**MCP Configuration** (configured 2026-02-03):
- **Config file**: `/config/.claude/.mcp.json`
- **Server**: n8n-mcp via npx
- **API key**: Stored in config (generated from n8n Settings → API)
- **Expiry**: API key expires 2026-02-21 (regenerate before expiry)

**Docker Containers:**
| Container | Image | Purpose |
|-----------|-------|---------|
| code-server | lscr.io/linuxserver/code-server:latest | VS Code in browser |
| n8n-n8n-1 | docker.n8n.io/n8nio/n8n | n8n workflow automation |
| n8n-traefik-1 | traefik | Reverse proxy with TLS |

### Node.js Persistence Issue (Fixed 2026-02-03)

**Problem**: Node.js would uninstall every time the code-server container recreated (which happens during n8n stack updates via `docker compose up -d`).

**Root Cause**: The linuxserver/code-server Docker image is ephemeral — packages installed inside the container get wiped on recreation because they aren't part of the image or persisted volumes.

**Solution**: Use the custom-cont-init.d volume mount to run init scripts on container startup.

#### Fix Applied

1. **Volume mount added** to docker-compose.yml for code-server service:
   ```yaml
   - /docker/n8n/vscode/custom-cont-init.d:/custom-cont-init.d
   ```

2. **Init script created** at `/docker/n8n/vscode/custom-cont-init.d/install-node.sh`:
   ```bash
   #!/bin/bash
   if ! command -v node &> /dev/null; then
       echo "Node.js not found, installing..."
       curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
       apt-get install -y nodejs
       echo "Node.js $(node --version) installed"
   else
       echo "Node.js $(node --version) already present"
   fi
   ```

3. **Script made executable**: `chmod +x /docker/n8n/vscode/custom-cont-init.d/install-node.sh`

Now Node.js 20 auto-installs on every container startup.

### VS Code Connection Recovery

If connection to code.ecosystem.design is lost after container recreation:

**Step 1: Check all containers are running**
```bash
docker ps
```
Expected: 3 containers (code-server, n8n-n8n-1, n8n-traefik-1) all with status "Up"

**Step 2: Test connectivity from host**
```bash
curl -I https://code.ecosystem.design
```
Expected: HTTP 302 redirect to `./login` (healthy response)

**Step 3: If containers aren't running**
```bash
cd /docker/n8n && docker compose up -d
```

**Step 4: If Traefik has issues**
```bash
docker logs traefik 2>&1 | tail -20
```
Check for TLS cert errors. May need to wait a minute for cert provisioning.

**Step 5: Browser troubleshooting**
- Hard refresh (Ctrl+Shift+R)
- Clear browser cache
- Try incognito/private window

### Useful Commands

```bash
# Check all container status
docker ps

# View code-server logs
docker logs code-server

# Check if Node.js is installed in code-server
docker exec code-server node --version

# Force recreate code-server
cd /docker/n8n && docker compose up -d --force-recreate code-server

# View init script output in logs
docker logs code-server 2>&1 | grep -i "node"

# Restart entire n8n stack
cd /docker/n8n && docker compose down && docker compose up -d
```

---

## Workflow Development Checklist

### Planning Phase
- [ ] Use case clearly defined
- [ ] Input data format documented
- [ ] Output requirements specified
- [ ] Error handling strategy defined
- [ ] Credentials identified
- [ ] Performance requirements noted

### Design Phase
- [ ] Appropriate workflow pattern selected
- [ ] Nodes identified via MCP search
- [ ] Node sequence planned
- [ ] Data transformations mapped
- [ ] Error paths designed

### Implementation Phase
- [ ] Trigger node configured
- [ ] Processing nodes added and configured
- [ ] Expressions written and tested
- [ ] Code nodes implemented (if needed)
- [ ] Error handling implemented
- [ ] Action/output nodes configured

### Validation Phase
- [ ] All required properties set
- [ ] Property dependencies satisfied
- [ ] Expressions syntactically correct
- [ ] Validation passed via MCP tools
- [ ] No configuration warnings

### Testing Phase
- [ ] Tested with valid sample data
- [ ] Tested with invalid data
- [ ] Tested with edge cases
- [ ] Error paths verified
- [ ] Performance acceptable
- [ ] Credentials working

### Documentation Phase
- [ ] Node notes added for complex logic
- [ ] Workflow description complete
- [ ] Required credentials documented
- [ ] Setup instructions written
- [ ] Known limitations noted

### Deployment Phase
- [ ] Workflow exported as JSON
- [ ] Version controlled
- [ ] Tested in staging environment
- [ ] Backup of existing workflow (if replacing)
- [ ] Monitoring/alerts configured

---

## Critical Safety Warning

**NEVER edit production workflows directly with AI assistance.**

**Always:**
- Create copies first
- Test in development environments
- Export backups before changes
- Validate thoroughly before production deployment
- Have rollback plan ready

---

## Your Custom Use Cases

Add your specific workflow requirements below using the Use Case Template.

### Use Case 1: Traffic Fines RAG Bot

**Trigger:** Telegram message via Telegram Router (sub-workflow call)
**Priority:** High
**Status:** Complete

#### Overview
Telegram-based chatbot that answers questions about Azerbaijan traffic fines, penalties, and violation articles using RAG (Retrieval-Augmented Generation) with Supabase vector store.

#### Architecture
```
Telegram Router (wldKmOm-NHpGHMQifoKxy) - Active
  └── Call Traffic Workflow (toolWorkflow)
        └── Traffic Fines RAG Bot (oNGS8VlouLmzargyLbCNs) - Active (sub-workflow)
              ├── AI Agent (gpt-4o-mini, temp=0)
              ├── Vector Store Tool (traffic_fines_database, topK=5)
              │     ├── Supabase Vector Store (table: documents, fn: match_documents)
              │     │     └── OpenAI Embeddings (text-embedding-ada-002)
              │     └── OpenAI Chat Model (gpt-4o-mini) - for summarization
              └── Return Response (Code node)

Traffic Fines - PDF Indexer (y0biJdPhmswTijVu) - Manual trigger
  ├── PDF Content (Code node - hardcoded comprehensive data)
  ├── Text Splitter (800 chars, 100 overlap)
  ├── OpenAI Embeddings → Supabase Vector Store (insert mode)
  └── Default Data Loader
```

#### Data Source
- **Primary:** Hardcoded in PDF Indexer from avtostop.az/cerimeler/
- **Coverage:** Articles 327-356, 469, 511, 529, 96-98 (both Azerbaijani and English)
- **Supabase:** kegbahrdemvfmjoachft.supabase.co, table: `documents`, function: `match_documents`
- **Chunks:** ~72 document chunks with 1536-dim OpenAI embeddings

#### Credentials Required
- OpenAI API (id: 23mseFmTKiVo6pxW) - "OpenAi account 2"
- Supabase API (id: jjH3tGL5e6h88JLX) - "Supabase Traffic Fines"
- Telegram Bot (configured in Telegram Router)

#### Fixes Applied (2026-01-31)
1. Removed redundant "Embeddings for Tool" node that conflicted with Supabase Vector Store embeddings
2. Changed OpenAI Chat Model1 from `gpt-4.1-mini` (invalid) to `gpt-4o-mini`
3. Increased Vector Store Tool topK from 3 to 5 for better retrieval
4. Enhanced PDF Indexer data with comprehensive articles from avtostop.az (added articles 332.6-332.7, 333-1.4/5, 334.4/5, 334-1.4/5, 335.4-6, 336.4-6, 339.2-5, 343.2-9, 344, 345, 347-355, 469, 511, 529)
5. Re-indexed Supabase with full bilingual (AZ/EN) dataset
6. Enhanced system prompt to ALWAYS include article numbers in responses, even for general questions

#### Notes
- To re-index: clear Supabase `documents` table, then run PDF Indexer manually
- Bot responds in user's language (Azerbaijani or English)
- Article number dashes are normalized to dots (e.g., 333-1 → 333.1) for consistent search

### Use Case 2: RAG Chatbot for Company Documents (Google Drive + Gemini)

**Trigger:** Google Drive file created/updated + Chat message
**Priority:** High
**Status:** Configured (2026-01-31)

#### Overview
RAG chatbot that monitors a Google Drive folder for new/updated documents, indexes them into Pinecone vector store using Gemini embeddings, and provides a chat interface for querying company documents. Logs processed documents to Google Sheets.

#### Architecture
```
Document Indexing Path:
  Google Drive File Created/Updated (folder: 1R4eUtvI8Oumj9wc1s53rddg5oYe-R-D6)
    → Download File From Google Drive
    → Pinecone Vector Store (insert, index: company-files)
    │   ├── Embeddings Google Gemini
    │   ├── Default Data Loader (binary)
    │   │     └── Recursive Character Text Splitter (chunk: 1000, overlap: 100)
    → Log to Google Sheets (Sheet: 1j4nw9_x8_1BNxyEaM-PrjwpCR7h9CrmH55EXS1_BILM)

Chat Path:
  When chat message received
    → AI Agent (HR assistant, gemini-2.0-flash-exp)
    │   ├── Google Gemini Chat Model
    │   ├── Window Buffer Memory
    │   └── Vector Store Tool (company_documents_tool)
    │         ├── Pinecone Vector Store (Retrieval, index: company-files)
    │         │     └── Embeddings Google Gemini (retrieval)
    │         └── Google Gemini Chat Model (retrieval)
```

#### Workflow ID
`0oy2Qiji112rZiSE`

#### Credentials Used
- Google Drive OAuth2 (id: ceTCo83ka6oFvwBi) - "Google Drive account"
- Google Gemini/PaLM API (id: xNEWTkZVi2Ho4SdU) - "Google Gemini(PaLM) Api account"
- Pinecone API (id: eMR0eJPVD28Pvujf) - "Pinecone API"
- Google Sheets OAuth2 (id: cCNeulJxx3ae6oLN) - "Google Sheets account"

#### Google Sheets Logging
- Sheet ID: `1j4nw9_x8_1BNxyEaM-PrjwpCR7h9CrmH55EXS1_BILM`
- Columns: fileName, processedAt, status, fileId
- Logs each document processed through the indexing pipeline

#### Pinecone Setup
- Index: `company-files`
- Dimensions: 768 (Gemini embeddings)
- Metric: cosine

#### Notes
- Google Drive folder monitored every minute for new/updated files
- To change monitored folder, update both trigger nodes with new folder ID
- Pinecone index must exist before activating the workflow
- Chat interface available at the n8n webhook URL

### Use Case 3: Google Drive File Organizer (AI-Powered)

**Trigger:** Google Drive Trigger (new files) + Schedule Trigger
**Priority:** High
**Status:** Configured (2026-01-31)

#### Overview
AI-powered workflow that monitors Google Drive for new files, classifies them by type (PDF, image, audio, video, Google native files), analyzes content using OpenAI/Gemini, renames files with a standard convention, and moves them into categorized folders. Logs results to Google Sheets.

#### Workflow ID
`qXSbzxBmasKb9AvGvDThD`

#### File Type Destination Folders
| Folder | Google Drive ID |
|--------|----------------|
| PDFs | `1KjXlsGdJXNeGfgoq6Mrves3DxBzEG37x` |
| Images | `12A9E0CF6ivmBC8P9fSIQAbRGw2_lCY4Z` |
| Audio | `19dhhqy2iRobVY_oP4OuE_HZhn_La35wN` |
| Video | `1ytiSuAXmWRUKa8HAX5pA9WTN2QzsMH4V` |
| Google Forms | `1wfzOqg8Tuz5OFD95NOX6500L0X-Wbrir` |
| Google Slides | `1dJUucZr2Ej94v26rmPPomNVUVrr1o2qW` |
| Google Docs | `17_a8lJFOUCpmHnIf3xOjmBRFPCNk91vt` |
| Other | `1i9lx3SefDTAa7TkG9jRZGn8MY9JeTNNC` |

#### Credentials Used
- Google Drive OAuth2 (id: ceTCo83ka6oFvwBi) - "Google Drive account"
- OpenAI API (id: 23mseFmTKiVo6pxW) - "OpenAi account 2"
- Google Gemini/PaLM API (id: xNEWTkZVi2Ho4SdU) - for video analysis
- Google Sheets OAuth2 (id: cCNeulJxx3ae6oLN) - "Google Sheets account"

#### Fixes Applied (2026-01-31)
1. Added Gemini credential to "Analyze video" node (was missing)
2. Fixed Move file1 node: swapped driveId/folderId parameters
3. Replaced all 8 hardcoded template folder IDs in EditFields nodes with user's folders
4. Replaced all 11 category folder IDs in OpenAI prompts with user's folders

---

## Next Steps

1. **Install MCP Server**: Choose installation method and configure
2. **Install n8n Skills**: Run `/plugin install czlonkowski/n8n-skills`
3. **Test Setup**: Ask Claude to explain a simple workflow pattern
4. **Define Use Cases**: Fill in your specific workflow requirements
5. **Build First Workflow**: Start with a simple pattern and iterate

Ready to build some workflows? Just describe what you want to automate!
