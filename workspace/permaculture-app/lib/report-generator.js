/**
 * report-generator.js — Claude Vision sketch analysis + report streaming
 *
 * Two main functions:
 *   analyzeSketch()   — sends sketch to Claude Vision, returns structured description
 *   generateReport()  — async generator that yields report text chunks for SSE streaming
 */

const Anthropic = require('@anthropic-ai/sdk');
const {
  SKETCH_ANALYSIS_PROMPT,
  buildReportSystemPrompt,
  buildReportUserPrompt
} = require('../prompts/report-prompt');

const client = new Anthropic();

// ─── Sketch Analysis (Claude Vision) ────────────────────────────────

/**
 * Analyze a hand-drawn permaculture sketch using Claude Vision.
 * @param {string} sketchBase64 - Base64-encoded image (with or without data URL prefix)
 * @returns {Promise<string>} Structured text description of the sketch
 */
async function analyzeSketch(sketchBase64) {
  // Parse the base64 data and media type
  const mediaTypeMatch = sketchBase64.match(/^data:(image\/[a-zA-Z+]+);base64,/);
  const mediaType = mediaTypeMatch ? mediaTypeMatch[1] : 'image/jpeg';
  const base64Data = sketchBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

  console.log('[Sketch Analysis] Sending sketch to Claude Vision...');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: mediaType,
            data: base64Data
          }
        },
        {
          type: 'text',
          text: SKETCH_ANALYSIS_PROMPT
        }
      ]
    }]
  });

  const analysis = response.content[0]?.text || '';
  console.log(`[Sketch Analysis] Complete (${analysis.length} chars)`);
  return analysis;
}

// ─── Report Generation (Claude Streaming) ───────────────────────────

/**
 * Generate a one-page permaculture report using Claude streaming.
 * @param {string} sketchAnalysis - Output from analyzeSketch()
 * @param {object} siteData - Auto-fetched site data (climate, soil, elevation, koppen)
 * @param {object} location - { lat, lng, displayName }
 * @yields {string} Text chunks as they arrive from Claude
 */
async function* generateReport(sketchAnalysis, siteData, location) {
  const systemPrompt = buildReportSystemPrompt();
  const userPrompt = buildReportUserPrompt(sketchAnalysis, siteData, location);

  console.log('[Report] Starting streamed generation...');

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }]
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta?.text) {
      yield event.delta.text;
    }
  }

  console.log('[Report] Generation complete');
}

module.exports = { analyzeSketch, generateReport };
