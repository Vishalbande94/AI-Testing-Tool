// ── Claude API Client (Shared) ────────────────────────────────────────────────
// Manages Anthropic API key + provides call() and callJSON() wrappers
const Anthropic = require('@anthropic-ai/sdk');

let apiKey = null;
let client = null;

function setApiKey(key) {
  apiKey = key;
  client = key ? new Anthropic({ apiKey: key }) : null;
  return { success: true, configured: !!key };
}

function clearApiKey() {
  apiKey = null;
  client = null;
}

function isConfigured() {
  return !!client;
}

/**
 * Call Claude API and return the text response.
 */
async function call({ system, messages, maxTokens = 4096, temperature = 0.3, model = 'claude-sonnet-4-20250514' }) {
  if (!client) throw new Error('Claude API key not configured');

  const res = await client.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    system,
    messages,
  });

  const text = res.content
    .filter(c => c.type === 'text')
    .map(c => c.text)
    .join('');

  return {
    text,
    inputTokens: res.usage?.input_tokens || 0,
    outputTokens: res.usage?.output_tokens || 0,
  };
}

/**
 * Call Claude API and parse the response as JSON.
 * Retries once on parse failure.
 */
async function callJSON({ system, messages, maxTokens = 8192, temperature = 0.2, model = 'claude-sonnet-4-20250514' }) {
  const systemWithJson = system + '\n\nIMPORTANT: Output ONLY valid JSON. No markdown, no code fences, no explanation text. Start with [ or {.';

  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await call({ system: systemWithJson, messages, maxTokens, temperature, model });
    let text = res.text.trim();

    // Strip markdown code fences if present
    text = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

    try {
      const parsed = JSON.parse(text);
      return { data: parsed, inputTokens: res.inputTokens, outputTokens: res.outputTokens };
    } catch (e) {
      if (attempt === 0) continue; // retry once
      throw new Error(`Failed to parse AI response as JSON: ${e.message}\nRaw: ${text.slice(0, 200)}`);
    }
  }
}

function getStatus() {
  return {
    configured: isConfigured(),
    model: 'claude-sonnet-4-20250514',
    keySet: !!apiKey,
    keyPreview: apiKey ? apiKey.slice(0, 10) + '...' : null,
  };
}

module.exports = { setApiKey, clearApiKey, isConfigured, call, callJSON, getStatus };
