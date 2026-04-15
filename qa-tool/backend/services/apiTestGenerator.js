// ── API Test Suite Generator ─────────────────────────────────────────────────
// Produces a complete, ready-to-run API test project in the selected tool.
// Works for any HTTP API. User supplies baseUrl + optional endpoint list.
const fs      = require('fs');
const path    = require('path');
const archiver = require('archiver');

/**
 * @param {object} params
 * @param {string} params.baseUrl
 * @param {string} params.tool       - postman | restassured | playwright | k6 | supertest
 * @param {Array}  params.endpoints  - optional [{ method, path, auth, body, expectedStatus }]
 * @param {string} params.authType   - none | bearer | basic | apiKey
 * @param {string} params.outputDir
 */
async function generate({ baseUrl, tool = 'postman', endpoints, authType = 'bearer', options = {}, outputDir }) {
  fs.mkdirSync(outputDir, { recursive: true });

  const eps = (endpoints && endpoints.length) ? endpoints : defaultEndpoints();

  const generators = {
    postman:     () => genPostman(baseUrl, eps, authType, options),
    restassured: () => genRestAssured(baseUrl, eps, authType, options),
    playwright:  () => genPlaywrightApi(baseUrl, eps, authType, options),
    k6:          () => genK6(baseUrl, eps, authType, options),
    supertest:   () => genSupertest(baseUrl, eps, authType, options),
  };
  const files = (generators[tool] || generators.postman)();

  const projectName = `api-test-suite-${tool}`;
  const projectDir = path.join(outputDir, projectName);
  fs.mkdirSync(projectDir, { recursive: true });

  for (const [p, content] of Object.entries(files)) {
    const full = path.join(projectDir, p);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, 'utf-8');
  }

  const zipPath = path.join(outputDir, `${projectName}.zip`);
  await createZip(projectDir, zipPath);
  return { zipPath, projectName, fileCount: Object.keys(files).length, tool };
}

function defaultEndpoints() {
  return [
    { method: 'GET',    path: '/users',       auth: true,  expectedStatus: 200 },
    { method: 'GET',    path: '/users/1',     auth: true,  expectedStatus: 200 },
    { method: 'POST',   path: '/users',       auth: true,  expectedStatus: 201, body: { name: 'Test User', email: 'test@example.com' } },
    { method: 'PUT',    path: '/users/1',     auth: true,  expectedStatus: 200, body: { name: 'Updated' } },
    { method: 'DELETE', path: '/users/1',     auth: true,  expectedStatus: 204 },
    { method: 'GET',    path: '/health',      auth: false, expectedStatus: 200 },
    { method: 'POST',   path: '/login',       auth: false, expectedStatus: 200, body: { email: 'user@test.com', password: 'Test@1234' } },
  ];
}

