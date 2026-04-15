// ── Mobile Test Generator — Appium / WebdriverIO / Detox ────────────────────
const fs       = require('fs');
const path     = require('path');
const archiver = require('archiver');

async function generate({ appPackage = '', platform = 'android', tool = 'appium-webdriverio', options = {}, outputDir }) {
  fs.mkdirSync(outputDir, { recursive: true });
  const generators = {
    'appium-webdriverio': () => genAppiumWdio(platform, appPackage, options),
    'appium-java':        () => genAppiumJava(platform, appPackage, options),
    'detox':              () => genDetox(platform, options),
    'maestro':            () => genMaestro(platform, appPackage, options),
  };
  const files = (generators[tool] || generators['appium-webdriverio'])();
  const projectName = `mobile-test-suite-${tool}-${platform}`;
  const projectDir = path.join(outputDir, projectName);
  fs.mkdirSync(projectDir, { recursive: true });
  for (const [p, content] of Object.entries(files)) {
    const full = path.join(projectDir, p);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, 'utf-8');
  }
  const zipPath = path.join(outputDir, `${projectName}.zip`);
  await createZip(projectDir, zipPath);
  return { zipPath, projectName, fileCount: Object.keys(files).length, tool, platform };
}

// ── Appium + WebdriverIO (Node / JS) ────────────────────────────────────────
function genAppiumWdio(platform, appPackage, opts) {
  const isAndroid = platform === 'android';
  const capsName = isAndroid ? 'Android' : 'iOS';

  const cap = isAndroid ? `{
      platformName: 'Android',
      'appium:platformVersion': '14',
      'appium:deviceName': 'Pixel 7',
      'appium:app': process.env.APP_PATH || './app-debug.apk',
      'appium:automationName': 'UiAutomator2',
      'appium:appPackage': '${appPackage || 'com.example.app'}',
      'appium:appActivity': '.MainActivity',
    }` : `{
      platformName: 'iOS',
      'appium:platformVersion': '17',
      'appium:deviceName': 'iPhone 15',
      'appium:app': process.env.APP_PATH || './MyApp.app',
      'appium:automationName': 'XCUITest',
      'appium:bundleId': '${appPackage || 'com.example.app'}',
    }`;

  return {
    'package.json': JSON.stringify({
      name: `mobile-appium-${platform}`, version: '1.0.0',
      scripts: {
        test: 'wdio run ./wdio.conf.js',
        'appium:start': 'appium',
      },
      devDependencies: {
        '@wdio/cli': '^9.0.0',
        '@wdio/local-runner': '^9.0.0',
        '@wdio/mocha-framework': '^9.0.0',
        '@wdio/spec-reporter': '^9.0.0',
        appium: '^2.11.0',
        ...(isAndroid ? { 'appium-uiautomator2-driver': '^3.7.0' } : { 'appium-xcuitest-driver': '^7.0.0' }),
      },
    }, null, 2),
    'wdio.conf.js': `exports.config = {
  runner: 'local',
  specs: ['./tests/**/*.spec.js'],
  maxInstances: 1,
  capabilities: [${cap}],
  logLevel: 'info',
  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: { ui: 'bdd', timeout: 120000 },
  services: [['appium', { command: 'appium' }]],
};
`,
    'tests/smoke.spec.js': `describe('${capsName} app — smoke tests', () => {

  it('should launch the app and display the main screen', async () => {
    const title = await $('~app_title'); // accessibility ID
    await expect(title).toBeDisplayed();
  });

  it('should navigate through primary flow', async () => {
    const loginBtn = await $('~login_button');
    await loginBtn.click();

    const emailInput = await $('~email_input');
    await emailInput.setValue('test@example.com');

    const passwordInput = await $('~password_input');
    await passwordInput.setValue('Test@1234');

    const submitBtn = await $('~submit_button');
    await submitBtn.click();

    const dashboard = await $('~dashboard_screen');
    await expect(dashboard).toBeDisplayed();
  });

  it('should handle network error gracefully', async () => {
    // Toggle airplane mode / disable network
    await browser.setNetworkConnection(0);
    const retryBtn = await $('~retry_button');
    await retryBtn.click();
    const errorMsg = await $('~error_message');
    await expect(errorMsg).toBeDisplayed();
    await browser.setNetworkConnection(6); // restore
  });

});
`,
    'README.md': `# Mobile Test Suite — Appium + WebdriverIO

Platform: **${capsName}**
App: \`${appPackage || '(provide via APP_PATH env)'}\`

## Prerequisites
- Node.js 18+
- Appium 2 (installed via npm)
- ${isAndroid ? 'Android SDK + emulator (or real device with USB debugging)' : 'Xcode + iOS simulator'}
- ${isAndroid ? 'ANDROID_HOME env var set' : 'Valid signing provisioning profile for device testing'}

## Setup
\`\`\`bash
npm install
${isAndroid ? "npx appium driver install uiautomator2" : "npx appium driver install xcuitest"}

# Start Appium server in one terminal
npm run appium:start

# In another terminal — set your app path
export APP_PATH=${isAndroid ? '/path/to/app-debug.apk' : '/path/to/MyApp.app'}
npm test
\`\`\`

## Cloud testing (BrowserStack / Sauce Labs / LambdaTest)
Replace the capabilities in \`wdio.conf.js\` with your cloud provider's config.
`,
  };
}

