// ── Performance Test Suite Generator ─────────────────────────────────────────
// Produces a ready-to-run load-testing project for the chosen tool.
// Works for any HTTP(S) app.
const fs       = require('fs');
const path     = require('path');
const archiver = require('archiver');

/**
 * @param {object} params
 * @param {string} params.targetUrl
 * @param {string} params.tool       - jmeter | k6 | artillery | gatling
 * @param {string} params.scenario   - smoke | load | stress | spike | soak
 * @param {number} params.users      - peak virtual users (default by scenario)
 * @param {string} params.outputDir
 */
async function generate({ targetUrl, tool = 'k6', scenario = 'load', users, outputDir }) {
  fs.mkdirSync(outputDir, { recursive: true });

  const profile = loadProfile(scenario, users);

  const generators = {
    k6:        () => genK6(targetUrl, profile),
    jmeter:    () => genJMeter(targetUrl, profile),
    artillery: () => genArtillery(targetUrl, profile),
    gatling:   () => genGatling(targetUrl, profile),
  };
  const files = (generators[tool] || generators.k6)();

  const projectName = `performance-test-suite-${tool}-${scenario}`;
  const projectDir = path.join(outputDir, projectName);
  fs.mkdirSync(projectDir, { recursive: true });

  for (const [p, content] of Object.entries(files)) {
    const full = path.join(projectDir, p);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, 'utf-8');
  }

  const zipPath = path.join(outputDir, `${projectName}.zip`);
  await createZip(projectDir, zipPath);
  return { zipPath, projectName, fileCount: Object.keys(files).length, tool, scenario };
}

function loadProfile(scenario, users) {
  const profiles = {
    smoke:  { vus: users || 1,    durationSec: 60,   rampSec: 10, description: 'Smoke — 1 VU / 1 min. Verifies the test script runs clean.' },
    load:   { vus: users || 50,   durationSec: 300,  rampSec: 60, description: 'Load — 50 VUs / 5 min. Validates normal working capacity.' },
    stress: { vus: users || 200,  durationSec: 600,  rampSec: 120, description: 'Stress — 200 VUs / 10 min. Finds the breaking point.' },
    spike:  { vus: users || 500,  durationSec: 180,  rampSec: 10,  description: 'Spike — 500 VUs / 3 min with 10s ramp. Tests sudden surge.' },
    soak:   { vus: users || 30,   durationSec: 3600, rampSec: 120, description: 'Soak — 30 VUs / 1 hour. Reveals memory leaks / resource exhaustion.' },
  };
  return { scenario, ...(profiles[scenario] || profiles.load) };
}

// ── k6 ──────────────────────────────────────────────────────────────────────
function genK6(targetUrl, p) {
  return {
    'load-test.js': `import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

// Scenario: ${p.scenario} — ${p.description}
const failRate = new Rate('failed_requests');
const apiLatency = new Trend('api_latency', true);

export const options = {
  stages: [
    { duration: '${p.rampSec}s', target: ${p.vus} },
    { duration: '${Math.max(p.durationSec - 2 * p.rampSec, 30)}s', target: ${p.vus} },
    { duration: '${p.rampSec}s', target: 0 },
  ],
  thresholds: {
    http_req_failed:   ['rate<0.01'],     // < 1% failures
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],
    failed_requests:   ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || '${targetUrl}';

export default function () {
  const res = http.get(\`\${BASE_URL}/\`);
  apiLatency.add(res.timings.duration);
  failRate.add(res.status !== 200 && res.status !== 301 && res.status !== 302);
  check(res, {
    'status is 2xx/3xx': (r) => r.status >= 200 && r.status < 400,
    'response body present': (r) => r.body && r.body.length > 0,
  });
  sleep(Math.random() * 2 + 0.5);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data),
    'summary.json': JSON.stringify(data, null, 2),
    'summary.html': htmlReport(data),
  };
}
function textSummary(data) {
  const m = data.metrics;
  return \`
─────────────────────────────────────────
  Performance Test Summary — ${p.scenario}
─────────────────────────────────────────
  VUs peak:             ${p.vus}
  Duration:             ${p.durationSec}s
  Total requests:       \${m.http_reqs?.values?.count ?? 0}
  Req/s:                \${(m.http_reqs?.values?.rate ?? 0).toFixed(1)}
  p95 latency:          \${(m.http_req_duration?.values?.['p(95)'] ?? 0).toFixed(0)}ms
  p99 latency:          \${(m.http_req_duration?.values?.['p(99)'] ?? 0).toFixed(0)}ms
  Failure rate:         \${((m.http_req_failed?.values?.rate ?? 0) * 100).toFixed(2)}%
─────────────────────────────────────────\`;
}
function htmlReport(data) {
  return \`<html><body><pre>\${textSummary(data)}</pre></body></html>\`;
}
`,
    'README.md': `# k6 Performance Test — ${p.scenario}

Target: **${targetUrl}**
Profile: **${p.description}**

## Prerequisites
- k6 — https://k6.io/docs/get-started/installation/

## Run
\`\`\`bash
BASE_URL="${targetUrl}" k6 run load-test.js
\`\`\`

### Output
- \`summary.json\` — machine-readable metrics
- \`summary.html\` — rendered summary
- Console — live metrics during run

### Thresholds (auto-fail CI)
- p95 latency < 2000ms
- p99 latency < 5000ms
- Failure rate < 1%

### Tuning
Override virtual-user count:
\`\`\`bash
k6 run --vus 100 --duration 10m load-test.js
\`\`\`

### Scenario Guide
| Scenario | Use When |
|----------|----------|
| smoke    | Sanity-check the script before heavier runs |
| load     | Validate normal working capacity (SLA) |
| stress   | Find the breaking point |
| spike    | Test flash-traffic resilience |
| soak     | Detect memory leaks over long runs |
`,
  };
}

