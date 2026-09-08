(async ()=>{
  try {
    const url = 'https://nolewotwsnrwldgfdadi.supabase.co/rest/v1/languages?select=*';
    const anon = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbGV3d3c25yd2xkZ2ZkYWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3OTYyNTQsImV4cCI6MjEwNDM3MjI1NH0.GJQ7ApkaMvb-9cQurQtp0hyD52dz_gQltebUZqOaHO4';
    const res = await fetch(url, { headers: { apikey: anon, Authorization: `Bearer ${anon}` } });
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Body:', text.slice(0, 2000));
  } catch (e) {
    console.error('Error:', e.message);
  }
})();
