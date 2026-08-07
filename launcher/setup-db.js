const path = require('path');
// Ensure node resolves modules from backend/node_modules if called from root
module.paths.push(path.join(__dirname, '..', 'backend', 'node_modules'));

const { Client } = require('pg');
const fs = require('fs');

const PASSWORDS_TO_TRY = ['postgres123', 'jeethu0808', 'postgres', 'admin', 'pass', 'root', '123456'];
const isCheckOnly = process.argv.includes('--check-only');

async function setupDatabase() {
  const envPath = path.join(__dirname, '..', 'backend', '.env');

  // 1. Read existing password from .env if present
  let existingPass = null;
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/DATABASE_URL="postgresql:\/\/[^:]+:([^@]+)@/);
    if (match && match[1]) {
      existingPass = match[1];
    }
  }

  const passwords = existingPass ? [existingPass, ...PASSWORDS_TO_TRY] : PASSWORDS_TO_TRY;
  let workingClient = null;
  let workingPass = null;

  for (const pass of passwords) {
    try {
      const client = new Client({
        user: 'postgres',
        host: 'localhost',
        database: 'postgres',
        password: pass,
        port: 5432,
      });
      await client.connect();
      const res = await client.query('SELECT version()');
      if (res.rows.length > 0) {
        workingClient = client;
        workingPass = pass;
        break;
      }
    } catch (e) {
      // Ignore and try next password
    }
  }

  if (!workingClient) {
    if (!isCheckOnly) {
      console.error('ERROR: Could not connect to PostgreSQL on localhost:5432 with default passwords.');
      console.error('Please ensure PostgreSQL is running and postgres user credentials are valid.');
    }
    process.exit(1);
  }

  if (isCheckOnly) {
    console.log('PostgreSQL database server verified and query execution succeeded.');
    await workingClient.end();
    process.exit(0);
  }

    const res = await workingClient.query("SELECT datname FROM pg_database");
    const existingDbs = res.rows.map(r => r.datname.toLowerCase());
    let targetDb = 'Digital_twin_dev';

    if (!existingDbs.includes(targetDb.toLowerCase())) {
      console.log(`Creating database '${targetDb}'...`);
      await workingClient.query(`CREATE DATABASE "${targetDb}"`);
      console.log(`Database '${targetDb}' created successfully!`);
    } else {
      console.log(`Database '${targetDb}' already exists. Using existing database.`);
    }
    await workingClient.end();

    // 3. Write or update backend/.env
    const newDbUrl = `postgresql://postgres:${workingPass}@localhost:5432/${targetDb}?schema=public`;
    
    let envLines = [];
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      envLines = content.split(/\r?\n/).filter(line => line.trim() && !line.startsWith('DATABASE_URL='));
    }

    envLines.unshift(`DATABASE_URL="${newDbUrl}"`);

    if (!envLines.some(l => l.startsWith('PORT='))) envLines.push('PORT=3001');
    if (!envLines.some(l => l.startsWith('JWT_SECRET='))) envLines.push('JWT_SECRET="super-secret-dt-key-2026"');
    if (!envLines.some(l => l.startsWith('ADMIN_USERNAME='))) envLines.push('ADMIN_USERNAME="admin@CSRL"');
    if (!envLines.some(l => l.startsWith('ADMIN_PASSWORD='))) envLines.push('ADMIN_PASSWORD="CSRLdt@0608"');
    if (!envLines.some(l => l.startsWith('MQTT_PORT='))) envLines.push('MQTT_PORT=1884');

    fs.writeFileSync(envPath, envLines.join('\n') + '\n', 'utf8');
    console.log(`Updated backend/.env with DATABASE_URL="${newDbUrl}"`);

  } catch (err) {
    console.error('Error setting up database:', err.message);
    process.exit(1);
  }
}

setupDatabase();
