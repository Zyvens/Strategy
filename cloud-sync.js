const APP_STORAGE_KEY = 'transpetro_strategy_v1';
const NEON_LAST_REMOTE = 'transpetro_neon_last_remote';
const NEON_LAST_SNAPSHOT = 'transpetro_neon_last_snapshot';
const NEON_DEVICE_ID = 'transpetro_neon_device_id';
const NEON_AUTH_URL = 'https://ep-solitary-resonance-auuiiauk.neonauth.c-10.us-east-1.aws.neon.tech/neondb/auth';
const NEON_DATA_API_URL = 'https://ep-solitary-resonance-auuiiauk.apirest.c-10.us-east-1.aws.neon.tech/neondb/rest/v1';
const NEON_SDK_URL = 'https://esm.sh/@neondatabase/neon-js@0.6.3-beta?bundle&target=es2022';

const deviceId = localStorage.getItem(NEON_DEVICE_ID) || (crypto.randomUUID ? crypto.randomUUID() : `device-${Date.now()}-${Math.random().toString(36).slice(2)}`);
localStorage.setItem(NEON_DEVICE_ID, deviceId);

let neonClient = null;
let currentUser = null;
let syncTimer = null;
let pollTimer = null;
let syncing = false;
let suppressLocalHook = false;
let sdkReady = false;

function unwrap(result) {
  return result && Object.prototype.hasOwnProperty.call(result, 'data') ? result.data : result;
}

function authError(result) {
  return result?.error?.message || result?.error || null;
}

function userFromSession(result) {
  const data = unwrap(result);
  return data?.user || data?.session?.user || null;
}

function setStatus(message, kind = 'muted') {
  const status = document.getElementById('neonStatus');
  if (status) {
    status.textContent = message;
    status.style.color = kind === 'ok' ? 'var(--green)' : kind === 'error' ? 'var(--red)' : 'var(--muted)';
  }
  const top = document.getElementById('neonTopStatus');
  if (top) {
    top.textContent = currentUser ? (kind === 'error' ? '☁ conflito' : '☁ Neon') : '☁ local';
    top.classList.toggle('green', Boolean(currentUser) && kind !== 'error');
    top.classList.toggle('amber', kind === 'error');
  }
}

function meaningfulLocalState(raw) {
  try {
    const s = JSON.parse(raw || '{}');
    return Boolean(
      Object.keys(s.microDone || {}).length ||
      Object.keys(s.completed || {}).length ||
      (s.scores || []).length ||
      (s.errors || []).length ||
      Object.values(s.topics || {}).some(Number) ||
      Object.values(s.studyLog || {}).some(Number) ||
      Number(s.xpBonus || 0)
    );
  } catch {
    return false;
  }
}

function snapshotRaw() {
  return localStorage.getItem(APP_STORAGE_KEY) || '{}';
}

function setSyncMeta(raw, remoteUpdatedAt) {
  localStorage.setItem(NEON_LAST_SNAPSHOT, raw);
  localStorage.setItem(NEON_LAST_REMOTE, remoteUpdatedAt || new Date().toISOString());
}

async function getSession() {
  if (!neonClient) return null;
  try {
    const result = await neonClient.auth.getSession();
    currentUser = userFromSession(result);
    renderAuthState();
    return currentUser;
  } catch (error) {
    currentUser = null;
    renderAuthState();
    setStatus(`Auth indisponível · ${error.message}`, 'error');
    return null;
  }
}

async function fetchRemote() {
  if (!neonClient || !currentUser) return null;
  const { data, error } = await neonClient
    .from('strategy_state')
    .select('user_id,payload,device_id,revision,updated_at')
    .limit(1);
  if (error) throw new Error(error.message || 'Falha ao consultar o Neon.');
  return Array.isArray(data) && data.length ? data[0] : null;
}

