const base = "http://localhost:3000";
const requests = [
  { name: 'GET /api/test', url: `${base}/api/test`, method: 'GET' },
  { name: 'GET /api/languages', url: `${base}/api/languages`, method: 'GET' },
  { name: 'GET /api/tags', url: `${base}/api/tags`, method: 'GET' },
  { name: 'GET /api/recordings', url: `${base}/api/recordings`, method: 'GET' },
];
(async () => {
  for (const req of requests) {
    try {
      const res = await fetch(req.url, { method: req.method });
      const text = await res.text();
      let body;
      try { body = JSON.parse(text); } catch (e) { body = text; }
      console.log('===', req.name, '===');
      console.log(JSON.stringify({ status: res.status, ok: res.ok, body }, null, 2));
    } catch (error) {
      console.log('===', req.name, 'ERROR ===');
      console.log(error.toString());
    }
  }
})();
