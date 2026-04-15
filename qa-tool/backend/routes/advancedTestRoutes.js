// ── Advanced Test Routes (API / Security / Performance) ─────────────────────
const express        = require('express');
const path           = require('path');
const fs             = require('fs');
const { v4: uuidv4 } = require('uuid');

const apiGen    = require('../services/apiTestGenerator');
const secGen    = require('../services/securityTestGenerator');
const perfGen   = require('../services/performanceTestGenerator');
const a11yGen   = require('../services/accessibilityTestGenerator');
const visualGen = require('../services/visualRegressionGenerator');
const mobileGen = require('../services/mobileTestGenerator');
const dbGen     = require('../services/databaseTestGenerator');
const cicdGen   = require('../services/cicdPipelineGenerator');

const router = express.Router();

const API_TOOLS    = ['postman', 'restassured', 'playwright', 'k6', 'supertest'];
const SEC_TOOLS    = ['zap', 'nuclei', 'checklist', 'playwright'];
const PERF_TOOLS   = ['k6', 'jmeter', 'artillery', 'gatling'];
const A11Y_TOOLS   = ['playwright-axe', 'axe-cli', 'lighthouse-ci', 'pa11y'];
const VISUAL_TOOLS = ['playwright', 'backstop', 'percy'];
const MOBILE_TOOLS = ['appium-webdriverio', 'appium-java', 'detox', 'maestro'];
const DB_TOOLS     = ['sql-assertion-js', 'dbt-test', 'great-expectations'];
const CICD_PLATFORMS = ['github', 'gitlab', 'jenkins', 'azure', 'circleci'];

