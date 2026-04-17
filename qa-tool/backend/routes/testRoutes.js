// ── QA Tool Routes ────────────────────────────────────────────────────────────
const express         = require('express');
const multer          = require('multer');
const path            = require('path');
const fs              = require('fs');
const { v4: uuidv4 }  = require('uuid');

const parser            = require('../services/parser');
const testCaseSheetParser = require('../services/testCaseSheetParser');
const testGenerator     = require('../services/testGenerator');
const urlAnalyzer       = require('../services/urlAnalyzer');
const playwrightRunner  = require('../services/playwrightRunner');
const reportGenerator   = require('../services/reportGenerator');
const excelGenerator    = require('../services/excelGenerator');
const historyStore      = require('../services/historyStore');

// ── AI Agents ─────────────────────────────────────────────────────────────────
const claudeClient              = require('../services/agents/claudeClient');
const requirementAnalystAgent = require('../services/agents/requirementAnalystAgent');
const testArchitectAgent      = require('../services/agents/testArchitectAgent');
const executionEngineerAgent  = require('../services/agents/executionEngineerAgent');
const qaDirectorAgent         = require('../services/agents/qaDirectorAgent');
const reportAnalystAgent      = require('../services/agents/reportAnalystAgent');
const jiraService             = require('../services/jiraService');

const router = express.Router();

// ── Multer config ─────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `req_${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const reqExts   = ['.pdf', '.txt', '.md'];
    const sheetExts = ['.csv', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (file.fieldname === 'requirementFile' && reqExts.includes(ext))  return cb(null, true);
    if (file.fieldname === 'testcaseFile'    && sheetExts.includes(ext)) return cb(null, true);
    return cb(new Error(`Unsupported file type ${ext} for ${file.fieldname}. Requirement: PDF/TXT/MD. Test-case sheet: CSV/XLSX.`));
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
});

// Multi-field uploader — accepts either a requirement doc OR a test case sheet
const runUpload = upload.fields([
  { name: 'requirementFile', maxCount: 1 },
  { name: 'testcaseFile',    maxCount: 1 },
]);

// ── In-memory job store ───────────────────────────────────────────────────────
const jobs = new Map();
// job schema: { jobId, status, logs: [], results: null, error: null, createdAt }

// ── GET /api/history ─────────────────────────────────────────────────────────
router.get('/history', (req, res) => {
  res.json(historyStore.getHistory());
});

