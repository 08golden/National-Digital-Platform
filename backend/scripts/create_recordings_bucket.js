const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

async function main() {
  const envPath = path.resolve(__dirname, '..', '.env.local')
  const env = fs.readFileSync(envPath, 'utf8')
  const vars = Object.fromEntries(env.split(/\r?\n/).filter(Boolean).map(l => {
    const [k,v] = l.split('=')
    return [k, v]
  }))

  const supabaseUrl = vars.NEXT_PUBLIC_SUPABASE_URL
  const service = vars.SUPABASE_SERVICE_ROLE_KEY

  const supabase = createClient(supabaseUrl, service)

  console.log('Creating bucket recordings (if not exists)')
  const { data, error } = await supabase.storage.createBucket('recordings', { public: false })
  if (error && error.message && !error.message.includes('already exists')) {
    console.error('Bucket creation error', error)
    process.exit(1)
  }

  console.log('Bucket ensured:', data || 'already exists')
}

main().catch(e => { console.error(e); process.exit(1) })