// ── POST /api/generate-api-tests ────────────────────────────────────────────
router.post('/generate-api-tests', express.json(), async (req, res) => {
  try {
    const { baseUrl, tool = 'postman', endpoints, authType = 'bearer', options = {} } = req.body || {};
    if (!baseUrl) return res.status(400).json({ error: 'baseUrl is required' });
    if (!API_TOOLS.includes(tool)) return res.status(400).json({ error: `Unsupported tool. Choose one of: ${API_TOOLS.join(', ')}` });

    const jobId = uuidv4();
    const outputDir = path.join(__dirname, '../reports', jobId);
    const result = await apiGen.generate({ baseUrl, tool, endpoints, authType, options, outputDir });

    res.json({
      success: true,
      jobId,
      projectName: result.projectName,
      fileCount:   result.fileCount,
      tool:        result.tool,
      downloadUrl: `/api/download-advanced/${jobId}/${result.projectName}.zip`,
    });
  } catch (err) {
    console.error('API test generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/generate-security-tests ───────────────────────────────────────
router.post('/generate-security-tests', express.json(), async (req, res) => {
  try {
    const { targetUrl, tool = 'zap', scanDepth = 'baseline', options = {} } = req.body || {};
    if (!targetUrl) return res.status(400).json({ error: 'targetUrl is required' });
    if (!SEC_TOOLS.includes(tool)) return res.status(400).json({ error: `Unsupported tool. Choose one of: ${SEC_TOOLS.join(', ')}` });

    const jobId = uuidv4();
    const outputDir = path.join(__dirname, '../reports', jobId);
    const result = await secGen.generate({ targetUrl, tool, scanDepth, options, outputDir });

    res.json({
      success: true,
      jobId,
      projectName: result.projectName,
      fileCount:   result.fileCount,
      tool:        result.tool,
      scanDepth,
      downloadUrl: `/api/download-advanced/${jobId}/${result.projectName}.zip`,
    });
  } catch (err) {
    console.error('Security test generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/generate-performance-tests ────────────────────────────────────
router.post('/generate-performance-tests', express.json(), async (req, res) => {
  try {
    const { targetUrl, tool = 'k6', scenario = 'load', users, options = {} } = req.body || {};
    if (!targetUrl) return res.status(400).json({ error: 'targetUrl is required' });
    if (!PERF_TOOLS.includes(tool)) return res.status(400).json({ error: `Unsupported tool. Choose one of: ${PERF_TOOLS.join(', ')}` });

    const jobId = uuidv4();
    const outputDir = path.join(__dirname, '../reports', jobId);
    const result = await perfGen.generate({ targetUrl, tool, scenario, users, options, outputDir });

    res.json({
      success: true,
      jobId,
      projectName: result.projectName,
      fileCount:   result.fileCount,
      tool:        result.tool,
      scenario:    result.scenario,
      downloadUrl: `/api/download-advanced/${jobId}/${result.projectName}.zip`,
    });
  } catch (err) {
    console.error('Performance test generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/generate-accessibility-tests ──────────────────────────────────
router.post('/generate-accessibility-tests', express.json(), async (req, res) => {
  try {
    const { targetUrl, tool = 'playwright-axe', standard = 'wcag21aa', options = {} } = req.body || {};
    if (!targetUrl) return res.status(400).json({ error: 'targetUrl is required' });
    if (!A11Y_TOOLS.includes(tool)) return res.status(400).json({ error: `Unsupported tool. Choose one of: ${A11Y_TOOLS.join(', ')}` });

    const jobId = uuidv4();
    const outputDir = path.join(__dirname, '../reports', jobId);
    const result = await a11yGen.generate({ targetUrl, tool, standard, options, outputDir });
    res.json({ success: true, jobId, ...result, downloadUrl: `/api/download-advanced/${jobId}/${result.projectName}.zip` });
  } catch (err) {
    console.error('A11y generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/generate-visual-tests ─────────────────────────────────────────
router.post('/generate-visual-tests', express.json(), async (req, res) => {
  try {
    const { targetUrl, tool = 'playwright', options = {} } = req.body || {};
    if (!targetUrl) return res.status(400).json({ error: 'targetUrl is required' });
    if (!VISUAL_TOOLS.includes(tool)) return res.status(400).json({ error: `Unsupported tool. Choose one of: ${VISUAL_TOOLS.join(', ')}` });

    const jobId = uuidv4();
    const outputDir = path.join(__dirname, '../reports', jobId);
    const result = await visualGen.generate({ targetUrl, tool, options, outputDir });
    res.json({ success: true, jobId, ...result, downloadUrl: `/api/download-advanced/${jobId}/${result.projectName}.zip` });
  } catch (err) {
    console.error('Visual generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/generate-mobile-tests ─────────────────────────────────────────
router.post('/generate-mobile-tests', express.json(), async (req, res) => {
  try {
    const { appPackage = '', platform = 'android', tool = 'appium-webdriverio', options = {} } = req.body || {};
    if (!MOBILE_TOOLS.includes(tool)) return res.status(400).json({ error: `Unsupported tool. Choose one of: ${MOBILE_TOOLS.join(', ')}` });
    if (!['android', 'ios'].includes(platform)) return res.status(400).json({ error: 'platform must be android or ios' });

    const jobId = uuidv4();
    const outputDir = path.join(__dirname, '../reports', jobId);
    const result = await mobileGen.generate({ appPackage, platform, tool, options, outputDir });
    res.json({ success: true, jobId, ...result, downloadUrl: `/api/download-advanced/${jobId}/${result.projectName}.zip` });
  } catch (err) {
    console.error('Mobile generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/generate-database-tests ───────────────────────────────────────
router.post('/generate-database-tests', express.json(), async (req, res) => {
  try {
    const { dbType = 'postgres', tool = 'sql-assertion-js', options = {} } = req.body || {};
    if (!DB_TOOLS.includes(tool)) return res.status(400).json({ error: `Unsupported tool. Choose one of: ${DB_TOOLS.join(', ')}` });
    if (!['postgres', 'mysql', 'mssql', 'sqlite'].includes(dbType)) return res.status(400).json({ error: 'dbType must be postgres, mysql, mssql, or sqlite' });

    const jobId = uuidv4();
    const outputDir = path.join(__dirname, '../reports', jobId);
    const result = await dbGen.generate({ dbType, tool, options, outputDir });
    res.json({ success: true, jobId, ...result, downloadUrl: `/api/download-advanced/${jobId}/${result.projectName}.zip` });
  } catch (err) {
    console.error('DB generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/generate-cicd-pipeline ────────────────────────────────────────
router.post('/generate-cicd-pipeline', express.json(), async (req, res) => {
  try {
    const { platform = 'github', testStack = 'playwright', options = {} } = req.body || {};
    if (!CICD_PLATFORMS.includes(platform)) return res.status(400).json({ error: `Unsupported platform. Choose one of: ${CICD_PLATFORMS.join(', ')}` });

    const jobId = uuidv4();
    const outputDir = path.join(__dirname, '../reports', jobId);
    const result = await cicdGen.generate({ platform, testStack, options, outputDir });
    res.json({ success: true, jobId, ...result, downloadUrl: `/api/download-advanced/${jobId}/${result.projectName}.zip` });
  } catch (err) {
    console.error('CI/CD generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/download-advanced/:jobId/:filename ─────────────────────────────
router.get('/download-advanced/:jobId/:filename', (req, res) => {
  // Validate to prevent path traversal
  const { jobId, filename } = req.params;
  if (!/^[a-f0-9-]+$/i.test(jobId))        return res.status(400).json({ error: 'Invalid jobId' });
  // Block path separators and ".." sequences but allow single dots (e.g. ".zip")
  if (/[/\\]/.test(filename) || filename.includes('..')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  const zipPath = path.join(__dirname, '../reports', jobId, filename);
  if (!fs.existsSync(zipPath)) return res.status(404).json({ error: 'File not found' });
  res.download(zipPath);
});

// ── GET /api/tools — report available tools per type ───────────────────────
router.get('/tools', (req, res) => {
  res.json({
    api:           API_TOOLS,
    security:      SEC_TOOLS,
    performance:   PERF_TOOLS,
    accessibility: A11Y_TOOLS,
    visual:        VISUAL_TOOLS,
    mobile:        MOBILE_TOOLS,
    database:      DB_TOOLS,
    cicd:          CICD_PLATFORMS,
    scenarios:     ['smoke', 'load', 'stress', 'spike', 'soak'],
    scanDepths:    ['baseline', 'full', 'active'],
    a11yStandards: ['wcag2a', 'wcag2aa', 'wcag21aa', 'section508'],
    dbTypes:       ['postgres', 'mysql', 'mssql', 'sqlite'],
    mobilePlatforms: ['android', 'ios'],
  });
});

module.exports = router;