// ── JMeter ──────────────────────────────────────────────────────────────────
function genJMeter(targetUrl, p) {
  // Parse URL for JMeter
  const u = new URL(targetUrl);
  const protocol = u.protocol.replace(':', '');
  const host     = u.hostname;
  const port     = u.port || (protocol === 'https' ? '443' : '80');

  const jmx = `<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2" properties="5.0" jmeter="5.6.3">
  <hashTree>
    <TestPlan guiclass="TestPlanGui" testclass="TestPlan" testname="Performance — ${p.scenario}">
      <stringProp name="TestPlan.comments">${p.description}</stringProp>
      <boolProp name="TestPlan.functional_mode">false</boolProp>
      <boolProp name="TestPlan.serialize_threadgroups">false</boolProp>
      <elementProp name="TestPlan.user_defined_variables" elementType="Arguments" guiclass="ArgumentsPanel" testclass="Arguments" testname="User Defined Variables">
        <collectionProp name="Arguments.arguments"/>
      </elementProp>
    </TestPlan>
    <hashTree>
      <ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="${p.scenario} — ${p.vus} users">
        <stringProp name="ThreadGroup.num_threads">${p.vus}</stringProp>
        <stringProp name="ThreadGroup.ramp_time">${p.rampSec}</stringProp>
        <stringProp name="ThreadGroup.duration">${p.durationSec}</stringProp>
        <boolProp name="ThreadGroup.scheduler">true</boolProp>
        <stringProp name="ThreadGroup.on_sample_error">continue</stringProp>
        <elementProp name="ThreadGroup.main_controller" elementType="LoopController" guiclass="LoopControlPanel" testclass="LoopController">
          <boolProp name="LoopController.continue_forever">true</boolProp>
          <intProp name="LoopController.loops">-1</intProp>
        </elementProp>
      </ThreadGroup>
      <hashTree>
        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="GET /">
          <stringProp name="HTTPSampler.protocol">${protocol}</stringProp>
          <stringProp name="HTTPSampler.domain">${host}</stringProp>
          <stringProp name="HTTPSampler.port">${port}</stringProp>
          <stringProp name="HTTPSampler.path">/</stringProp>
          <stringProp name="HTTPSampler.method">GET</stringProp>
          <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
          <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
        </HTTPSamplerProxy>
        <hashTree>
          <ResponseAssertion guiclass="AssertionGui" testclass="ResponseAssertion" testname="Status 200">
            <collectionProp name="Asserion.test_strings">
              <stringProp name="49586">200</stringProp>
            </collectionProp>
            <stringProp name="Assertion.test_field">Assertion.response_code</stringProp>
            <intProp name="Assertion.test_type">8</intProp>
          </ResponseAssertion>
          <hashTree/>
          <DurationAssertion guiclass="DurationAssertionGui" testclass="DurationAssertion" testname="< 2000ms">
            <stringProp name="DurationAssertion.duration">2000</stringProp>
          </DurationAssertion>
          <hashTree/>
        </hashTree>
        <ResultCollector guiclass="SummaryReport" testclass="ResultCollector" testname="Summary Report" enabled="true"/>
        <hashTree/>
        <ResultCollector guiclass="ViewResultsFullVisualizer" testclass="ResultCollector" testname="View Results Tree" enabled="false"/>
        <hashTree/>
      </hashTree>
    </hashTree>
  </hashTree>
</jmeterTestPlan>
`;

  return {
    'test-plan.jmx': jmx,
    'run.sh': `#!/bin/bash
# JMeter CLI run — ${p.scenario}
set -e
mkdir -p ./results
rm -rf ./results/html
jmeter -n -t test-plan.jmx -l ./results/results.jtl -e -o ./results/html
`,
    'run.ps1': `# JMeter CLI run — ${p.scenario}
$ErrorActionPreference = "Stop"
New-Item -ItemType Directory -Force -Path ./results | Out-Null
if (Test-Path ./results/html) { Remove-Item -Recurse -Force ./results/html }
jmeter -n -t test-plan.jmx -l ./results/results.jtl -e -o ./results/html
`,
    'README.md': `# JMeter Performance Test — ${p.scenario}

Target: **${targetUrl}**
Profile: **${p.description}**

## Prerequisites
- JMeter 5.6+ installed; \`jmeter\` on PATH
  - Download: https://jmeter.apache.org/download_jmeter.cgi

## Run (CLI — recommended)
\`\`\`bash
bash run.sh           # Linux/macOS
./run.ps1             # Windows
\`\`\`

Open report: \`./results/html/index.html\`.

## Run (GUI — design only)
\`\`\`bash
jmeter -t test-plan.jmx
\`\`\`

## Plan structure
- Thread Group: **${p.vus}** users, ramp-up **${p.rampSec}s**, hold **${p.durationSec - 2 * p.rampSec}s**
- HTTP sampler: \`GET /\`
- Assertions: status 200, duration < 2000ms
- Listeners: Summary Report, View Results Tree (disabled by default for performance)
`,
  };
}

