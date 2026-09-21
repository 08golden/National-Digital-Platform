const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

async function runFile(client, filePath) {
  const sql = fs.readFileSync(filePath, 'utf8')
  console.log('Running', path.basename(filePath))
  try {
    await client.query(sql)
    console.log('OK:', path.basename(filePath))
  } catch (err) {
    console.error('ERROR running', path.basename(filePath), err.message || err)
    throw err
  }
}

async function main() {
  const dbUrl = process.argv[2] || process.env.DATABASE_URL || (fs.existsSync(path.join(__dirname, '.db_url_temp')) ? fs.readFileSync(path.join(__dirname, '.db_url_temp'), 'utf8').trim() : null)
  if (!dbUrl) {
    console.error('Usage: node run_migrations.js <DATABASE_URL>')
    process.exit(1)
  }

  const client = new Client({ connectionString: dbUrl })
  await client.connect()

  try {
    const migrationsDir = path.resolve(__dirname, '..', 'nldr-backend', 'supabase', 'migrations')
    const files = [
      '20260908000001_honours_schema.sql',
      '20260908000002_seed_initial_data.sql',
    ].map(f => path.join(migrationsDir, f))

    for (const f of files) {
      if (!fs.existsSync(f)) {
        console.warn('Migration file not found:', f)
        continue
      }
      await runFile(client, f)
    }

    console.log('Migrations completed successfully')
  } finally {
    await client.end()
  }
}

main().catch(err => {
  console.error('Migration run failed:', err)
  process.exit(1)
})