async function pushToNeon({ force = false } = {}) {
  if (!neonClient || !currentUser || syncing) return false;
  const raw = snapshotRaw();
  const lastSnapshot = localStorage.getItem(NEON_LAST_SNAPSHOT) || '';
  if (!force && raw === lastSnapshot) return false;

  syncing = true;
  setStatus('Salvando no Neon…');
  try {
    const remote = await fetchRemote();
    const lastRemote = localStorage.getItem(NEON_LAST_REMOTE) || '';
    const remoteRaw = remote ? JSON.stringify(remote.payload || {}) : '';
    const localChanged = raw !== lastSnapshot;
    const remoteChanged = Boolean(remote && lastRemote && remote.updated_at !== lastRemote && remoteRaw !== lastSnapshot);

    if (!force && remoteChanged && localChanged && remoteRaw !== raw) {
      setStatus('Conflito: PC e nuvem mudaram. Escolha qual versão manter.', 'error');
      showConflictActions(true);
      return false;
    }

    const payload = JSON.parse(raw || '{}');
    const stamp = new Date().toISOString();
    let result;
    if (remote) {
      result = await neonClient
        .from('strategy_state')
        .update({ payload, device_id: deviceId, revision: Number(remote.revision || 0) + 1, updated_at: stamp })
        .eq('user_id', currentUser.id)
        .select('updated_at,revision')
        .limit(1);
    } else {
      result = await neonClient
        .from('strategy_state')
        .insert({ user_id: currentUser.id, payload, device_id: deviceId, revision: 1, updated_at: stamp })
        .select('updated_at,revision')
        .limit(1);
    }
    if (result.error) throw new Error(result.error.message || 'Falha ao salvar no Neon.');
    const saved = Array.isArray(result.data) ? result.data[0] : result.data;
    setSyncMeta(raw, saved?.updated_at || stamp);
    showConflictActions(false);
    setStatus(`Sincronizado · ${new Date(saved?.updated_at || stamp).toLocaleString('pt-BR')}`, 'ok');
    return true;
  } catch (error) {
    setStatus(`Offline/local · ${error.message}`, 'error');
    return false;
  } finally {
    syncing = false;
  }
}

async function pullFromNeon({ force = false } = {}) {
  if (!neonClient || !currentUser || syncing) return false;
  syncing = true;
  setStatus('Carregando do Neon…');
  try {
    const remote = await fetchRemote();
    if (!remote) {
      syncing = false;
      return pushToNeon({ force: true });
    }

    const remoteRaw = JSON.stringify(remote.payload || {});
    const localRaw = snapshotRaw();
    const lastSnapshot = localStorage.getItem(NEON_LAST_SNAPSHOT) || '';
    const localChanged = Boolean(lastSnapshot && localRaw !== lastSnapshot);

    if (!force && localChanged && remoteRaw !== localRaw) {
      setStatus('Conflito: há mudanças locais ainda não enviadas.', 'error');
      showConflictActions(true);
      return false;
    }

    if (remoteRaw !== localRaw) {
      suppressLocalHook = true;
      localStorage.setItem(APP_STORAGE_KEY, remoteRaw);
      suppressLocalHook = false;
      setSyncMeta(remoteRaw, remote.updated_at);
      showConflictActions(false);
      setStatus(`Atualizado da nuvem · ${new Date(remote.updated_at).toLocaleString('pt-BR')}`, 'ok');
      setTimeout(() => location.reload(), 120);
      return true;
    }

    setSyncMeta(localRaw, remote.updated_at);
    showConflictActions(false);
    setStatus('PC e celular sincronizados', 'ok');
    return false;
  } catch (error) {
    setStatus(`Offline/local · ${error.message}`, 'error');
    return false;
  } finally {
    syncing = false;
  }
}

