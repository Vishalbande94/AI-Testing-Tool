// ── Exploratory Testing Routes ────────────────────────────────────────────────
// Handles screenshot/video upload and AI-powered exploratory test case generation
const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { v4: uuidv4 } = require('uuid');

const claudeClient         = require('../services/agents/claudeClient');
const exploratoryTestAgent = require('../services/agents/exploratoryTestAgent');
const exploratoryFallback  = require('../services/exploratoryFallback');

// ── Resolve bundled ffmpeg/ffprobe binaries (no system install needed) ───────
let FFMPEG_PATH = null;
let FFPROBE_PATH = null;
try {
  FFMPEG_PATH = require('ffmpeg-static');
} catch { /* not installed — will fall back to system PATH */ }
try {
  FFPROBE_PATH = require('ffprobe-static').path;
} catch { /* not installed — will fall back to system PATH */ }

const router = express.Router();

// ── Multer config for images and videos ──────────────────────────────────────
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `exploratory_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedImages = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'];
    const allowedVideos = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v'];
    const ext = path.extname(file.originalname).toLowerCase();
    const mimeOk = /^(image|video)\//i.test(file.mimetype || '');
    if (allowedImages.includes(ext) || allowedVideos.includes(ext) || mimeOk) {
      cb(null, true);
    } else {
      cb(new Error(`File "${file.originalname}" (${file.mimetype}) is not supported. Only image files (PNG, JPG, GIF, WebP, BMP) and video files (MP4, WebM, MOV, AVI, MKV) are allowed.`));
    }
  },
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB max per file
});

// Multer error wrapper — convert errors to JSON responses instead of crashing
const uploadMiddleware = (req, res, next) => {
  upload.array('files', 20)(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File too large. Maximum size is 200MB per file.' });
        }
        return res.status(400).json({ error: `Upload error: ${err.message}` });
      }
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

// ── Helper: Convert image file to base64 ─────────────────────────────────────
function imageToBase64(filePath) {
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mimeMap = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
  };
  return {
    type: mimeMap[ext] || 'image/png',
    data: buffer.toString('base64'),
  };
}

// ── Helper: Extract frames from video using bundled ffmpeg ──────────────────
async function extractVideoFrames(videoPath, maxFrames = 20) {
  const { execFileSync, execSync } = require('child_process');
  const framesDir = path.join(path.dirname(videoPath), `frames_${Date.now()}`);
  fs.mkdirSync(framesDir, { recursive: true });

  const ffmpegCmd  = FFMPEG_PATH  || 'ffmpeg';
  const ffprobeCmd = FFPROBE_PATH || 'ffprobe';

  // Verify ffmpeg is accessible
  try {
    execFileSync(ffmpegCmd, ['-version'], { stdio: 'ignore' });
  } catch {
    try { fs.rmSync(framesDir, { recursive: true, force: true }); } catch {}
    throw new Error('ffmpeg binary not available. Install ffmpeg-static: npm install ffmpeg-static');
  }

  try {
    // Get video duration (use ffprobe if available, otherwise fallback via ffmpeg)
    let duration = 10;
    try {
      const durationStr = execFileSync(
        ffprobeCmd,
        ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', videoPath],
        { encoding: 'utf-8' }
      ).trim();
      duration = parseFloat(durationStr) || 10;
    } catch {
      // Fallback — assume moderate length
      duration = 30;
    }

    // Extract frames evenly spread across the video
    const interval = Math.max(duration / maxFrames, 0.5);
    execFileSync(
      ffmpegCmd,
      [
        '-i', videoPath,
        '-vf', `fps=1/${interval}`,
        '-frames:v', String(maxFrames),
        '-q:v', '2',
        path.join(framesDir, 'frame_%03d.jpg'),
      ],
      { stdio: 'ignore' }
    );

    const frameFiles = fs.readdirSync(framesDir)
      .filter(f => f.endsWith('.jpg'))
      .sort()
      .map(f => path.join(framesDir, f));

    const frames = frameFiles.map(f => imageToBase64(f));

    // Cleanup
    frameFiles.forEach(f => { try { fs.unlinkSync(f); } catch {} });
    try { fs.rmdirSync(framesDir); } catch {}

    return frames;
  } catch (err) {
    try { fs.rmSync(framesDir, { recursive: true, force: true }); } catch {}
    throw new Error(`Failed to extract video frames: ${err.message}`);
  }
}

// ── In-memory store for exploratory sessions ─────────────────────────────────
const sessions = new Map();

// ── POST /api/exploratory/analyze — Upload screenshots/video and analyze ─────
router.post('/exploratory/analyze', uploadMiddleware, async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'At least one screenshot or video file is required.' });
  }

  const aiEnabled = claudeClient.isConfigured();

  const sessionId = uuidv4();
  const session = {
    sessionId,
    status: 'processing',
    logs: [],
    results: null,
    error: null,
    createdAt: new Date().toISOString(),
  };
  sessions.set(sessionId, session);

  const log = (msg) => {
    const entry = `[${new Date().toISOString()}] ${msg}`;
    console.log(entry);
    session.logs.push(entry);
  };

  // Return sessionId immediately
  res.json({ sessionId, message: 'Analysis started' });

  // Context from request body
  const context = {
    appUrl: req.body.appUrl || '',
    appName: req.body.appName || '',
    module: req.body.module || '',
    domain: req.body.domain || '',
    notes: req.body.notes || '',
  };

  (async () => {
    try {
      const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'];
      const videoExts = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v'];

      const imageFiles = req.files.filter(f => imageExts.includes(path.extname(f.originalname).toLowerCase()));
      const videoFiles = req.files.filter(f => videoExts.includes(path.extname(f.originalname).toLowerCase()));

      log(`📁 Received ${req.files.length} file(s) — ${imageFiles.length} image(s), ${videoFiles.length} video(s)`);
      log(`   AI mode: ${aiEnabled ? 'ENABLED (Claude Vision)' : 'DISABLED (template-based fallback)'}`);

      let analysis;

      if (!aiEnabled) {
        // ── Fallback: template-based generation without AI ────────────────
        log(`📋 Generating template-based exploratory test plan...`);
        log(`   Context — App: ${context.appName || 'N/A'} | Module: ${context.module || 'N/A'} | Domain: ${context.domain || 'Generic'}`);
        analysis = exploratoryFallback.generateTemplate(context, req.files.length);
        log(`   ℹ️ To get AI-powered screen-specific analysis, configure your Claude API key in Settings.`);
      } else {
        // ── AI-powered: analyze actual screen content ─────────────────────
        let allImages = [];

        if (imageFiles.length > 0) {
          log(`🖼️ Processing ${imageFiles.length} screenshot(s)...`);
          allImages = imageFiles.map(f => imageToBase64(f.path));
          log(`   Converted ${allImages.length} image(s) to base64`);
        }

        if (videoFiles.length > 0) {
          log(`🎥 Processing ${videoFiles.length} video file(s)...`);
          for (const vf of videoFiles) {
            log(`   Extracting frames from ${vf.originalname}...`);
            try {
              const frames = await extractVideoFrames(vf.path, 20);
              allImages.push(...frames);
              log(`   Extracted ${frames.length} frames from ${vf.originalname}`);
            } catch (err) {
              log(`   ⚠️ ${err.message}`);
            }
          }
        }

        if (allImages.length === 0) {
          log(`   ⚠️ No images could be processed — falling back to template-based generation`);
          analysis = exploratoryFallback.generateTemplate(context, req.files.length);
        } else {
          if (allImages.length > 20) {
            log(`   Capping at 20 images (had ${allImages.length})`);
            allImages = allImages.slice(0, 20);
          }

          log(`🧠 Sending ${allImages.length} image(s) to AI for exploratory test analysis...`);
          log(`   Context — App: ${context.appName || 'N/A'} | URL: ${context.appUrl || 'N/A'} | Domain: ${context.domain || 'Auto-detect'}`);

          try {
            analysis = videoFiles.length > 0
              ? await exploratoryTestAgent.analyzeVideoFrames(allImages, context)
              : await exploratoryTestAgent.analyzeScreenshots(allImages, context);
          } catch (aiErr) {
            log(`   ⚠️ AI analysis failed (${aiErr.message}) — falling back to template-based generation`);
            analysis = exploratoryFallback.generateTemplate(context, req.files.length);
          }
        }
      }

      const tcCount = (analysis.testCases || []).length;
      const charterCount = (analysis.exploratoryCharters || []).length;
      const riskCount = (analysis.riskAreas || []).length;

      log(`✅ Analysis complete!`);
      log(`   📋 Test Cases: ${tcCount} | Charters: ${charterCount} | Risk Areas: ${riskCount}`);
      log(`   🏷️ Page Type: ${analysis.screenAnalysis?.pageType || 'Unknown'} | Domain: ${analysis.screenAnalysis?.domain || 'Unknown'}`);

      session.status = 'done';
      session.results = analysis;

    } catch (err) {
      console.error('Exploratory analysis error:', err);
      session.status = 'error';
      session.error = err.message;
      session.logs.push(`[ERROR] ${err.message}`);
    } finally {
      // Cleanup uploaded files
      for (const f of req.files) {
        try { fs.unlinkSync(f.path); } catch {}
      }
    }
  })();
});

// ── POST /api/exploratory/sessions/:id/cancel — abort an in-flight session ─
router.post('/exploratory/sessions/:id/cancel', (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  if (session.status !== 'processing') {
    return res.status(400).json({ error: `Session is ${session.status}` });
  }
  session.status = 'cancelled';
  session.logs.push(`[${new Date().toISOString()}] 🛑 Cancellation requested by user`);
  // Note: the in-flight Claude API call can't be physically cancelled, but the
  // session status change will stop the frontend polling and the UI will show
  // "cancelled" immediately. When the API call eventually returns, the result
  // will be discarded because status !== 'processing'.
  res.json({ ok: true });
});

// ── GET /api/exploratory/status/:sessionId — Poll for status ─────────────────
router.get('/exploratory/status/:sessionId', (req, res) => {
  const session = sessions.get(req.params.sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  res.json({
    sessionId: session.sessionId,
    status: session.status,
    logs: session.logs,
    results: session.results,
    error: session.error,
  });
});

// ── POST /api/exploratory/export/:sessionId — Export test cases as JSON ───────
router.get('/exploratory/export/:sessionId', (req, res) => {
  const session = sessions.get(req.params.sessionId);
  if (!session || !session.results) {
    return res.status(404).json({ error: 'No results to export' });
  }

  const exportData = {
    generatedAt: new Date().toISOString(),
    screenAnalysis: session.results.screenAnalysis,
    testCases: session.results.testCases,
    exploratoryCharters: session.results.exploratoryCharters,
    riskAreas: session.results.riskAreas,
    summary: session.results.summary,
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=exploratory-tests-${session.sessionId.slice(0, 8)}.json`);
  res.send(JSON.stringify(exportData, null, 2));
});

module.exports = router;