// ── Artillery ───────────────────────────────────────────────────────────────
function genArtillery(targetUrl, p) {
  return {
    'artillery.yml': `config:
  target: "${targetUrl}"
  phases:
    - duration: ${p.rampSec}
      arrivalRate: 1
      rampTo: ${Math.max(1, Math.floor(p.vus / 10))}
      name: "Warm-up"
    - duration: ${Math.max(p.durationSec - 2 * p.rampSec, 30)}
      arrivalRate: ${Math.max(1, Math.floor(p.vus / 10))}
      name: "${p.scenario}"
    - duration: ${p.rampSec}
      arrivalRate: ${Math.max(1, Math.floor(p.vus / 10))}
      rampTo: 1
      name: "Ramp-down"
  ensure:
    p95: 2000
    maxErrorRate: 1
  plugins:
    metrics-by-endpoint: {}

scenarios:
  - name: Homepage
    flow:
      - get:
          url: "/"
          expect:
            - statusCode: [200, 301, 302]
            - contentType: text/html
`,
    'run.sh': `#!/bin/bash
# Artillery run — ${p.scenario}
set -e
npx artillery run --output results.json artillery.yml
npx artillery report --output report.html results.json
`,
    'run.ps1': `# Artillery run — ${p.scenario}
$ErrorActionPreference = "Stop"
npx artillery run --output results.json artillery.yml
npx artillery report --output report.html results.json
`,
    'package.json': JSON.stringify({
      name: `artillery-perf-${p.scenario}`,
      version: '1.0.0',
      devDependencies: { artillery: '^2.0.0' },
    }, null, 2),
    'README.md': `# Artillery Performance Test — ${p.scenario}

Target: **${targetUrl}**
Profile: **${p.description}**

## Prerequisites
- Node.js 18+

## Run
\`\`\`bash
npm install
bash run.sh           # Linux/macOS
./run.ps1             # Windows
\`\`\`

Open \`report.html\` when done.
`,
  };
}

// ── Gatling (Scala) ─────────────────────────────────────────────────────────
function genGatling(targetUrl, p) {
  return {
    'src/test/scala/PerformanceSim.scala': `import io.gatling.core.Predef._
import io.gatling.http.Predef._
import scala.concurrent.duration._

class PerformanceSim extends Simulation {

  val httpProtocol = http
    .baseUrl("${targetUrl}")
    .acceptHeader("application/json, text/html")

  val scn = scenario("${p.scenario}")
    .exec(http("Homepage").get("/").check(status.in(200, 301, 302)))

  setUp(
    scn.inject(
      rampUsersPerSec(1).to(${Math.max(1, Math.floor(p.vus / 10))}).during(${p.rampSec}.seconds),
      constantUsersPerSec(${Math.max(1, Math.floor(p.vus / 10))}).during(${Math.max(p.durationSec - 2 * p.rampSec, 30)}.seconds),
      rampUsersPerSec(${Math.max(1, Math.floor(p.vus / 10))}).to(0).during(${p.rampSec}.seconds),
    )
  ).protocols(httpProtocol)
   .assertions(
     global.responseTime.percentile3.lt(2000),
     global.failedRequests.percent.lt(1),
   )
}
`,
    'build.sbt': `ThisBuild / scalaVersion := "2.13.14"
ThisBuild / version := "1.0.0"

enablePlugins(GatlingPlugin)
libraryDependencies ++= Seq(
  "io.gatling.highcharts" % "gatling-charts-highcharts" % "3.11.3" % Test,
  "io.gatling"            % "gatling-test-framework"    % "3.11.3" % Test,
)
`,
    'project/plugins.sbt': `addSbtPlugin("io.gatling" % "gatling-sbt" % "4.9.2")
`,
    'README.md': `# Gatling Performance Test — ${p.scenario}

Target: **${targetUrl}**
Profile: **${p.description}**

## Prerequisites
- JDK 17+, sbt 1.9+

## Run
\`\`\`bash
sbt Gatling/test
\`\`\`

Reports: \`target/gatling/\`.
`,
  };
}

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