async function reconcile() {
  if (!currentUser || syncing) return;
  try {
    const remote = await fetchRemote();
    const localRaw = snapshotRaw();
    const lastSnapshot = localStorage.getItem(NEON_LAST_SNAPSHOT) || '';
    const lastRemote = localStorage.getItem(NEON_LAST_REMOTE) || '';

    if (!remote) {
      await pushToNeon({ force: true });
      return;
    }

    const remoteRaw = JSON.stringify(remote.payload || {});
    if (!lastRemote) {
      if (remoteRaw === localRaw) {
        setSyncMeta(localRaw, remote.updated_at);
        setStatus('PC e celular sincronizados', 'ok');
      } else if (!meaningfulLocalState(localRaw)) {
        await pullFromNeon({ force: true });
      } else {
        setStatus('Primeira sincronização: escolha manter este dispositivo ou baixar a nuvem.', 'error');
        showConflictActions(true);
      }
      return;
    }

    const localChanged = localRaw !== lastSnapshot;
    const remoteChanged = remote.updated_at !== lastRemote && remoteRaw !== lastSnapshot;
    if (localChanged && remoteChanged && remoteRaw !== localRaw) {
      setStatus('Conflito detectado entre dispositivos.', 'error');
      showConflictActions(true);
    } else if (remoteChanged && !localChanged) {
      await pullFromNeon({ force: true });
    } else if (localChanged && !remoteChanged) {
      await pushToNeon();
    } else {
      setSyncMeta(localRaw, remote.updated_at);
      setStatus('PC e celular sincronizados', 'ok');
    }
  } catch (error) {
    setStatus(`Offline/local · ${error.message}`, 'error');
  }
}

function schedulePush() {
  if (!currentUser) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => pushToNeon(), 1000);
}

function watchAppStorage() {
  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function(key, value) {
    originalSetItem.apply(this, arguments);
    if (this === localStorage && key === APP_STORAGE_KEY && !suppressLocalHook) schedulePush();
  };
  window.addEventListener('storage', event => {
    if (event.key === APP_STORAGE_KEY && !suppressLocalHook) schedulePush();
  });
}

function showConflictActions(show) {
  const box = document.getElementById('neonConflictActions');
  if (box) box.hidden = !show;
}

function renderAuthState() {
  const loggedOut = document.getElementById('neonLoggedOut');
  const loggedIn = document.getElementById('neonLoggedIn');
  const email = document.getElementById('neonUserEmail');
  if (!loggedOut || !loggedIn) return;
  loggedOut.hidden = Boolean(currentUser);
  loggedIn.hidden = !currentUser;
  if (email) email.textContent = currentUser?.email || currentUser?.name || currentUser?.id || 'Usuário Neon';
  setStatus(currentUser ? 'Conta conectada ao Neon.' : 'Faça login para sincronizar entre dispositivos.', currentUser ? 'ok' : 'muted');
}