// ── POST /api/generate-testcases-only ───────────────────────────────────────
// Generates test cases + Excel WITHOUT running Playwright.
// Useful for QA teams that want documentation/deliverables, not execution.
router.post('/generate-testcases-only', runUpload, async (req, res) => {
  const { appUrl } = req.body;
  const genericMode = req.body.genericMode === 'true';
  const urlOnlyMode = req.body.urlOnlyMode === 'true';
  const reqFile   = req.files?.requirementFile?.[0] || null;
  const sheetFile = req.files?.testcaseFile?.[0]    || null;

  if (!appUrl) return res.status(400).json({ error: 'appUrl is required' });

  const inputMode = sheetFile   ? 'testcase-sheet'
                   : reqFile    ? 'requirement-doc'
                   : urlOnlyMode ? 'url-only'
                   : genericMode ? 'generic'
                   : null;
  if (!inputMode) return res.status(400).json({ error: 'Provide requirementFile, testcaseFile, urlOnlyMode, or genericMode' });

  const jobId = uuidv4();
  const reportDir = path.join(__dirname, '../reports', jobId);
  fs.mkdirSync(reportDir, { recursive: true });

  try {
    let testCases = null;
    let requirementText = '';

    // 1. Get test cases based on input mode
    if (inputMode === 'testcase-sheet') {
      testCases = await testCaseSheetParser.parse(sheetFile.path);
    } else if (inputMode === 'url-only') {
      try {
        const analysis = await urlAnalyzer.analyze(appUrl);
        const standardKw = 'login register signup authentication payment checkout billing form validation submit search filter logout signout session password forgot reset dashboard home overview navigation menu link profile account settings';
        requirementText = analysis.keywords.join(' ') + ' ' + standardKw + ' ' + (analysis.summary.title || '');
      } catch {
        requirementText = 'login register signup authentication payment checkout billing form validation submit search filter logout signout session password forgot reset dashboard home overview navigation menu link profile account settings';
      }
    } else if (inputMode === 'generic') {
      requirementText = 'login register signup authentication payment checkout billing form validation submit search filter logout signout session password forgot reset dashboard home overview navigation menu link profile account settings';
    } else {
      requirementText = await parser.extractText(reqFile.path);
    }

    // 2. Generate test cases if we have text (not already loaded from sheet)
    if (!testCases) {
      const runConfig = {
        testScope: req.body.testScope || 'regression',
        priorityFilter: req.body.priorityFilter || 'all',
      };
      // Try AI first, fall back to rule-based
      if (claudeClient.isConfigured()) {
        try {
          testCases = await testArchitectAgent.generate(requirementText, runConfig);
        } catch {
          testCases = testGenerator.generate(requirementText, runConfig);
        }
      } else {
        testCases = testGenerator.generate(requirementText, runConfig);
      }
    }

    // 3. Save test cases as JSON
    fs.writeFileSync(path.join(reportDir, 'testcases.json'), JSON.stringify(testCases, null, 2));

    // 4. Generate Excel (empty stats since no execution)
    const emptyStats = {
      total: testCases.length, passed: 0, failed: 0, skipped: testCases.length,
      duration: 0, passRate: 0,
    };
    const excelPath = await excelGenerator.generate(testCases, emptyStats, appUrl, reportDir);

    res.json({
      success: true,
      jobId,
      testCaseCount: testCases.length,
      modules: [...new Set(testCases.map(t => t.module))],
      excelUrl: `/api/download/${jobId}/excel`,
      jsonUrl:  `/api/download/${jobId}/testcases-only`,
      message: `Generated ${testCases.length} test cases. Download Excel or JSON to use.`,
    });
  } catch (err) {
    console.error('generate-testcases-only error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    if (reqFile)   { try { fs.unlinkSync(reqFile.path);   } catch {} }
    if (sheetFile) { try { fs.unlinkSync(sheetFile.path); } catch {} }
  }
});

// ── GET /api/download/:jobId/testcases-only — JSON download for generate-only
router.get('/download/:jobId/testcases-only', (req, res) => {
  const jsonPath = path.join(__dirname, '../reports', req.params.jobId, 'testcases.json');
  if (!fs.existsSync(jsonPath)) return res.status(404).json({ error: 'File not found' });
  res.download(jsonPath, 'test-cases.json');
});

// ── POST /api/analyze-url — preview what tests would be generated ───────────
router.post('/analyze-url', express.json(), async (req, res) => {
  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: 'url is required' });
  try {
    const analysis = await urlAnalyzer.analyze(url);
    res.json(analysis);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/testcase-template?format=csv|xlsx — sample sheet ────────────────
router.get('/testcase-template', async (req, res) => {
  const fmt = (req.query.format || 'csv').toLowerCase();
  try {
    if (fmt === 'xlsx') {
      const buffer = await testCaseSheetParser.sampleXlsx();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=testcase-template.xlsx');
      return res.send(Buffer.from(buffer));
    }
    // default CSV
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=testcase-template.csv');
    return res.send(testCaseSheetParser.sampleCsv());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/execute ─────────────────────────────────────────────────────────
router.post('/execute', runUpload, async (req, res) => {
  const { appUrl } = req.body;

  const genericMode  = req.body.genericMode === 'true';
  const urlOnlyMode  = req.body.urlOnlyMode === 'true';
  const reqFile      = req.files?.requirementFile?.[0] || null;
  const sheetFile    = req.files?.testcaseFile?.[0]    || null;
  const inputMode    = sheetFile ? 'testcase-sheet'
                     : reqFile   ? 'requirement-doc'
                     : urlOnlyMode ? 'url-only'
                     : genericMode ? 'generic'
                     : null;

  if (!appUrl) return res.status(400).json({ error: 'appUrl is required' });
  if (!inputMode) return res.status(400).json({ error: 'Provide one of: requirementFile, testcaseFile, urlOnlyMode, or genericMode' });

  // ── Parse run configuration ─────────────────────────────────────────────────
  let browsers = ['chromium'];
  try { browsers = JSON.parse(req.body.browsers || '["chromium"]'); } catch {}
  let selectedModules = [];
  if (req.body.selectedModules) {
    try {
      const parsed = JSON.parse(req.body.selectedModules);
      selectedModules = Array.isArray(parsed) ? parsed : [];
    } catch {
      // Tolerate comma-separated or single value
      selectedModules = String(req.body.selectedModules)
        .split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  const runConfig = {
    browsers,
    testScope:           req.body.testScope           || 'regression',
    priorityFilter:      req.body.priorityFilter       || 'all',
    selectedModules,
    workers:             parseInt(req.body.workers)     || 3,
    retries:             parseInt(req.body.retries)     || 0,
    screenshots:         req.body.screenshots           || 'only-on-failure',
    video:               req.body.video                 || 'off',
    trace:               req.body.trace                 || 'off',
    environment:         req.body.environment           || 'QA',
    includeAccessibility: req.body.includeAccessibility === 'true',
    includePerformance:   req.body.includePerformance   === 'true',
  };

  // Auth config for target app (optional) — form login / basic / bearer / cookie
  if (req.body.authType && req.body.authType !== 'none') {
    runConfig.auth = {
      type:           req.body.authType,                   // form | basic | bearer | cookie
      loginUrl:       req.body.authLoginUrl       || '',
      username:       req.body.authUsername       || '',
      password:       req.body.authPassword       || '',
      userField:      req.body.authUserField      || '',  // CSS selector override
      passField:      req.body.authPassField      || '',
      submitSelector: req.body.authSubmitSelector || '',
      token:          req.body.authToken          || '',
      cookie:         req.body.authCookie         || '',
    };
  }

  const jobId = uuidv4();
  const job = {
    jobId,
    status: 'running',
    logs: [],
    results: null,
    error: null,
    createdAt: new Date().toISOString(),
    runConfig,
  };
  jobs.set(jobId, job);

  const log = (msg) => {
    const entry = `[${new Date().toISOString()}] ${msg}`;
    console.log(entry);
    job.logs.push(entry);
  };

  // Return jobId immediately so frontend can start polling
  res.json({ jobId, message: 'Execution started' });

  // ── Run pipeline asynchronously ────────────────────────────────────────────
  const aiEnabled = claudeClient.isConfigured();
  const totalSteps = aiEnabled ? 10 : 6;

  (async () => {
    try {
      // ── Step 1: Decide input path — sheet / requirement / generic ─────
      let requirementText = null;
      let testCases = null;
      let requirementAnalysis = null;

      if (inputMode === 'testcase-sheet') {
        log(`📑 Step 1/${totalSteps} — Importing test cases from sheet (${sheetFile.originalname})...`);
        try {
          testCases = await testCaseSheetParser.parse(sheetFile.path);
          log(`   ✅ Imported ${testCases.length} test case(s) directly — skipping requirement analysis + AI generation.`);
          log(`   📦 Modules: ${[...new Set(testCases.map(t => t.module))].join(', ')}`);
        } catch (err) {
          throw new Error(`Failed to parse test case sheet: ${err.message}`);
        }
      } else if (inputMode === 'generic') {
        log(`🧪 Step 1/${totalSteps} — Generic Test Mode — using all modules...`);
        requirementText = 'login register signup authentication payment checkout billing form validation submit search filter logout signout session password forgot reset dashboard home overview navigation menu link profile account settings';
        log(`   All 10 test modules will be generated`);
      } else if (inputMode === 'url-only') {
        log(`🌐 Step 1/${totalSteps} — URL Analysis — crawling ${appUrl}...`);
        try {
          const analysis = await urlAnalyzer.analyze(appUrl);
          log(`   📄 Page title: "${analysis.summary.title || '(no title)'}"`);
          log(`   🕸️ Crawled ${analysis.summary.pagesCrawled || 1} page(s)`);
          if (analysis.pages?.length > 1) {
            analysis.pages.forEach(p => log(`      → ${p.url}: ${p.detectedFeatures.join(', ') || 'no features'} (${p.forms} forms, ${p.inputs} inputs)`));
          }
          log(`   🔍 Found: ${analysis.summary.formsCount} form(s), ${analysis.summary.inputsCount} input(s), ${analysis.summary.buttonsCount} button(s), ${analysis.summary.linksCount} link(s)`);
          const featured = Object.keys(analysis.summary.detected).filter(k => analysis.summary.detected[k]);
          log(`   ✨ Features detected: ${featured.join(', ') || 'minimal — adding all standard modules'}`);
          log(`   🏷️ Keywords: ${analysis.keywords.join(', ')}`);

          // Build comprehensive requirement text:
          // URL-extracted keywords + ALL standard modules for complete coverage
          const standardKeywords = 'login register signup authentication payment checkout billing form validation submit search filter logout signout session password forgot reset dashboard home overview navigation menu link profile account settings';
          requirementText = analysis.keywords.join(' ') + ' ' + standardKeywords + ' ' + (analysis.summary.title || '') + ' ' + (analysis.summary.description || '');
          runConfig.urlAnalysis = analysis.summary;
        } catch (err) {
          log(`   ⚠️ URL analysis failed (${err.message}), using all standard modules`);
          requirementText = 'login register signup authentication payment checkout billing form validation submit search filter logout signout session password forgot reset dashboard home overview navigation menu link profile account settings';
        }
      } else {
        log(`📄 Step 1/${totalSteps} — Parsing requirement document...`);
        requirementText = await parser.extractText(reqFile.path);
        log(`   Extracted ${requirementText.length} characters from ${reqFile.originalname}`);
      }

      // ── Step 1b: Requirement Analysis (AGENT) — skipped in sheet mode ──
      if (aiEnabled && inputMode !== 'testcase-sheet') {
        log(`📋 Step 2/${totalSteps} — Requirement Analyst (12 yrs exp) analyzing document...`);
        try {
          requirementAnalysis = await requirementAnalystAgent.analyze(requirementText, runConfig);
          log(`   ✅ Domain detected: ${requirementAnalysis.domain} (${requirementAnalysis.domainConfidence}% confidence)`);
          log(`   📦 Modules: ${(requirementAnalysis.modules || []).map(m => m.name).join(', ')}`);
          log(`   ⚠️ Ambiguities: ${(requirementAnalysis.ambiguities || []).length} | Risks: ${(requirementAnalysis.riskAreas || []).length}`);
          log(`   📝 Testable requirements: ${(requirementAnalysis.testableRequirements || []).length}`);
        } catch (aiErr) {
          log(`   ⚠️ Requirement analysis skipped: ${aiErr.message}`);
        }
      }

      // ── Step 2: Generate test cases (AGENT or SYSTEM) — skipped in sheet mode ──
      if (inputMode !== 'testcase-sheet') {
        if (aiEnabled) {
          const stepNum = 3;
          log(`🧠 Step ${stepNum}/${totalSteps} — Test Architect (15 yrs exp) generating test cases...`);
          log(`   Scope: ${runConfig.testScope} | Priority: ${runConfig.priorityFilter} | Browsers: [${runConfig.browsers.join(', ')}]`);
          if (requirementAnalysis) {
            log(`   Using Requirement Analyst's structured output (${requirementAnalysis.domain} domain)`);
          }
          try {
            testCases = await testArchitectAgent.generate(requirementText, runConfig);
            log(`   ✅ AI generated ${testCases.length} test cases across ${[...new Set(testCases.map(t => t.module))].length} modules`);
          } catch (aiErr) {
            log(`   ⚠️ AI agent error, falling back to rule-based: ${aiErr.message}`);
            testCases = null;
          }
        }
        if (!testCases || testCases.length === 0) {
          log(`🧠 Step ${aiEnabled ? 3 : 2}/${totalSteps} — Generating test cases (rule-based fallback)...`);
          log(`   Scope: ${runConfig.testScope} | Priority: ${runConfig.priorityFilter} | Browsers: [${runConfig.browsers.join(', ')}]`);
          testCases = testGenerator.generate(requirementText, runConfig);
          log(`   Generated ${testCases.length} test cases across ${[...new Set(testCases.map(t => t.module))].length} modules`);
        }
      }

      // Save test cases to reports dir
      const reportDir = path.join(__dirname, '../reports', jobId);
      fs.mkdirSync(reportDir, { recursive: true });
      fs.writeFileSync(
        path.join(reportDir, 'testcases-initial.json'),
        JSON.stringify(testCases, null, 2)
      );

      // ── Step 2b: QA Director reviews test plan (AI only) ────────────────
      let testPlanReview = null;
      if (aiEnabled && inputMode !== 'testcase-sheet') {
        log(`👔 Step 3/${totalSteps} — QA Director (20 yrs exp) reviewing test plan...`);
        try {
          testPlanReview = await qaDirectorAgent.reviewTestPlan(requirementText, testCases, runConfig);
          log(`   ✅ Verdict: ${testPlanReview.verdict} | Coverage: ${testPlanReview.coverageScore}% | Gaps: ${(testPlanReview.gaps || []).length}`);
        } catch (aiErr) {
          log(`   ⚠️ Director review skipped: ${aiErr.message}`);
        }
      }

      // ── Step 3: Generate Playwright spec (optionally AI-enhanced) ───────
      const specStepNum = aiEnabled ? 4 : 3;
      log(`🎭 Step ${specStepNum}/${totalSteps} — Converting test cases to Playwright scripts...`);
      let specContent = playwrightRunner.generateSpec(appUrl, testCases, runConfig);
      const extraTests = (runConfig.includeAccessibility ? 1 : 0) + (runConfig.includePerformance ? 1 : 0);
      log(`   Template spec: ${testCases.length} test functions${extraTests ? ` + ${extraTests} built-in checks` : ''}`);

      if (aiEnabled) {
        log(`🤖 AI Execution Engineer (10 yrs exp) enhancing Playwright spec...`);
        try {
          specContent = await executionEngineerAgent.enhanceSpec(appUrl, testCases, runConfig, specContent);
          log(`   ✅ Spec enhanced with smart selectors and domain-aware logic`);
        } catch (aiErr) {
          log(`   ⚠️ AI spec enhancement failed, using template: ${aiErr.message}`);
          // specContent already has the template version
        }
      }

      // ── Step 4: Execute Playwright tests ────────────────────────────────
      const execStepNum = aiEnabled ? 5 : 4;
      log(`⚡ Step ${execStepNum}/${totalSteps} — Executing Playwright tests...`);
      const executionResults = await playwrightRunner.execute(specContent, appUrl, log, runConfig, jobId);
      // Honor cancellation — if user clicked Cancel, don't continue the pipeline
      if (executionResults.cancelled || job.status === 'cancelled') {
        log(`🛑 Run cancelled by user.`);
        job.status = 'cancelled';
        return;
      }
      log(`   Execution complete — ${executionResults.passed} passed, ${executionResults.failed} failed`);

      // ── Step 5: Merge results ───────────────────────────────────────────
      const mergeStepNum = aiEnabled ? 6 : 5;
      log(`📊 Step ${mergeStepNum}/${totalSteps} — Updating test cases with execution results...`);
      const updatedTestCases = testGenerator.mergeResults(testCases, executionResults.testResults);

      const execStats = {
        total:    testCases.length,
        passed:   executionResults.passed,
        failed:   executionResults.failed,
        skipped:  executionResults.skipped,
        duration: executionResults.duration,
        passRate: testCases.length > 0
          ? Math.round((executionResults.passed / testCases.length) * 100)
          : 0,
      };

      // ── Step 5b: QA Director reviews results (AI only) ──────────────────
      let resultsReview = null;
      if (aiEnabled) {
        log(`👔 Step 7/${totalSteps} — QA Director reviewing execution results...`);
        try {
          resultsReview = await qaDirectorAgent.reviewResults(updatedTestCases, execStats, appUrl, runConfig);
          log(`   ✅ Risk: ${resultsReview.overallRisk} | Sign-off: ${resultsReview.signOff ? 'YES' : 'NO'} | Recommendations: ${(resultsReview.recommendations || []).length}`);
        } catch (aiErr) {
          log(`   ⚠️ Director results review skipped: ${aiErr.message}`);
        }
      }

      // ── JIRA: Auto-log bugs from failures ──────────────────────────────
      let jiraResults = [];
      if (jiraService.isConfigured()) {
        const failedTests = updatedTestCases.filter(tc => tc.status === 'Fail');
        if (failedTests.length > 0) {
          log(`🔗 JIRA — Logging ${failedTests.length} bug(s) to ${jiraService.getStatus().projectKey}...`);
          try {
            jiraResults = await jiraService.createBugsFromFailures(failedTests, {
              appUrl, environment: runConfig.environment, jobId,
            });
            const created = jiraResults.filter(r => r.jiraKey);
            const failed  = jiraResults.filter(r => !r.jiraKey);
            log(`   ✅ ${created.length} ticket(s) created: ${created.map(r => r.jiraKey).join(', ')}`);
            if (failed.length) log(`   ⚠️ ${failed.length} ticket(s) failed to create`);

            // Link JIRA tickets back to test cases
            updatedTestCases.splice(0, updatedTestCases.length, ...jiraService.linkTicketsToTestCases(updatedTestCases, jiraResults));
          } catch (jiraErr) {
            log(`   ⚠️ JIRA logging failed: ${jiraErr.message}`);
          }
        } else {
          log(`🔗 JIRA — No failures to log, skipping`);
        }
      }

      // ── Step 8: Report Analyst writes report (AGENT) ───────────────────
      let reportAnalysis = null;
      if (aiEnabled) {
        log(`📊 Step ${totalSteps - 1}/${totalSteps} — Report Analyst (8 yrs exp) writing executive report + bug reports...`);
        try {
          reportAnalysis = await reportAnalystAgent.generateReport({
            testCases: updatedTestCases,
            executionStats: execStats,
            appUrl,
            runConfig,
            requirementAnalysis,
            testPlanReview,
            resultsReview,
            runHistory: require('../services/historyStore').getHistory(),
          });
          log(`   ✅ Report: ${reportAnalysis.executiveSummary?.status} | Bug reports: ${(reportAnalysis.bugReports || []).length}`);
          log(`   📋 Headline: "${reportAnalysis.executiveSummary?.headline}"`);
        } catch (aiErr) {
          log(`   ⚠️ Report analysis skipped: ${aiErr.message}`);
        }
      }

      // ── Step 9: Generate HTML + Excel reports (SYSTEM) ──────────────────
      log(`📝 Step ${totalSteps}/${totalSteps} — Generating HTML report + Excel file...`);
      const [reportPath, excelPath] = await Promise.all([
        reportGenerator.generate({
          jobId,
          appUrl,
          testCases: updatedTestCases,
          executionStats: execStats,
          reportDir,
          runConfig,
          testPlanReview,
          resultsReview,
        }),
        excelGenerator.generate(updatedTestCases, execStats, appUrl, reportDir),
      ]);
      log(`   HTML report : ${reportPath}`);
      log(`   Excel file  : ${excelPath}`);

      // Save updated test cases JSON too
      fs.writeFileSync(
        path.join(reportDir, 'testcases-updated.json'),
        JSON.stringify(updatedTestCases, null, 2)
      );

      log(`✅ All done! 5 agents completed. Downloads ready.`);

      // Save to run history
      historyStore.saveRun({
        jobId,
        appUrl,
        environment: runConfig.environment,
        browsers:    runConfig.browsers,
        testScope:   runConfig.testScope,
        stats:       execStats,
      });

      job.status = 'done';
      job.results = {
        testCases:      updatedTestCases,
        executionStats: execStats,
        runConfig,
        reportUrl:      `/reports/${jobId}/report.html`,
        testCasesUrl:   `/reports/${jobId}/testcases-updated.json`,
        excelUrl:       `/reports/${jobId}/test-cases.xlsx`,
        aiEnabled,
        requirementAnalysis,
        testPlanReview,
        resultsReview,
        reportAnalysis,
        jiraResults,
        jiraConfigured: jiraService.isConfigured(),
      };

    } catch (err) {
      console.error('Pipeline error:', err);
      job.status = 'error';
      job.error  = err.message;
      job.logs.push(`[ERROR] ${err.message}`);
    } finally {
      // Cleanup uploaded files
      if (reqFile)   { try { fs.unlinkSync(reqFile.path);   } catch (e) { /* ignore */ } }
      if (sheetFile) { try { fs.unlinkSync(sheetFile.path); } catch (e) { /* ignore */ } }
    }
  })();
});

// ── GET /api/status/:jobId — Poll for status + logs ──────────────────────────
// ── POST /api/jobs/:jobId/cancel — stop a running test ──────────────────────
router.post('/jobs/:jobId/cancel', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  if (job.status !== 'running') {
    return res.status(400).json({ error: `Job is ${job.status}, not running` });
  }
  job.status = 'cancelled';
  job.logs.push(`[${new Date().toISOString()}] 🛑 Cancellation requested by user`);
  const killed = playwrightRunner.cancelRunningJob(req.params.jobId);
  res.json({ ok: true, killedSubprocess: killed });
});

router.get('/status/:jobId', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  res.json({
    jobId:   job.jobId,
    status:  job.status,
    logs:    job.logs,
    results: job.results,
    error:   job.error,
  });
});

// ── GET /api/download/:jobId/report ──────────────────────────────────────────
router.get('/download/:jobId/report', (req, res) => {
  const reportPath = path.join(__dirname, '../reports', req.params.jobId, 'report.html');
  if (!fs.existsSync(reportPath)) return res.status(404).json({ error: 'Report not found' });
  res.download(reportPath, 'qa-report.html');
});

// ── GET /api/download/:jobId/testcases ───────────────────────────────────────
router.get('/download/:jobId/testcases', (req, res) => {
  const tcPath = path.join(__dirname, '../reports', req.params.jobId, 'testcases-updated.json');
  if (!fs.existsSync(tcPath)) return res.status(404).json({ error: 'Test cases not found' });
  res.download(tcPath, 'test-cases.json');
});

// ── GET /api/download/:jobId/excel ────────────────────────────────────────────
router.get('/download/:jobId/excel', (req, res) => {
  const xlPath = path.join(__dirname, '../reports', req.params.jobId, 'test-cases.xlsx');
  if (!fs.existsSync(xlPath)) return res.status(404).json({ error: 'Excel file not found' });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.download(xlPath, 'QA_Test_Cases.xlsx');
});

module.exports = router;
