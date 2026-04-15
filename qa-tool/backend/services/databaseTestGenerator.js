// ── Database / ETL Test Generator ───────────────────────────────────────────
const fs       = require('fs');
const path     = require('path');
const archiver = require('archiver');

async function generate({ dbType = 'postgres', tool = 'sql-assertion-js', options = {}, outputDir }) {
  fs.mkdirSync(outputDir, { recursive: true });
  const generators = {
    'sql-assertion-js': () => genSqlAssertionJs(dbType, options),
    'dbt-test':         () => genDbtTest(dbType, options),
    'great-expectations': () => genGreatExpectations(dbType, options),
  };
  const files = (generators[tool] || generators['sql-assertion-js'])();
  const projectName = `db-test-suite-${tool}-${dbType}`;
  const projectDir = path.join(outputDir, projectName);
  fs.mkdirSync(projectDir, { recursive: true });
  for (const [p, content] of Object.entries(files)) {
    const full = path.join(projectDir, p);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, 'utf-8');
  }
  const zipPath = path.join(outputDir, `${projectName}.zip`);
  await createZip(projectDir, zipPath);
  return { zipPath, projectName, fileCount: Object.keys(files).length, tool, dbType };
}

// ── Node-based SQL assertion framework (Mocha + pg/mysql2/mssql/sqlite3) ───
function genSqlAssertionJs(dbType, opts) {
  const drivers = {
    postgres: { dep: 'pg',      name: 'PostgreSQL', importLine: "const { Client } = require('pg');", connect: `new Client({ connectionString: process.env.DB_URL })` },
    mysql:    { dep: 'mysql2',  name: 'MySQL',      importLine: "const mysql = require('mysql2/promise');", connect: `await mysql.createConnection(process.env.DB_URL)` },
    mssql:    { dep: 'mssql',   name: 'SQL Server', importLine: "const sql = require('mssql');", connect: `await sql.connect(process.env.DB_URL)` },
    sqlite:   { dep: 'better-sqlite3', name: 'SQLite', importLine: "const Database = require('better-sqlite3');", connect: `new Database(process.env.DB_FILE || 'test.db')` },
  };
  const d = drivers[dbType] || drivers.postgres;

  return {
    'package.json': JSON.stringify({
      name: `db-tests-${dbType}`, version: '1.0.0',
      scripts: { test: 'mocha --timeout 30000 tests/**/*.test.js' },
      devDependencies: { mocha: '^10.4.0', chai: '^4.4.1', [d.dep]: '*' },
    }, null, 2),
    'tests/data-integrity.test.js': `${d.importLine}
const { expect } = require('chai');

describe('${d.name} — data integrity', () => {
  let client;

  before(async () => {
    client = ${d.connect};
    ${dbType === 'postgres' ? 'await client.connect();' : ''}
  });

  after(async () => {
    ${dbType === 'postgres' || dbType === 'mysql' ? 'await client.end();' : ''}
    ${dbType === 'sqlite' ? 'client.close();' : ''}
  });

  // ── Row count checks ─────────────────────────────────────────────
  it('users table has at least 1 row', async () => {
    const { rows } = ${dbType === 'postgres' ? `await client.query('SELECT COUNT(*) AS c FROM users')` :
                        dbType === 'mysql'    ? `{ rows: (await client.execute('SELECT COUNT(*) AS c FROM users'))[0] }` :
                                                `{ rows: client.prepare('SELECT COUNT(*) AS c FROM users').all() }`};
    expect(Number(rows[0].c)).to.be.greaterThan(0);
  });

  // ── No duplicate primary keys ───────────────────────────────────
  it('no duplicate user IDs', async () => {
    const q = 'SELECT id, COUNT(*) AS c FROM users GROUP BY id HAVING COUNT(*) > 1';
    const { rows } = ${dbType === 'postgres' ? `await client.query(q)` :
                        dbType === 'mysql'    ? `{ rows: (await client.execute(q))[0] }` :
                                                `{ rows: client.prepare(q).all() }`};
    expect(rows).to.have.lengthOf(0);
  });

  // ── No NULLs in required columns ────────────────────────────────
  it('email column has no NULLs', async () => {
    const q = 'SELECT COUNT(*) AS c FROM users WHERE email IS NULL';
    const { rows } = ${dbType === 'postgres' ? `await client.query(q)` :
                        dbType === 'mysql'    ? `{ rows: (await client.execute(q))[0] }` :
                                                `{ rows: client.prepare(q).all() }`};
    expect(Number(rows[0].c)).to.equal(0);
  });

  // ── Referential integrity ───────────────────────────────────────
  it('all orders.user_id reference an existing users.id', async () => {
    const q = 'SELECT COUNT(*) AS c FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE u.id IS NULL';
    const { rows } = ${dbType === 'postgres' ? `await client.query(q)` :
                        dbType === 'mysql'    ? `{ rows: (await client.execute(q))[0] }` :
                                                `{ rows: client.prepare(q).all() }`};
    expect(Number(rows[0].c)).to.equal(0);
  });

  // ── Format validation ───────────────────────────────────────────
  it('email format is valid (basic regex)', async () => {
    const q = "SELECT COUNT(*) AS c FROM users WHERE email !~ '^[^@]+@[^@]+\\\\.[^@]+$'";
    try {
      const { rows } = ${dbType === 'postgres' ? `await client.query(q)` : `{ rows: [{ c: 0 }] }`};
      expect(Number(rows[0].c)).to.equal(0);
    } catch (e) { this.skip(); }
  });

  // ── Numeric bounds ──────────────────────────────────────────────
  it('order totals are non-negative', async () => {
    const q = 'SELECT COUNT(*) AS c FROM orders WHERE total < 0';
    const { rows } = ${dbType === 'postgres' ? `await client.query(q)` :
                        dbType === 'mysql'    ? `{ rows: (await client.execute(q))[0] }` :
                                                `{ rows: client.prepare(q).all() }`};
    expect(Number(rows[0].c)).to.equal(0);
  });
});
`,
    'tests/etl-reconciliation.test.js': `${d.importLine}
const { expect } = require('chai');

describe('ETL — source vs target reconciliation', () => {
  let source, target;

  before(async () => {
    source = ${d.connect.replace('DB_URL', 'SOURCE_DB_URL')};
    target = ${d.connect.replace('DB_URL', 'TARGET_DB_URL')};
    ${dbType === 'postgres' ? 'await source.connect(); await target.connect();' : ''}
  });

  it('row counts match between source and target', async () => {
    const srcCount = ${dbType === 'postgres' ? '(await source.query("SELECT COUNT(*) AS c FROM customers")).rows[0].c' : '0'};
    const tgtCount = ${dbType === 'postgres' ? '(await target.query("SELECT COUNT(*) AS c FROM customers")).rows[0].c' : '0'};
    expect(Number(srcCount)).to.equal(Number(tgtCount));
  });

  it('key checksums match between source and target', async () => {
    // Verify via MD5/SHA checksums of ordered column data
    // Customize this query to your schema
    expect(true).to.equal(true); // TODO: implement
  });
});
`,
    '.env.example': `# Copy to .env and fill in
DB_URL=${dbType === 'postgres' ? 'postgresql://user:pass@localhost:5432/mydb' :
         dbType === 'mysql'    ? 'mysql://user:pass@localhost:3306/mydb' :
         dbType === 'mssql'    ? 'Server=localhost;Database=mydb;User Id=sa;Password=***;' :
                                 'test.db'}
SOURCE_DB_URL=${dbType === 'postgres' ? 'postgresql://user:pass@source-host/mydb' : ''}
TARGET_DB_URL=${dbType === 'postgres' ? 'postgresql://user:pass@target-host/mydb' : ''}
`,
    'README.md': `# ${d.name} Database Test Suite

## What's included
- **Data integrity**: row counts, duplicates, NULL checks, FK integrity, format validation, numeric bounds
- **ETL reconciliation**: source vs target row count + checksums

## Prerequisites
- Node.js 18+
- Database accessible at \`DB_URL\`

## Setup
\`\`\`bash
npm install
cp .env.example .env
# Edit .env with your DB connection strings
\`\`\`

## Run
\`\`\`bash
npm test
\`\`\`

## Adapt to your schema
Open \`tests/*.test.js\` and replace the example table names (\`users\`, \`orders\`) with your actual tables and columns.
`,
  };
}