// ── Appium + Java + TestNG (enterprise) ─────────────────────────────────────
function genAppiumJava(platform, appPackage, opts) {
  const isAndroid = platform === 'android';
  return {
    'pom.xml': `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.qa.mobile</groupId>
  <artifactId>appium-mobile-tests</artifactId>
  <version>1.0.0</version>
  <properties><maven.compiler.source>17</maven.compiler.source><maven.compiler.target>17</maven.compiler.target></properties>
  <dependencies>
    <dependency><groupId>io.appium</groupId><artifactId>java-client</artifactId><version>9.3.0</version></dependency>
    <dependency><groupId>org.testng</groupId><artifactId>testng</artifactId><version>7.10.2</version><scope>test</scope></dependency>
  </dependencies>
</project>
`,
    [`src/test/java/com/qa/MobileTest.java`]: `package com.qa;
import io.appium.java_client.${isAndroid ? 'android.AndroidDriver' : 'ios.IOSDriver'};
import io.appium.java_client.AppiumBy;
import org.openqa.selenium.remote.DesiredCapabilities;
import org.testng.annotations.*;
import java.net.URL;

public class MobileTest {
  private ${isAndroid ? 'AndroidDriver' : 'IOSDriver'} driver;

  @BeforeClass
  public void setUp() throws Exception {
    DesiredCapabilities caps = new DesiredCapabilities();
    caps.setCapability("platformName", "${isAndroid ? 'Android' : 'iOS'}");
    caps.setCapability("appium:automationName", "${isAndroid ? 'UiAutomator2' : 'XCUITest'}");
    caps.setCapability("appium:${isAndroid ? 'appPackage' : 'bundleId'}", "${appPackage || 'com.example.app'}");
    driver = new ${isAndroid ? 'AndroidDriver' : 'IOSDriver'}(new URL("http://localhost:4723"), caps);
  }

  @Test
  public void testLogin() {
    driver.findElement(AppiumBy.accessibilityId("login_button")).click();
    driver.findElement(AppiumBy.accessibilityId("email_input")).sendKeys("test@example.com");
    driver.findElement(AppiumBy.accessibilityId("password_input")).sendKeys("Test@1234");
    driver.findElement(AppiumBy.accessibilityId("submit_button")).click();
    // Assertions...
  }

  @AfterClass
  public void tearDown() { if (driver != null) driver.quit(); }
}
`,
    'README.md': `# Appium Mobile Tests — Java + TestNG

## Prerequisites
- JDK 17, Maven, Appium 2, ${isAndroid ? 'Android SDK' : 'Xcode'}

## Run
\`\`\`bash
appium &
mvn test
\`\`\`
`,
  };
}

// ── Detox (React Native gray-box testing) ──────────────────────────────────
function genDetox(platform, opts) {
  return {
    'package.json': JSON.stringify({
      name: 'mobile-detox', version: '1.0.0',
      scripts: {
        test: `detox test --configuration ${platform}.sim.debug`,
        build: `detox build --configuration ${platform}.sim.debug`,
      },
      devDependencies: { detox: '^20.0.0', jest: '^29.0.0' },
    }, null, 2),
    '.detoxrc.js': `module.exports = {
  testRunner: { args: { $0: 'jest', config: 'e2e/jest.config.js' } },
  configurations: {
    '${platform}.sim.debug': {
      device: '${platform === 'android' ? 'android.emu.release' : 'ios.sim.release'}',
      app: '${platform}.release',
    },
  },
};
`,
    'e2e/smoke.test.js': `describe('Smoke', () => {
  beforeEach(async () => { await device.reloadReactNative(); });
  it('shows welcome screen', async () => {
    await expect(element(by.id('welcome'))).toBeVisible();
  });
});
`,
    'README.md': `# Detox (React Native)

## Run
\`\`\`bash
npm install
npm run build
npm test
\`\`\`
`,
  };
}

// ── Maestro (simple YAML-based mobile UI flows) ────────────────────────────
function genMaestro(platform, appPackage, opts) {
  return {
    'flows/smoke.yaml': `appId: ${appPackage || 'com.example.app'}
---
- launchApp
- assertVisible: "Welcome"
- tapOn: "Log In"
- inputText: "test@example.com"
- tapOn: "Password"
- inputText: "Test@1234"
- tapOn: "Submit"
- assertVisible: "Dashboard"
`,
    'README.md': `# Maestro Mobile Flows

## Install
\`\`\`bash
curl -Ls "https://get.maestro.mobile.dev" | bash
\`\`\`

## Run
\`\`\`bash
maestro test flows/smoke.yaml
\`\`\`
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
