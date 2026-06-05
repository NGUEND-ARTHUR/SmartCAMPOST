(async () => {
  const url = (process.env.E2E_API_BASE_URL || 'http://127.0.0.1:8082').replace(/\/+$/, '') + '/api/auth/login';
  const payload = { phone: '+237690000000', password: 'Admin@SmartCAMPOST2026' };
  console.log('Posting to', url);
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const text = await res.text();
    console.log('Status', res.status);
    console.log('Body', text);
  } catch (e) {
    console.error('Error:', e);
  }
})();
