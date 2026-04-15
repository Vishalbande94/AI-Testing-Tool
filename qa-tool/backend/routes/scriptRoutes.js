// ── Script Generator Routes ──────────────────────────────────────────────────
const express         = require('express');
const multer          = require('multer');
const path            = require('path');
const fs              = require('fs');
const { v4: uuidv4 }  = require('uuid');
const parser               = require('../services/parser');
const testCaseSheetParser   = require('../services/testCaseSheetParser');
const testGenerator         = require('../services/testGenerator');
const scriptGenerator       = require('../services/scriptGenerator');
const claudeClient          = require('../services/agents/claudeClient');
const testArchitectAgent    = require('../services/agents/testArchitectAgent');

const router = express.Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads'),
  filename: (req, file, cb) => cb(null, `script_${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });
const sgUpload = upload.fields([
  { name: 'requirementFile', maxCount: 1 },
  { name: 'testcaseFile',    maxCount: 1 },
]);

// ── POST /api/generate-scripts ──────────────────────────────────────────────
router.post('/generate-scripts', sgUpload, async (req, res) => {
  const { appUrl, tool, language, framework, testType, genericMode } = req.body;
  const reqFile   = req.files?.requirementFile?.[0] || null;
  const sheetFile = req.files?.testcaseFile?.[0]    || null;

  if (!appUrl) return res.status(400).json({ error: 'appUrl is required' });
  if (!reqFile && !sheetFile && genericMode !== 'true') {
    return res.status(400).json({ error: 'Provide requirementFile, testcaseFile, or enable Generic Mode' });
  }

  try {
    let testCases;

    if (sheetFile) {
      // Skip requirement analysis — import test cases directly
      testCases = await testCaseSheetParser.parse(sheetFile.path);
    } else {
      // Parse requirements text (doc or generic)
      let requirementText;
      if (genericMode === 'true') {
        requirementText = 'login register signup authentication payment checkout billing form validation submit search filter logout signout session password forgot reset dashboard home overview navigation menu link profile account settings';
      } else {
        requirementText = await parser.extractText(reqFile.path);
      }

      // Generate test cases
      if (claudeClient.isConfigured()) {
        try {
          testCases = await testArchitectAgent.generate(requirementText, { testScope: testType || 'regression', priorityFilter: 'all' });
        } catch (e) {
          testCases = testGenerator.generate(requirementText, { testScope: testType || 'regression' });
        }
      } else {
        testCases = testGenerator.generate(requirementText, { testScope: testType || 'regression' });
      }
    }

    // Generate scripts
    const jobId = uuidv4();
    const outputDir = path.join(__dirname, '../reports', jobId);

    const result = await scriptGenerator.generate({
      appUrl,
      testCases,
      tool:      tool || 'playwright',
      language:  language || 'javascript',
      framework: framework || 'pom',
      testType:  testType || 'regression',
      outputDir,
    });

    res.json({
      success: true,
      jobId,
      projectName: result.projectName,
      fileCount: result.fileCount,
      testCaseCount: testCases.length,
      downloadUrl: `/api/download-scripts/${jobId}/${result.projectName}.zip`,
      aiEnabled: claudeClient.isConfigured(),
    });

  } catch (err) {
    console.error('Script generation error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    if (reqFile)   { try { fs.unlinkSync(reqFile.path);   } catch (e) {} }
    if (sheetFile) { try { fs.unlinkSync(sheetFile.path); } catch (e) {} }
  }
});

// ── GET /api/download-scripts/:jobId/:filename ──────────────────────────────
router.get('/download-scripts/:jobId/:filename', (req, res) => {
  const zipPath = path.join(__dirname, '../reports', req.params.jobId, req.params.filename);
  if (!fs.existsSync(zipPath)) return res.status(404).json({ error: 'File not found' });
  res.download(zipPath);
});

module.exports = router;
