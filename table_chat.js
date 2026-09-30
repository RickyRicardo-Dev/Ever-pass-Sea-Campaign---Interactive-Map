(() => {
  'use strict';
  if (window.deckhandLoaded) return;
  window.deckhandLoaded = true;
  const LOCAL_SERVICE = 'http://192.168.68.62:8765';
  const CONNECTION_STORE = 'deckhand-connection-v3';
  const PUBLIC_ORIGIN = 'https://rickyricardo-dev.github.io';
  function privateHost(host) {
    if (host === 'localhost' || host === '[::1]') return true;
    const a = host.split('.').map(Number);
    return a.length === 4 && a.every(n => Number.isInteger(n) && n >= 0 && n <= 255) &&
      (a[0] === 127 || a[0] === 10 || (a[0] === 192 && a[1] === 168) || (a[0] === 172 && a[1] >= 16 && a[1] <= 31));
  }
  const onLocalSite = location.protocol === 'http:' && location.port === '8765' && privateHost(location.hostname);
  function validateConnection(value) {
    if (!value || typeof value.server !== 'string' || typeof value.key !== 'string') return null;
    try {
      const u = new URL(value.server);
      if (u.protocol !== 'https:' || !/^[a-z0-9-]+\.trycloudflare\.com$/.test(u.hostname) ||
          u.username || u.password || u.port || u.pathname !== '/' || u.search || u.hash ||
          !/^[A-Za-z0-9_-]{32,128}$/.test(value.key)) return null;
      return {server: u.origin, key: value.key};
    } catch (_) { return null; }
  }
  function connectionFromLink(text) {
    const u = new URL(text.trim());
    if (u.origin !== PUBLIC_ORIGIN) return null;
    const params = new URLSearchParams(u.hash.slice(1));
    return validateConnection({server: params.get('deckhand-server'), key: params.get('deckhand-key')});
  }
  let remote = null;
  try { remote = validateConnection(JSON.parse(localStorage.getItem(CONNECTION_STORE) || 'null')); } catch (_) {}
  let incoming = false;
  if (!onLocalSite && location.hash.includes('deckhand-server=')) {
    try {
      const imported = connectionFromLink(location.href);
      if (imported) {
        remote = imported; incoming = true;
        try { localStorage.setItem(CONNECTION_STORE, JSON.stringify(remote)); } catch (_) {}
      }
      // The access key lives in the URL fragment, never in an HTTP query or log.
      history.replaceState(null, '', location.pathname + location.search);
    } catch (_) {}
  }
  let service = onLocalSite ? location.origin : remote?.server;
  let accessKey = onLocalSite ? null : remote?.key;
  let storageKey = 'seaTableChat:anywhere-v3:' + (service || 'unconnected');
  const css = `#sea-chat-launch{position:fixed;right:20px;bottom:20px;z-index:99999;border:1px solid #8b723a;border-radius:999px;background:linear-gradient(135deg,#e5b85b,#b88130);color:#101923;font:800 15px system-ui;padding:13px 18px;box-shadow:0 10px 35px #0008;cursor:pointer}#sea-chat-panel{position:fixed;right:20px;bottom:78px;z-index:99999;width:min(390px,calc(100vw - 24px));height:min(590px,calc(100vh - 110px));display:none;grid-template-rows:auto 1fr auto;background:#0b1725;border:1px solid #375369;border-radius:18px;box-shadow:0 20px 60px #000b;color:#eef5fb;font:14px/1.45 system-ui}#sea-chat-panel.open{display:grid}#sea-chat-head{padding:13px 15px;border-bottom:1px solid #28405a;display:flex;justify-content:space-between;align-items:center}#sea-chat-head strong{font:700 17px Georgia,serif;color:#f4d68d}#sea-chat-head small{display:block;color:#9fb0c2;font-size:11px}#sea-chat-close{background:transparent;color:#cbd8e3;border:0;font-size:24px;cursor:pointer}#sea-chat-log{padding:13px;overflow:auto;display:flex;flex-direction:column;gap:10px}#sea-chat-log .msg{white-space:pre-wrap;overflow-wrap:anywhere;padding:10px 12px;border-radius:13px;max-width:94%}#sea-chat-log .user{align-self:flex-end;background:#18364a;color:#eaf8fb}#sea-chat-log .bot{align-self:flex-start;background:#142335;border:1px solid #28405a}#sea-chat-log .error{color:#ffb4a7;border-color:#8e4e48}#sea-chat-log .src{display:block;color:#9fb0c2;font-size:11px;margin-top:6px}#sea-chat-compose{padding:11px;border-top:1px solid #28405a;display:grid;grid-template-columns:1fr auto;gap:8px}#sea-chat-question{resize:none;min-height:44px;max-height:110px;border:1px solid #375369;border-radius:11px;padding:10px;background:#07101b;color:#eef5fb;outline:none}#sea-chat-send{border:0;border-radius:11px;background:#e5b85b;color:#101923;font-weight:850;padding:0 14px;cursor:pointer}#sea-chat-send:disabled{opacity:.55;cursor:wait}@media(max-width:520px){#sea-chat-launch{right:12px;bottom:12px}#sea-chat-panel{right:12px;bottom:68px;height:min(70vh,590px)}}`;
  const style = document.createElement('style');
  style.textContent = css + '#sea-chat-panel [hidden]{display:none!important}#sea-chat-connect{display:grid;gap:6px;padding:8px 13px;font-size:12px;color:#9fb0c2}#sea-chat-local-link{color:#f4d68d}#sea-chat-panel{grid-template-rows:auto auto minmax(60px,1fr) auto}#sea-chat-settings summary{cursor:pointer;color:#f4d68d}#sea-chat-connection-form{display:flex;gap:5px;margin-top:8px}#sea-chat-access-link{min-width:0;width:100%;border:1px solid #375369;border-radius:7px;background:#07101b;color:#eef5fb;padding:8px}#sea-chat-connect-button{border:0;border-radius:7px;background:#e5b85b;color:#101923;cursor:pointer}#sea-chat-settings p{margin:5px 0}#sea-chat-launch:focus-visible,#sea-chat-close:focus-visible,#sea-chat-send:focus-visible{outline:2px solid #5ac8d8;outline-offset:3px}';
  document.head.appendChild(style);
  const launch = document.createElement('button');
  launch.id = 'sea-chat-launch'; launch.type = 'button'; launch.textContent = '⚓ Ask the Deckhand';
  launch.setAttribute('aria-expanded', 'false'); launch.setAttribute('aria-controls', 'sea-chat-panel');
  const panel = document.createElement('section');
  panel.id = 'sea-chat-panel'; panel.setAttribute('aria-label', 'Campaign chat');
  panel.innerHTML = '<div id="sea-chat-head"><div><strong>Ask the Deckhand</strong><small>Answers from your campaign’s player notes</small></div><button id="sea-chat-close" type="button" aria-label="Close chat">×</button></div><div id="sea-chat-connect"><span id="sea-chat-status" role="status">Ready to connect.</span><details id="sea-chat-settings"><summary>Connection</summary><p>Paste the full Deckhand access link generated on your PC. You only need to reconnect when that link changes.</p><form id="sea-chat-connection-form"><input id="sea-chat-access-link" type="password" autocomplete="off" placeholder="Paste the full access link" aria-label="Deckhand access link"><button id="sea-chat-connect-button" type="submit">Connect</button></form></details><a id="sea-chat-local-link" hidden>Open Local Mode on home Wi-Fi</a></div><div id="sea-chat-log" aria-live="polite"></div><form id="sea-chat-compose"><textarea id="sea-chat-question" maxlength="2400" placeholder="Ask about a session, character, place, or open lead…" aria-label="Your question"></textarea><button id="sea-chat-send" type="submit">Send</button></form>';
  document.body.append(launch, panel);
  const log = panel.querySelector('#sea-chat-log');
  const form = panel.querySelector('#sea-chat-compose');
  const field = panel.querySelector('#sea-chat-question');
  const send = panel.querySelector('#sea-chat-send');
  const status = panel.querySelector('#sea-chat-status');
  const settings = panel.querySelector('#sea-chat-settings');
  const linkField = panel.querySelector('#sea-chat-access-link');
  const connectionButton = panel.querySelector('#sea-chat-connect-button');
  const localLink = panel.querySelector('#sea-chat-local-link');
  localLink.href = LOCAL_SERVICE + '/index.html?deckhand=open';
  settings.hidden = onLocalSite;
  for (const link of document.querySelectorAll('[data-local-mode]')) {
    link.href = (onLocalSite ? location.origin : LOCAL_SERVICE) + '/index.html';
  }
  let messages = [];
  let connection = null;
  try {
    const stored = JSON.parse(sessionStorage.getItem(storageKey) || '[]');
    if (Array.isArray(stored)) messages = stored.filter(m => m && ['user', 'assistant'].includes(m.role) && typeof m.content === 'string').slice(-12);
  } catch (_) {}
  function bubble(role, text, sources = [], error = false) {
    const div = document.createElement('div');
    div.className = 'msg ' + role + (error ? ' error' : ''); div.textContent = text;
    if (Array.isArray(sources) && sources.length) {
      const label = document.createElement('small'); label.className = 'src';
      label.textContent = 'Player notes: ' + sources.filter(s => typeof s === 'string').join(' • ');
      div.appendChild(label);
    }
    log.appendChild(div); log.scrollTop = log.scrollHeight;
  }
  if (!messages.length) bubble('bot', 'Ahoy! Ask me what the crew knows. I check the player notes on your campaign PC and flag anything they leave unanswered.');
  for (const m of messages) bubble(m.role === 'user' ? 'user' : 'bot', m.content, m.sources || []);
  function save() {
    messages = messages.slice(-12);
    try { sessionStorage.setItem(storageKey, JSON.stringify(messages)); } catch (_) {}
  }
  async function request(path, options = {}, timeout = 30000) {
    if (!service || (!onLocalSite && !accessKey)) throw new Error('Paste your Deckhand access link under Connection, or open the full link from the PC launcher.');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const headers = {...(options.headers || {})};
    if (!onLocalSite) headers.Authorization = 'Bearer ' + accessKey;
    try {
      const response = await fetch(service + path, {
        ...options, headers, signal: controller.signal, credentials: 'omit', cache: 'no-store', redirect: 'error',
        ...(onLocalSite ? {targetAddressSpace: 'local'} : {})
      });
      const data = await response.json();
      if (!response.ok) {
        const error = new Error(data.error || 'Deckhand could not answer that question.');
        error.fromService = true;
        throw error;
      }
      return data;
    } catch (error) {
      if (error.fromService) throw error;
      throw new Error(onLocalSite
        ? 'Could not reach the local server. Leave the chat launcher running on your PC and stay on the home Wi-Fi.'
        : 'Could not reach your campaign PC. Keep START_ANYWHERE_CHAT.bat and Ollama running. If the launcher restarted, paste its newest access link under Connection.');
    } finally { clearTimeout(timer); }
  }
  function connect() {
    if (connection) return connection;
    if (!service) {
      settings.open = true;
      status.textContent = 'Connect using the access link from your PC.';
    } else {
      status.textContent = 'Connecting to your campaign PC…';
    }
    localLink.hidden = true;
    connection = request('/api/health').then(data => {
      if (!['deckhand-local', 'deckhand-anywhere'].includes(data.service) || data.ok !== true) {
        throw new Error('Please start the updated chat launcher included with this package.');
      }
      status.textContent = onLocalSite ? 'Connected · Local Mode' : 'Connected · Anywhere access';
      settings.open = false;
      return data;
    }).catch(error => {
      connection = null;
      status.textContent = error.message;
      settings.open = !onLocalSite;
      localLink.hidden = onLocalSite;
      throw error;
    });
    return connection;
  }
  panel.querySelector('#sea-chat-connection-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (send.disabled || connectionButton.disabled) return;
    connectionButton.disabled = true;
    try {
      const next = connectionFromLink(linkField.value);
      if (!next) throw new Error('Paste the entire Deckhand access link from DECKHAND_ACCESS_LINK.txt, including the part after #.');
      service = next.server; accessKey = next.key; connection = null;
      storageKey = 'seaTableChat:anywhere-v3:' + service;
      messages = []; log.replaceChildren();
      try { localStorage.setItem(CONNECTION_STORE, JSON.stringify(next)); } catch (_) {}
      linkField.value = '';
      await connect();
      bubble('bot', 'Connected to your campaign PC. What would you like to know?');
    } catch (error) { status.textContent = error.message; settings.open = true; }
    finally { connectionButton.disabled = false; }
  });
  function setOpen(open) {
    panel.classList.toggle('open', open); launch.setAttribute('aria-expanded', String(open));
    if (open) { field.focus(); connect().catch(() => {}); }
    else launch.focus();
  }
  launch.addEventListener('click', () => setOpen(!panel.classList.contains('open')));
  panel.querySelector('#sea-chat-close').addEventListener('click', () => setOpen(false));
  panel.addEventListener('keydown', event => { if (event.key === 'Escape') setOpen(false); });
  field.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); form.requestSubmit(); }
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const question = field.value.trim();
    if (!question || send.disabled || connectionButton.disabled) return;
    send.disabled = true; connectionButton.disabled = true; send.textContent = '…';
    let waiting;
    try {
      await connect();
      const history = messages.slice(-6).map(m => ({role: m.role, content: m.content}));
      bubble('user', question); messages.push({role: 'user', content: question}); save(); field.value = '';
      waiting = document.createElement('div'); waiting.className = 'msg bot';
      waiting.textContent = 'Checking the campaign notes…'; log.appendChild(waiting); log.scrollTop = log.scrollHeight;
      let data = await request('/api/chat', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({question, history})}, onLocalSite ? 190000 : 30000);
      if (data.job_id) {
        if (!/^[A-Za-z0-9_-]{32}$/.test(data.job_id)) throw new Error('Deckhand returned an invalid answer reference. Please try again.');
        const job = data.job_id;
        const deadline = Date.now() + 420000;
        while (data.status === 'pending' && Date.now() < deadline) {
          await new Promise(resolve => setTimeout(resolve, 1200));
          data = await request('/api/chat/jobs/' + job);
        }
        if (data.status === 'pending') throw new Error('Deckhand is taking too long. Check Ollama on the host PC and try again.');
        if (data.status === 'error') throw new Error(data.error || 'The host PC could not finish this answer.');
      }
      if (typeof data.answer !== 'string') throw new Error('Deckhand returned an unreadable answer. Please try again.');
      const sources = Array.isArray(data.sources) ? data.sources.filter(s => typeof s === 'string') : [];
      bubble('bot', data.answer, sources);
      messages.push({role: 'assistant', content: data.answer, sources}); save();
      status.textContent = onLocalSite ? 'Connected · Local Mode' : 'Connected · Anywhere access';
    } catch (error) {
      connection = null; bubble('bot', error.message, [], true);
      status.textContent = error.fromService ? 'Check the message below' : 'Connection needs attention';
      if (!onLocalSite) settings.open = true;
    } finally {
      if (waiting) waiting.remove();
      send.disabled = false; connectionButton.disabled = false; send.textContent = 'Send';
      if (panel.classList.contains('open')) field.focus();
    }
  });
  if (incoming || (onLocalSite && new URLSearchParams(location.search).get('deckhand') === 'open')) setOpen(true);
})();
