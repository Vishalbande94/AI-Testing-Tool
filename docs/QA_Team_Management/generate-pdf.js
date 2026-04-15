const fs = require('fs');
const path = require('path');

// Read the markdown file and convert to styled HTML, then use Playwright to generate PDF
async function generatePDF() {
  const mdContent = fs.readFileSync(path.join(__dirname, 'InsureAI_QA_Complete_Report.md'), 'utf8');

  // Convert markdown to HTML with InsureAI theme
  const htmlContent = convertToThemedHTML(mdContent);

  // Use Playwright to generate PDF
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle' });

  const pdfPath = path.join(__dirname, 'InsureAI_QA_Complete_Report.pdf');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="font-size:8px; color:#6c757d; width:100%; text-align:center; padding:5px 20px;">
        <span style="color:#0d47a1; font-weight:bold;">InsureAI</span> — QA Complete Lifecycle Report v1.0
      </div>`,
    footerTemplate: `
      <div style="font-size:8px; color:#6c757d; width:100%; display:flex; justify-content:space-between; padding:5px 20px;">
        <span>Confidential — For Internal QA Use Only</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>`,
  });

  await browser.close();
  console.log(`✓ PDF generated: ${pdfPath}`);
}

function convertToThemedHTML(md) {
  // Process line by line
  let lines = md.split('\n');
  let html = '';
  let inTable = false;
  let inCodeBlock = false;
  let tableRows = [];
  let isFirstTableRow = true;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Skip HTML comments
    if (line.trim().startsWith('<!--') || line.trim().startsWith('-->') || line.trim().startsWith('*')) {
      if (line.trim().startsWith('<!--')) {
        while (i < lines.length && !lines[i].includes('-->')) i++;
        continue;
      }
      if (line.trim().startsWith('*')) continue;
    }

    // Code blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        html += '</pre>';
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        html += '<pre style="background:#1a1a2e; color:#e0e0e0; padding:15px; border-radius:8px; font-size:11px; overflow-x:auto; page-break-inside:avoid; margin:10px 0;">';
      }
      continue;
    }
    if (inCodeBlock) {
      html += escapeHtml(line) + '\n';
      continue;
    }

    // Table handling
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
        isFirstTableRow = true;
      }
      // Skip separator rows
      if (line.replace(/[\|\-\s:]/g, '') === '') continue;
      tableRows.push(line);
      continue;
    } else if (inTable) {
      html += renderTable(tableRows);
      inTable = false;
      tableRows = [];
    }

    // Headings
    if (line.startsWith('# ══') || line.startsWith('# ██')) {
      // Section divider — skip decorative lines
      continue;
    }

    if (line.startsWith('# TABLE OF CONTENTS')) {
      html += '<h1 style="color:#0d47a1; border-bottom:3px solid #0d47a1; padding-bottom:8px; font-family:Segoe UI; margin-top:40px;">TABLE OF CONTENTS</h1>';
      continue;
    }

    if (line.startsWith('# SECTION') || line.startsWith('# ')) {
      const text = line.replace(/^#+\s*/, '');
      html += `<h1 style="color:#0d47a1; border-bottom:3px solid #0d47a1; padding-bottom:8px; font-family:Segoe UI; margin-top:40px; page-break-before:always;">${escapeHtml(text)}</h1>`;
      continue;
    }

    if (line.startsWith('## ┌') || line.startsWith('## └') || line.startsWith('## │')) {
      const text = line.replace(/[┌┐└┘│─]/g, '').replace(/^##\s*/, '').trim();
      if (text) {
        html += `<div style="background:#e3f2fd; color:#0d47a1; padding:10px 15px; border-radius:8px; font-weight:bold; font-size:16px; margin:15px 0; font-family:Segoe UI;">${escapeHtml(text)}</div>`;
      }
      continue;
    }

    if (line.startsWith('### ')) {
      const text = line.replace(/^###\s*/, '');
      html += `<h3 style="color:#0d47a1; font-family:Segoe UI; margin-top:20px; font-size:15px;">${formatInlineStyles(text)}</h3>`;
      continue;
    }

    if (line.startsWith('## ')) {
      const text = line.replace(/^##\s*/, '');
      html += `<h2 style="color:#1976d2; font-family:Segoe UI; margin-top:25px; font-size:18px;">${formatInlineStyles(text)}</h2>`;
      continue;
    }

    // Horizontal rule
    if (line.trim() === '---') {
      html += '<hr style="border:1px solid #dee2e6; margin:20px 0;">';
      continue;
    }

    // Blockquote
    if (line.startsWith('>')) {
      const text = line.replace(/^>\s*/, '');
      html += `<blockquote style="border-left:4px solid #1976d2; padding:8px 15px; background:#f0f4ff; margin:10px 0; font-size:13px;">${formatInlineStyles(text)}</blockquote>`;
      continue;
    }

    // List items
    if (line.match(/^[-•]\s/)) {
      const text = line.replace(/^[-•]\s*/, '');
      html += `<div style="padding:2px 0 2px 20px; font-size:13px; font-family:Segoe UI;">• ${formatInlineStyles(text)}</div>`;
      continue;
    }

    // Numbered lists
    if (line.match(/^\d+\.\s/)) {
      html += `<div style="padding:2px 0 2px 20px; font-size:13px; font-family:Segoe UI;">${formatInlineStyles(line)}</div>`;
      continue;
    }

    // Regular paragraphs
    if (line.trim()) {
      html += `<p style="font-size:13px; font-family:Segoe UI; margin:5px 0; line-height:1.6;">${formatInlineStyles(line)}</p>`;
    }
  }

  // Flush remaining table
  if (inTable) {
    html += renderTable(tableRows);
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: A4; margin: 20mm 15mm; }
    body { font-family: 'Segoe UI', sans-serif; color: #1a1a2e; line-height: 1.5; font-size: 13px; }
    table { border-collapse: collapse; width: 100%; margin: 10px 0; page-break-inside: auto; }
    tr { page-break-inside: avoid; }
    th { background: #0d47a1; color: white; padding: 8px 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; }
    td { padding: 6px 10px; border-bottom: 1px solid #dee2e6; font-size: 12px; }
    tr:nth-child(even) { background: #f0f4ff; }
    .cover-page { text-align: center; page-break-after: always; padding-top: 150px; }
    .pass { color: #2e7d32; font-weight: bold; }
    .fail { color: #c62828; font-weight: bold; }
    .warn { color: #f57f17; font-weight: bold; }
  </style>
</head>
<body>
  <!-- COVER PAGE -->
  <div class="cover-page">
    <div style="margin-bottom:30px;">
      <span style="font-size:56px; font-weight:bold; color:#0d47a1;">Insure</span><span style="font-size:56px; font-weight:bold; color:#ff6f00;">AI</span>
    </div>
    <div style="font-size:18px; color:#6c757d; margin-bottom:40px;">General Insurance Web Portal</div>
    <div style="border-top:3px solid #0d47a1; border-bottom:3px solid #0d47a1; padding:20px; display:inline-block; margin:30px 0;">
      <div style="font-size:32px; font-weight:bold; color:#0d47a1;">COMPLETE QA LIFECYCLE REPORT</div>
    </div>
    <div style="margin-top:50px; font-size:16px; color:#1a1a2e;">
      <div>Version: 1.0</div>
      <div>Date: 24-Mar-2026</div>
      <div>Prepared By: QA Team Lead</div>
      <div style="color:#1976d2; margin-top:10px;">URL: http://localhost:3000</div>
    </div>
    <div style="margin-top:80px; background:#e3f2fd; padding:10px; display:inline-block; border-radius:4px;">
      <span style="color:#0d47a1; font-weight:bold; font-size:12px;">CONFIDENTIAL — FOR INTERNAL QA USE ONLY</span>
    </div>
  </div>

  <!-- REPORT CONTENT -->
  ${html}
</body>
</html>`;
}

