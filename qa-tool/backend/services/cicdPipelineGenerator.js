// ── CI/CD Pipeline Generator ────────────────────────────────────────────────
// Produces ready-to-run pipeline definitions for GitHub Actions, GitLab CI,
// Jenkins, Azure DevOps, or CircleCI.
const fs       = require('fs');
const path     = require('path');
const archiver = require('archiver');

async function generate({ platform = 'github', testStack = 'playwright', options = {}, outputDir }) {
  fs.mkdirSync(outputDir, { recursive: true });
  const generators = {
    github:   () => genGithub(testStack, options),
    gitlab:   () => genGitlab(testStack, options),
    jenkins:  () => genJenkins(testStack, options),
    azure:    () => genAzure(testStack, options),
    circleci: () => genCircleCi(testStack, options),
  };
  const files = (generators[platform] || generators.github)();
  const projectName = `cicd-pipeline-${platform}-${testStack}`;
  const projectDir = path.join(outputDir, projectName);
  fs.mkdirSync(projectDir, { recursive: true });
  for (const [p, content] of Object.entries(files)) {
    const full = path.join(projectDir, p);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, 'utf-8');
  }
  const zipPath = path.join(outputDir, `${projectName}.zip`);
  await createZip(projectDir, zipPath);
  return { zipPath, projectName, fileCount: Object.keys(files).length, platform, testStack };
}

// ── GitHub Actions ──────────────────────────────────────────────────────────
function genGithub(stack, opts) {
  const nodeSetup = `
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npx playwright install --with-deps`;

  const javaSetup = `
      - uses: actions/setup-java@v4
        with: { java-version: '17', distribution: 'temurin', cache: 'maven' }`;

  const testStep = {
    playwright: nodeSetup + `\n      - run: npx playwright test`,
    jest:       nodeSetup.split('playwright install')[0] + `\n      - run: npm test`,
    maven:      javaSetup + `\n      - run: mvn -B test`,
    pytest:     `\n      - uses: actions/setup-python@v5\n        with: { python-version: '3.11' }\n      - run: pip install -r requirements.txt\n      - run: pytest`,
    k6:         `\n      - uses: grafana/setup-k6-action@v1\n      - run: k6 run load-test.js`,
    jmeter:     `\n      - run: |\n          wget -q https://archive.apache.org/dist/jmeter/binaries/apache-jmeter-5.6.3.tgz -O jmeter.tgz\n          tar xzf jmeter.tgz\n          ./apache-jmeter-5.6.3/bin/jmeter -n -t test-plan.jmx -l results.jtl -e -o report/`,
  }[stack] || testStep.playwright;

  return {
    '.github/workflows/test.yml': `name: Tests
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 6 * * *'  # nightly

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
${testStep}
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results
          path: |
            playwright-report/
            test-results/
            report/
            results.jtl
`,
    '.github/workflows/nightly.yml': `name: Nightly Full Suite
on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM UTC
  workflow_dispatch:
jobs:
  full:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
${testStep}
      - name: Notify Slack on failure
        if: failure()
        uses: 8398a7/action-slack@v3
        with: { status: \${{ job.status }} }
        env:
          SLACK_WEBHOOK_URL: \${{ secrets.SLACK_WEBHOOK_URL }}
`,
    'README.md': `# GitHub Actions CI — ${stack}

Drop the \`.github/workflows/\` folder into the root of your repo.

## Triggers
- Push to \`main\` or \`develop\`
- Pull requests to \`main\`
- Nightly schedule (6 AM UTC)

## Slack notifications
Add \`SLACK_WEBHOOK_URL\` to repo secrets for nightly failure alerts.

## Quality gate (PR check)
GitHub will block merge if tests fail.
`,
  };
}

// ── GitLab CI ───────────────────────────────────────────────────────────────
function genGitlab(stack, opts) {
  const setupMap = {
    playwright: `  image: mcr.microsoft.com/playwright:v1.55.0-noble
  script:
    - npm ci
    - npx playwright test`,
    jest:       `  image: node:20
  script:
    - npm ci
    - npm test`,
    maven:      `  image: maven:3.9-eclipse-temurin-17
  script:
    - mvn -B test`,
    pytest:     `  image: python:3.11
  script:
    - pip install -r requirements.txt
    - pytest`,
    k6:         `  image: grafana/k6:latest
  script:
    - k6 run load-test.js`,
    jmeter:     `  image: justb4/jmeter:5.6
  script:
    - /entrypoint.sh -n -t test-plan.jmx -l results.jtl -e -o report/`,
  };

  return {
    '.gitlab-ci.yml': `stages:
  - test
  - report

test:
  stage: test
${setupMap[stack] || setupMap.playwright}
  artifacts:
    when: always
    paths:
      - playwright-report/
      - test-results/
      - report/
      - results.jtl
    reports:
      junit: test-results/junit.xml
    expire_in: 1 week

scheduled-full:
  extends: test
  only:
    - schedules
  variables:
    FULL_SUITE: "true"
`,
    'README.md': `# GitLab CI — ${stack}

Drop \`.gitlab-ci.yml\` in repo root.

## Schedule a nightly run
Project → CI/CD → Schedules → New schedule → \`0 2 * * *\`
`,
  };
}

