// ── Notification Service — Slack / Teams / Generic Webhook ──────────────────
// Non-blocking: failures are logged but do not affect test runs.

async function slack(webhookUrl, payload) {
  if (!webhookUrl) return;
  try {
    const body = typeof payload === 'string' ? { text: payload } : payload;
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) { console.warn('[slack notification failed]', err.message); }
}

async function teams(webhookUrl, { title, text, color = '0891B2', facts = [] }) {
  if (!webhookUrl) return;
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        '@type': 'MessageCard',
        '@context': 'https://schema.org/extensions',
        themeColor: color,
        summary: title,
        sections: [{ activityTitle: title, text, facts }],
      }),
    });
  } catch (err) { console.warn('[teams notification failed]', err.message); }
}

async function genericWebhook(url, payload) {
  if (!url) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) { console.warn('[webhook failed]', err.message); }
}

/**
 * Send a test-run-complete notification to a user's configured destinations.
 * @param {object} user - from userStore (public user, no secrets)
 * @param {object} run  - { appUrl, status, total, passed, failed, passRate, duration, reportUrl }
 */
async function notifyRunComplete(user, run) {
  const userStore = require('./userStore');
  const slackUrl  = userStore.getSecret(user.id, 'slackWebhookUrl');
  const teamsUrl  = userStore.getSecret(user.id, 'teamsWebhookUrl');
  const customUrl = userStore.getSecret(user.id, 'webhookUrl');

  const emoji    = run.status === 'done' && run.failed === 0 ? '✅' : run.failed > 0 ? '❌' : '⚠️';
  const title    = `${emoji} QA run on ${run.appUrl} — ${run.passed}/${run.total} passed (${run.passRate}%)`;
  const textLine = `Duration: ${Math.round(run.duration / 1000)}s | Failed: ${run.failed} | Skipped: ${run.skipped || 0}`;

  const work = [];
  if (slackUrl) work.push(slack(slackUrl, { text: `*${title}*\n${textLine}` }));
  if (teamsUrl) work.push(teams(teamsUrl, {
    title,
    text: textLine,
    color: run.failed === 0 ? '10B981' : 'EF4444',
    facts: [
      { name: 'Total',    value: String(run.total) },
      { name: 'Passed',   value: String(run.passed) },
      { name: 'Failed',   value: String(run.failed) },
      { name: 'Pass rate', value: `${run.passRate}%` },
    ],
  }));
  if (customUrl) work.push(genericWebhook(customUrl, { type: 'qa.run.complete', user: { id: user.id, email: user.email }, run }));

  await Promise.allSettled(work);
}

async function testNotification(kind, webhookUrl) {
  const title = '🧪 QA Tool — Test notification';
  const text  = `This is a test from QA Tool at ${new Date().toISOString()}`;
  if (kind === 'slack')    return slack(webhookUrl, { text: `*${title}*\n${text}` });
  if (kind === 'teams')    return teams(webhookUrl, { title, text });
  if (kind === 'webhook')  return genericWebhook(webhookUrl, { type: 'qa.test', title, text });
  throw new Error(`Unknown notification kind: ${kind}`);
}

module.exports = { slack, teams, genericWebhook, notifyRunComplete, testNotification };