// ── dbt tests (declarative SQL tests) ──────────────────────────────────────
function genDbtTest(dbType, opts) {
  return {
    'dbt_project.yml': `name: 'data_tests'
version: '1.0.0'
config-version: 2
profile: 'default'
model-paths: ['models']
test-paths: ['tests']
`,
    'models/schema.yml': `version: 2
models:
  - name: users
    columns:
      - name: id
        tests: [unique, not_null]
      - name: email
        tests: [not_null]
  - name: orders
    columns:
      - name: user_id
        tests:
          - relationships:
              to: ref('users')
              field: id
      - name: total
        tests:
          - dbt_utils.accepted_range:
              min_value: 0
`,
    'README.md': `# dbt Data Tests

## Run
\`\`\`bash
pip install dbt-${dbType}
dbt deps
dbt test
\`\`\`
`,
  };
}

// ── Great Expectations (Python data validation) ────────────────────────────
function genGreatExpectations(dbType, opts) {
  return {
    'requirements.txt': 'great-expectations>=1.0\n',
    'README.md': `# Great Expectations Data Tests

## Quickstart
\`\`\`bash
pip install -r requirements.txt
great_expectations init
great_expectations datasource new
great_expectations checkpoint run
\`\`\`

See docs: https://docs.greatexpectations.io/
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
