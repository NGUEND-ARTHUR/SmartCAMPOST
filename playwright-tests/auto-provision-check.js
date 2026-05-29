(async () => {
  const base = (process.env.E2E_API_BASE_URL || 'http://127.0.0.1:8082').replace(/\/+$/, '');
  const loginUrl = base + '/api/auth/login';
  const agentsUrl = base + '/api/agents';
  // admin creds
  const admin = { phone: '+237690000000', password: 'Admin@SmartCAMPOST2026' };
  // login admin
  const ares = await fetch(loginUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(admin) });
  console.log('Admin login status', ares.status);
  const ajson = await ares.json().catch(()=>null);
  console.log('Admin body', ajson);
  const token = ajson?.accessToken || ajson?.token || ajson?.jwt;
  if (!token) return console.error('No admin token');

  // create agent
  const ts = Date.now();
  const payload = { fullName: `Auto AGENT ${ts}`, phone: `+2376${String(ts).slice(-7)}`, email: `auto_agent_${ts}@example.com`, password: 'Test@' + String(ts).slice(-6) };
  console.log('Creating agent with', payload.phone);
  const cres = await fetch(agentsUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
  console.log('Create agent status', cres.status);
  const cjson = await cres.json().catch(()=>null);
  console.log('Create agent body', cjson);

  // login as agent
  const ures = await fetch(loginUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: payload.phone, password: payload.password }) });
  console.log('Agent login status', ures.status);
  const ujson = await ures.json().catch(()=>null);
  console.log('Agent login body', ujson);
})();