// ── Jenkins ─────────────────────────────────────────────────────────────────
function genJenkins(stack, opts) {
  const stageMap = {
    playwright: `        sh 'npm ci && npx playwright install --with-deps && npx playwright test'`,
    jest:       `        sh 'npm ci && npm test'`,
    maven:      `        sh 'mvn -B test'`,
    pytest:     `        sh 'pip install -r requirements.txt && pytest --junitxml=test-results/junit.xml'`,
    k6:         `        sh 'k6 run load-test.js'`,
    jmeter:     `        sh 'jmeter -n -t test-plan.jmx -l results.jtl -e -o report'`,
  };

  return {
    'Jenkinsfile': `pipeline {
  agent any

  triggers {
    cron('0 2 * * *')            // nightly
    pollSCM('H/15 * * * *')      // poll every 15 min
  }

  options {
    timeout(time: 30, unit: 'MINUTES')
    buildDiscarder(logRotator(numToKeepStr: '20'))
  }

  stages {
    stage('Checkout') { steps { checkout scm } }
    stage('Test') {
      steps {
${stageMap[stack] || stageMap.playwright}
      }
      post {
        always {
          archiveArtifacts artifacts: 'playwright-report/**,test-results/**,report/**,results.jtl', allowEmptyArchive: true
          junit testResults: 'test-results/**/*.xml', allowEmptyResults: true
          publishHTML target: [
            reportDir: 'playwright-report',
            reportFiles: 'index.html',
            reportName: 'Playwright Report',
            keepAll: true,
          ]
        }
      }
    }
  }

  post {
    failure {
      slackSend (color: 'danger', message: "❌ Build failed: \${env.JOB_NAME} #\${env.BUILD_NUMBER}")
    }
    success {
      slackSend (color: 'good', message: "✅ Build passed: \${env.JOB_NAME} #\${env.BUILD_NUMBER}")
    }
  }
}
`,
    'README.md': `# Jenkins — ${stack}

Drop \`Jenkinsfile\` in repo root, create a multibranch pipeline, point it at the repo.

## Slack notifications
Install the Slack Notification plugin, configure in Jenkins global settings.
`,
  };
}

// ── Azure DevOps Pipelines ──────────────────────────────────────────────────
function genAzure(stack, opts) {
  const stepMap = {
    playwright: `  - task: NodeTool@0
    inputs: { versionSpec: '20.x' }
  - script: |
      npm ci
      npx playwright install --with-deps
      npx playwright test
  - task: PublishTestResults@2
    condition: always()
    inputs:
      testResultsFiles: 'test-results/junit.xml'
      testRunTitle: 'Playwright'`,
    jest: `  - task: NodeTool@0
    inputs: { versionSpec: '20.x' }
  - script: npm ci && npm test`,
    maven: `  - task: Maven@4
    inputs:
      mavenPomFile: 'pom.xml'
      goals: 'test'
      publishJUnitResults: true`,
    pytest: `  - task: UsePythonVersion@0
    inputs: { versionSpec: '3.11' }
  - script: pip install -r requirements.txt && pytest --junitxml=test-results/junit.xml`,
  };

  return {
    'azure-pipelines.yml': `trigger:
  branches: { include: [main, develop] }
pr:
  branches: { include: [main] }
schedules:
  - cron: "0 2 * * *"
    displayName: Nightly
    branches: { include: [main] }

pool:
  vmImage: 'ubuntu-latest'

steps:
${stepMap[stack] || stepMap.playwright}

  - task: PublishBuildArtifacts@1
    condition: always()
    inputs:
      pathToPublish: 'playwright-report'
      artifactName: 'test-report'
`,
    'README.md': `# Azure DevOps — ${stack}

Drop \`azure-pipelines.yml\` in repo root.
`,
  };
}

// ── CircleCI ────────────────────────────────────────────────────────────────
function genCircleCi(stack, opts) {
  return {
    '.circleci/config.yml': `version: 2.1
orbs:
  node: circleci/node@6.0.0
jobs:
  test:
    docker:
      - image: mcr.microsoft.com/playwright:v1.55.0-noble
    steps:
      - checkout
      - node/install-packages
      - run: npx playwright test
      - store_test_results: { path: test-results }
      - store_artifacts:    { path: playwright-report }
workflows:
  on-push: { jobs: [test] }
  nightly:
    triggers:
      - schedule:
          cron: "0 2 * * *"
          filters: { branches: { only: [main] } }
    jobs: [test]
`,
    'README.md': `# CircleCI — ${stack}

Drop \`.circleci/config.yml\` in repo root.
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
