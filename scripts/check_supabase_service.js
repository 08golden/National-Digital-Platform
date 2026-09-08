(async ()=>{
  try {
    const url = 'https://nolewotwsnrwldgfdadi.supabase.co/rest/v1/languages?select=*';
    const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbGV3d3c25yd2xkZ2ZkYWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODc5NjI1NCwiZXhwIjoyMTA0MzcyMjU0fQ.mAc4HnPTAymZMoCF6eVQ5v5n03WqyuySMGMg7K1Fx2Y';
    const res = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Body:', text.slice(0, 2000));
  } catch (e) {
    console.error('Error:', e.message);
  }
})();