// ── Postman Collection (JSON v2.1) ──────────────────────────────────────────
function genPostman(baseUrl, eps, auth) {
  const items = eps.flatMap(e => {
    const url = { raw: `${baseUrl}${e.path}`, host: [baseUrl.replace(/https?:\/\//, '').split('/')[0]], path: e.path.split('/').filter(Boolean) };
    const base = {
      name: `${e.method} ${e.path}`,
      request: {
        method: e.method,
        header: e.auth ? [{ key: 'Authorization', value: '{{authToken}}' }] : [],
        body: e.body ? { mode: 'raw', raw: JSON.stringify(e.body, null, 2), options: { raw: { language: 'json' } } } : undefined,
        url,
      },
      event: [{
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: [
            `pm.test("Status is ${e.expectedStatus}", () => pm.response.to.have.status(${e.expectedStatus}));`,
            `pm.test("Response < 1s", () => pm.expect(pm.response.responseTime).to.be.below(1000));`,
            `pm.test("Content-Type is JSON", () => pm.expect(pm.response.headers.get("Content-Type") || "").to.include("application/json"));`,
          ],
        },
      }],
    };
    // Positive + a paired negative (auth absent / invalid body)
    const neg = e.auth ? {
      name: `[NEG] ${e.method} ${e.path} — missing auth`,
      request: { ...base.request, header: [] },
      event: [{ listen: 'test', script: { type: 'text/javascript', exec: [
        `pm.test("Unauthorized", () => pm.expect([401, 403]).to.include(pm.response.code));`,
      ]}}],
    } : null;
    return neg ? [base, neg] : [base];
  });

  const collection = {
    info: {
      name: 'Auto-generated API Suite',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    variable: [
      { key: 'baseUrl',   value: baseUrl },
      { key: 'authToken', value: 'Bearer REPLACE_ME' },
    ],
    item: items,
  };

  return {
    'collection.json':  JSON.stringify(collection, null, 2),
    'environment.json': JSON.stringify({
      name: 'Default',
      values: [
        { key: 'baseUrl', value: baseUrl, enabled: true },
        { key: 'authToken', value: 'Bearer REPLACE_ME', enabled: true },
      ],
    }, null, 2),
    'README.md': postmanReadme(baseUrl),
  };
}

function postmanReadme(baseUrl) {
  return `# Postman API Test Suite

Target: **${baseUrl}**

## Prerequisites
- Postman (desktop or CLI \`newman\`): \`npm install -g newman newman-reporter-htmlextra\`

## Run in Postman
1. Import \`collection.json\` and \`environment.json\`
2. Set \`authToken\` to your actual bearer token
3. Click **Run collection**

## Run via CLI
\`\`\`bash
newman run collection.json -e environment.json \\
  -r cli,htmlextra \\
  --reporter-htmlextra-export ./report.html
\`\`\`
`;
}

// ── REST Assured (Java + Maven + TestNG) ─────────────────────────────────────
function genRestAssured(baseUrl, eps, auth) {
  const pom = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.qa</groupId>
  <artifactId>api-test-suite</artifactId>
  <version>1.0.0</version>
  <properties><maven.compiler.source>17</maven.compiler.source><maven.compiler.target>17</maven.compiler.target></properties>
  <dependencies>
    <dependency><groupId>io.rest-assured</groupId><artifactId>rest-assured</artifactId><version>5.5.0</version><scope>test</scope></dependency>
    <dependency><groupId>org.testng</groupId><artifactId>testng</artifactId><version>7.10.2</version><scope>test</scope></dependency>
    <dependency><groupId>org.hamcrest</groupId><artifactId>hamcrest</artifactId><version>3.0</version><scope>test</scope></dependency>
  </dependencies>
  <build><plugins>
    <plugin><artifactId>maven-surefire-plugin</artifactId><version>3.2.5</version></plugin>
  </plugins></build>
</project>
`;
  const tests = eps.map(e => {
    const m = e.method.toLowerCase();
    const body = e.body ? `\n      .body(${JSON.stringify(JSON.stringify(e.body))})` : '';
    const auth = e.auth ? `\n      .header("Authorization", System.getenv().getOrDefault("API_TOKEN", "Bearer REPLACE_ME"))` : '';
    const testName = `test_${e.method}_${e.path.replace(/[^a-zA-Z0-9]/g, '_')}`;
    return `
  @Test
  public void ${testName}() {
    given()
      .baseUri(BASE_URL)
      .contentType("application/json")${auth}${body}
    .when()
      .${m}("${e.path}")
    .then()
      .statusCode(${e.expectedStatus})
      .time(lessThan(3000L));
  }`;
  }).join('\n');

  return {
    'pom.xml': pom,
    'src/test/java/com/qa/ApiTests.java': `package com.qa;
import io.restassured.RestAssured;
import org.testng.annotations.Test;
import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;

public class ApiTests {
  static final String BASE_URL = System.getenv().getOrDefault("BASE_URL", "${baseUrl}");
${tests}
}
`,
    'testng.xml': `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE suite SYSTEM "https://testng.org/testng-1.0.dtd">
<suite name="API Suite" parallel="methods" thread-count="4">
  <test name="API"><classes><class name="com.qa.ApiTests"/></classes></test>
</suite>
`,
    'README.md': `# REST Assured API Suite

Target: **${baseUrl}**

## Prerequisites
- Java 17+
- Maven 3.9+

## Run
\`\`\`bash
export API_TOKEN="Bearer your-token-here"
export BASE_URL="${baseUrl}"
mvn test
\`\`\`

Override base URL or token via environment variables. Reports: \`target/surefire-reports/\`.
`,
  };
}

// ── Playwright API (JS or TS) ───────────────────────────────────────────────
function genPlaywrightApi(baseUrl, eps, auth, opts = {}) {
  const workers  = Math.max(1, Math.min(20, Number(opts.workers) || 3));
  const retries  = Math.max(0, Math.min(5, Number(opts.retries) || 1));
  const timeout  = Math.max(5000, Number(opts.timeout) || 30000);
  const reporter = ['html', 'list', 'json', 'junit'].includes(opts.reporter) ? opts.reporter : 'html';
  const isTS     = !!opts.typescript;
  const ext      = isTS ? 'ts' : 'js';

  const tests = eps.map((e, i) => {
    const body = e.body ? `, { data: ${JSON.stringify(e.body, null, 2).split('\n').join('\n    ')} }` : '';
    return `
  test('${e.method} ${e.path} → ${e.expectedStatus}', async ({ request }) => {
    const response = await request.${e.method.toLowerCase()}('${e.path}'${body});
    expect(response.status()).toBe(${e.expectedStatus});
    expect(response.headers()['content-type'] || '').toMatch(/json/i);
  });`;
  }).join('\n');

  const reporterLine = reporter === 'html' ? `[['html', { open: 'never' }], ['list']]`
                     : reporter === 'json' ? `[['json', { outputFile: 'results.json' }], ['list']]`
                     : reporter === 'junit' ? `[['junit', { outputFile: 'results.xml' }], ['list']]`
                     : `'list'`;

  const files = {
    'package.json': JSON.stringify({
      name: 'api-test-suite-playwright', version: '1.0.0',
      scripts: { test: 'npx playwright test', report: 'npx playwright show-report' },
      devDependencies: {
        '@playwright/test': '^1.55.0',
        ...(isTS && { typescript: '^5.3.0', '@types/node': '^20.0.0' }),
      },
    }, null, 2),
    [`playwright.config.${ext}`]: `${isTS ? "import { defineConfig } from '@playwright/test';" : "import { defineConfig } from '@playwright/test';"}
export default defineConfig({
  testDir: './tests',
  timeout: ${timeout},
  retries: ${retries},
  workers: ${workers},
  reporter: ${reporterLine},
  use: {
    baseURL: process.env.BASE_URL || '${baseUrl}',
    extraHTTPHeaders: {
      'Accept': 'application/json',
      ...(process.env.API_TOKEN ? { 'Authorization': process.env.API_TOKEN } : {}),
    },
  },
});
`,
    [`tests/api.spec.${ext}`]: `import { test, expect } from '@playwright/test';
test.describe('API tests', () => {${tests}
});
`,
    'README.md': `# Playwright API Test Suite

Target: **${baseUrl}**

## Configuration (applied)
- Language: **${isTS ? 'TypeScript' : 'JavaScript'}**
- Workers: **${workers}**
- Retries: **${retries}**
- Timeout: **${timeout}ms**
- Reporter: **${reporter}**

## Prerequisites
- Node.js 18+

## Run
\`\`\`bash
npm install
${isTS ? 'npx playwright install\n' : ''}export API_TOKEN="Bearer your-token-here"
export BASE_URL="${baseUrl}"
npm test
${reporter === 'html' ? 'npm run report' : ''}
\`\`\`
`,
  };
  return files;
}

// ── k6 (load + smoke via scenarios) ─────────────────────────────────────────
function genK6(baseUrl, eps, auth) {
  const checks = eps.map(e => `
  {
    const res = http.${e.method.toLowerCase()}(\`\${BASE_URL}${e.path}\`${e.body ? `, JSON.stringify(${JSON.stringify(e.body)})` : ''}, { headers: HEADERS });
    check(res, {
      '${e.method} ${e.path} status ${e.expectedStatus}': (r) => r.status === ${e.expectedStatus},
      '${e.method} ${e.path} duration < 1s':       (r) => r.timings.duration < 1000,
    });
  }`).join('');

  return {
    'smoke.js': `import http from 'k6/http';
import { check, sleep } from 'k6';
export const options = {
  vus: 1,
  duration: '30s',
  thresholds: {
    http_req_failed:   ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
  },
};
const BASE_URL = __ENV.BASE_URL || '${baseUrl}';
const HEADERS  = { 'Content-Type': 'application/json', ...(__ENV.API_TOKEN && { 'Authorization': __ENV.API_TOKEN }) };
export default function () {${checks}
  sleep(1);
}
`,
    'load.js': `import http from 'k6/http';
import { check } from 'k6';
export const options = {
  stages: [
    { duration: '30s', target: 20  },
    { duration: '1m',  target: 50  },
    { duration: '30s', target: 0   },
  ],
  thresholds: { http_req_duration: ['p(95)<2000'] },
};
const BASE_URL = __ENV.BASE_URL || '${baseUrl}';
export default function () {
  const res = http.get(\`\${BASE_URL}/health\`);
  check(res, { 'status 200': r => r.status === 200 });
}
`,
    'README.md': `# k6 API Test Suite

Target: **${baseUrl}**

## Prerequisites
- k6 installed: https://k6.io/docs/get-started/installation/

## Run
\`\`\`bash
# Smoke (functional)
BASE_URL="${baseUrl}" API_TOKEN="Bearer xyz" k6 run smoke.js

# Load (perf)
k6 run load.js
\`\`\`
`,
  };
}

// ── Supertest (Node JS + Mocha) ─────────────────────────────────────────────
function genSupertest(baseUrl, eps, auth) {
  const tests = eps.map(e => `
  it('${e.method} ${e.path} responds ${e.expectedStatus}', async () => {
    const res = await request
      .${e.method.toLowerCase()}('${e.path}')${e.auth ? `\n      .set('Authorization', TOKEN)` : ''}${e.body ? `\n      .send(${JSON.stringify(e.body)})` : ''};
    expect(res.status).to.equal(${e.expectedStatus});
  });`).join('');

  return {
    'package.json': JSON.stringify({
      name: 'api-test-suite-supertest', version: '1.0.0',
      scripts: { test: 'mocha --timeout 30000' },
      devDependencies: { mocha: '^10.4.0', chai: '^4.4.1', supertest: '^7.0.0' },
    }, null, 2),
    'test/api.test.js': `const supertest = require('supertest');
const { expect } = require('chai');
const BASE = process.env.BASE_URL || '${baseUrl}';
const TOKEN = process.env.API_TOKEN || 'Bearer REPLACE_ME';
const request = supertest(BASE);

describe('API tests', () => {${tests}
});
`,
    'README.md': `# Supertest API Suite

## Run
\`\`\`bash
npm install
BASE_URL="${baseUrl}" API_TOKEN="Bearer xyz" npm test
\`\`\`
`,
  };
}

// ── ZIP helper ──────────────────────────────────────────────────────────────
function createZip(srcDir, outPath) {
  return new Promise((resolve, reject) => {
    const out = fs.createWriteStream(outPath);
    const zip = archiver('zip', { zlib: { level: 9 } });
    out.on('close', resolve);
    zip.on('error', reject);
    zip.pipe(out);
    zip.directory(srcDir, false);
    zip.finalize();
  });
}

module.exports = { generate };