function injectNeonUI() {
  const version = document.getElementById('appVersion');
  if (version) version.textContent = '4.0.0 · GitHub Pages + Neon';

  const topActions = document.querySelector('.top-actions');
  if (topActions && !document.getElementById('neonTopStatus')) {
    const badge = document.createElement('button');
    badge.className = 'pill';
    badge.id = 'neonTopStatus';
    badge.textContent = '☁ local';
    badge.onclick = () => document.querySelector('[data-view="config"]')?.click();
    topActions.prepend(badge);
  }

  const config = document.getElementById('config');
  if (!config || document.getElementById('neonSyncCard')) return;
  const card = document.createElement('div');
  card.className = 'card';
  card.id = 'neonSyncCard';
  card.innerHTML = `
    <span class="eyebrow">Neon Postgres</span>
    <h2>Conta e sincronização</h2>
    <p class="muted">O GitHub Pages continua hospedando o PWA. Sua conta Neon identifica você e o Postgres guarda o mesmo progresso para PC e celular. Offline, o app continua usando o cache local.</p>
    <div id="neonLoggedOut">
      <div class="field"><label>E-mail</label><input id="neonEmail" type="email" autocomplete="email" placeholder="seu@email.com"></div>
      <div class="field"><label>Senha</label><input id="neonPassword" type="password" autocomplete="current-password" placeholder="mínimo 8 caracteres"></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn primary" id="neonSignIn">Entrar</button>
        <button class="btn" id="neonSignUp">Criar conta</button>
      </div>
    </div>
    <div id="neonLoggedIn" hidden>
      <div class="statline"><span>Conta</span><b id="neonUserEmail">—</b></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
        <button class="btn primary" id="neonSyncNow">Sincronizar agora</button>
        <button class="btn" id="neonPull">Baixar do Neon</button>
        <button class="btn" id="neonPush">Enviar este dispositivo</button>
        <button class="btn" id="neonSignOut">Sair</button>
      </div>
      <div id="neonConflictActions" hidden style="margin-top:12px;padding:12px;border:1px solid var(--amber);border-radius:12px">
        <b>Há duas versões diferentes.</b>
        <p class="muted" style="margin:5px 0 10px">Escolha conscientemente qual deve virar a versão oficial.</p>
        <button class="btn" id="neonConflictPull">Usar versão do Neon</button>
        <button class="btn primary" id="neonConflictPush">Usar este dispositivo</button>
      </div>
    </div>
    <p class="footer-note" id="neonStatus">Carregando integração Neon…</p>
  `;
  const grid = config.querySelector('.grid2') || config;
  grid.appendChild(card);

  document.getElementById('neonSignIn').onclick = async () => {
    const email = document.getElementById('neonEmail').value.trim();
    const password = document.getElementById('neonPassword').value;
    if (!email || !password) return setStatus('Informe e-mail e senha.', 'error');
    setStatus('Entrando…');
    try {
      const result = await neonClient.auth.signIn.email({ email, password });
      const err = authError(result);
      if (err) throw new Error(err);
      await getSession();
      await reconcile();
    } catch (error) {
      setStatus(`Não foi possível entrar · ${error.message}`, 'error');
    }
  };

  document.getElementById('neonSignUp').onclick = async () => {
    const email = document.getElementById('neonEmail').value.trim();
    const password = document.getElementById('neonPassword').value;
    if (!email || password.length < 8) return setStatus('Use um e-mail válido e senha com pelo menos 8 caracteres.', 'error');
    setStatus('Criando conta…');
    try {
      const local = JSON.parse(snapshotRaw() || '{}');
      const result = await neonClient.auth.signUp.email({ email, password, name: local.candidateName || 'Candidato' });
      const err = authError(result);
      if (err) throw new Error(err);
      await getSession();
      if (currentUser) await reconcile();
      else setStatus('Conta criada. Entre com seu e-mail e senha.', 'ok');
    } catch (error) {
      setStatus(`Não foi possível criar a conta · ${error.message}`, 'error');
    }
  };

  document.getElementById('neonSignOut').onclick = async () => {
    try { await neonClient.auth.signOut(); } catch {}
    currentUser = null;
    clearInterval(pollTimer);
    renderAuthState();
  };
  document.getElementById('neonSyncNow').onclick = () => reconcile();
  document.getElementById('neonPull').onclick = () => pullFromNeon({ force: true });
  document.getElementById('neonPush').onclick = () => pushToNeon({ force: true });
  document.getElementById('neonConflictPull').onclick = () => pullFromNeon({ force: true });
  document.getElementById('neonConflictPush').onclick = () => pushToNeon({ force: true });
}

async function bootNeon() {
  injectNeonUI();
  try {
    const { createClient } = await import(NEON_SDK_URL);
    neonClient = createClient({
      auth: { url: NEON_AUTH_URL },
      dataApi: { url: NEON_DATA_API_URL }
    });
    sdkReady = true;
    await getSession();
    if (currentUser) {
      await reconcile();
      clearInterval(pollTimer);
      pollTimer = setInterval(() => {
        if (!document.hidden && navigator.onLine) reconcile();
      }, 15000);
    }
  } catch (error) {
    setStatus(`Modo local · integração Neon indisponível (${error.message})`, 'error');
  }
}

// Remove apenas metadados obsoletos da implementação Vercel; o progresso do app não é tocado.
['transpetro_cloud_profile','transpetro_cloud_sync_key','transpetro_cloud_last_sync','transpetro_cloud_local_updated','transpetro_cloud_enabled'].forEach(key => localStorage.removeItem(key));
watchAppStorage();
window.addEventListener('online', () => currentUser && reconcile());
window.addEventListener('focus', () => currentUser && reconcile());
window.addEventListener('DOMContentLoaded', bootNeon);

window.TranspetroNeon = {
  pull: () => pullFromNeon({ force: true }),
  push: () => pushToNeon({ force: true }),
  reconcile,
  status: () => ({ sdkReady, authenticated: Boolean(currentUser), deviceId })
};
