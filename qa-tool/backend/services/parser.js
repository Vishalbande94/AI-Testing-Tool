// ── Requirement Document Parser ───────────────────────────────────────────────
// Supports: .txt, .md, .pdf
const fs   = require('fs');
const path = require('path');

/**
 * Extract plain text from a requirement document.
 * @param {string} filePath - Absolute path to uploaded file
 * @returns {Promise<string>} Extracted text content
 */
async function extractText(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case '.txt':
    case '.md':
      return readTextFile(filePath);

    case '.pdf':
      return readPdfFile(filePath);

    default:
      throw new Error(`Unsupported file type: ${ext}. Use .pdf, .txt, or .md`);
  }
}

// ── Plain text / Markdown ─────────────────────────────────────────────────────
function readTextFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  return cleanText(content);
}

// ── PDF parsing ───────────────────────────────────────────────────────────────
async function readPdfFile(filePath) {
  try {
    const pdfParse = require('pdf-parse');
    const buffer   = fs.readFileSync(filePath);
    const data     = await pdfParse(buffer);
    return cleanText(data.text);
  } catch (err) {
    throw new Error(`PDF parsing failed: ${err.message}. Try uploading a .txt version.`);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function cleanText(text) {
  return text
    .replace(/\r\n/g, '\n')        // Normalize line endings
    .replace(/\t/g, ' ')           // Tabs → spaces
    .replace(/[ ]{2,}/g, ' ')      // Multiple spaces → single
    .replace(/\n{3,}/g, '\n\n')    // Triple+ newlines → double
    .trim();
}

module.exports = { extractText };
