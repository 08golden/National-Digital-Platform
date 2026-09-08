const fs = require('fs')
const path = require('path')
const fetch = require('node-fetch')
const { createClient } = require('@supabase/supabase-js')

async function main() {
  const envPath = path.resolve(__dirname, '..', '.env.local')
  const env = fs.readFileSync(envPath, 'utf8')
  const vars = Object.fromEntries(env.split(/\r?\n/).filter(Boolean).map(l => {
    const [k,v] = l.split('=')
    return [k, v]
  }))

  const supabaseUrl = vars.NEXT_PUBLIC_SUPABASE_URL
  const anon = vars.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const supabase = createClient(supabaseUrl, anon)

  // create a small test file
  const tmp = path.join(__dirname, 'tmp_test.txt')
  fs.writeFileSync(tmp, 'e2e test ' + Date.now())

  const fileName = `e2e_${Date.now()}.txt`
  const storagePath = `tests/${fileName}`

  console.log('Uploading to storage:', storagePath)
  const { data, error } = await supabase.storage.from('recordings').upload(storagePath, fs.createReadStream(tmp))
  if (error) {
    console.error('Upload error', error)
    process.exit(1)
  }

  console.log('Uploaded, creating recording via API...')

  const body = {
    title: 'E2E Test file',
    description: 'Automated E2E test',
    language_id: null,
    storage_path: data.path,
  }

  const res = await fetch('http://localhost:3000/api/recordings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-dev-bypass': '1' },
    body: JSON.stringify(body),
  })

  const resp = await res.text()
  console.log('API response status', res.status)
  console.log(resp)
}

main().catch(e => { console.error(e); process.exit(1) })