function renderTable(rows) {
  if (rows.length === 0) return '';
  let html = '<table>';

  // First row is header
  const headerCells = rows[0].split('|').filter(c => c.trim());
  html += '<thead><tr>';
  headerCells.forEach(c => {
    html += `<th>${formatInlineStyles(c.trim())}</th>`;
  });
  html += '</tr></thead><tbody>';

  // Data rows
  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i].split('|').filter(c => c.trim());
    html += '<tr>';
    cells.forEach(c => {
      const text = c.trim();
      let cls = '';
      if (text.includes('PASS') || text.includes('✓') || text.includes('FIXED') || text.includes('GOOD') || text === '✓ Met') cls = 'pass';
      else if (text.includes('FAIL') || text.includes('✗') || text.includes('OPEN')) cls = 'fail';
      else if (text.includes('⚠') || text.includes('BLOCKED') || text.includes('Gap')) cls = 'warn';
      html += `<td class="${cls}">${formatInlineStyles(text)}</td>`;
    });
    html += '</tr>';
  }
  html += '</tbody></table>';
  return html;
}

function formatInlineStyles(text) {
  // Bold
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Inline code
  text = text.replace(/`(.*?)`/g, '<code style="background:#f4f6fb; padding:2px 5px; border-radius:3px; font-size:11px;">$1</code>');
  // Stars
  text = text.replace(/★/g, '<span style="color:#ff6f00;">★</span>');
  return text;
}

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

generatePDF().catch(err => { console.error('Error:', err); process.exit(1); });
