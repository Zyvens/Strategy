const CLOUD_PROFILE_KEY = 'transpetro_cloud_profile';
const CLOUD_SYNC_KEY = 'transpetro_cloud_sync_key';
const CLOUD_LAST_SYNC = 'transpetro_cloud_last_sync';
const CLOUD_ENABLED = 'transpetro_cloud_enabled';
const APP_STORAGE_KEY = 'transpetro_strategy_v1';

const cloud = {
  enabled: localStorage.getItem(CLOUD_ENABLED) === '1',
  profile: localStorage.getItem(CLOUD_PROFILE_KEY) || 'vitor',
  syncKey: localStorage.getItem(CLOUD_SYNC_KEY) || '',
  timer: null,
  syncing: false,
  lastLocalSnapshot: localStorage.getItem(APP_STORAGE_KEY) || '',
};

function cloudStatus(message, kind = 'muted') {
  const el = document.getElementById('cloudStatus');
  if (!el) return;
  el.textContent = message;
  el.dataset.kind = kind;
}

function cloudHeaders() {
  return {
    'content-type': 'application/json',
    'x-sync-key': cloud.syncKey
  };
}

async function cloudRequest(method, body) {
  const profile = encodeURIComponent(cloud.profile || 'vitor');
  const response = await fetch(`/api/state?profile=${profile}`, {
    method,
    headers: cloudHeaders(),
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store'
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
  return data;
}

async function pullCloudState({ force = false } = {}) {
  if (!cloud.enabled || !cloud.syncKey || cloud.syncing) return false;
  cloud.syncing = true;
  cloudStatus('Sincronizando da nuvem…');
  try {
    const result = await cloudRequest('GET');
    if (!result.found) {
      cloudStatus('Nuvem vazia — enviando este dispositivo…');
      await pushCloudState({ force: true });
      return true;
    }

    const remote = JSON.stringify(result.state || {});
    const local = localStorage.getItem(APP_STORAGE_KEY) || '{}';
    const lastSync = localStorage.getItem(CLOUD_LAST_SYNC) || '';
    const remoteUpdated = result.updatedAt || '';

    if (force || !lastSync || remoteUpdated > lastSync || local === '{}' || local === '') {
      localStorage.setItem(APP_STORAGE_KEY, remote);
      cloud.lastLocalSnapshot = remote;
      localStorage.setItem(CLOUD_LAST_SYNC, remoteUpdated || new Date().toISOString());
      cloudStatus(`Atualizado da nuvem · ${new Date(remoteUpdated || Date.now()).toLocaleString('pt-BR')}`, 'ok');
      window.dispatchEvent(new CustomEvent('transpetro-cloud-loaded', { detail: result.state }));
      setTimeout(() => window.location.reload(), 120);
      return true;
    }

    cloudStatus('Dados locais já estão atualizados', 'ok');
    return false;
  } catch (error) {
    cloudStatus(`Falha ao carregar: ${error.message}`, 'error');
    return false;
  } finally {
    cloud.syncing = false;
  }
}

async function pushCloudState({ force = false } = {}) {
  if (!cloud.enabled || !cloud.syncKey) return false;
  if (cloud.syncing && !force) return false;
  const raw = localStorage.getItem(APP_STORAGE_KEY);
  if (!raw) return false;
  if (!force && raw === cloud.lastLocalSnapshot) return false;

  cloud.syncing = true;
  cloudStatus('Salvando na nuvem…');
  try {
    const state = JSON.parse(raw);
    const result = await cloudRequest('PUT', { state });
    cloud.lastLocalSnapshot = raw;
    localStorage.setItem(CLOUD_LAST_SYNC, result.updatedAt || new Date().toISOString());
    cloudStatus(`Salvo na nuvem · ${new Date(result.updatedAt || Date.now()).toLocaleString('pt-BR')}`, 'ok');
    return true;
  } catch (error) {
    cloudStatus(`Offline/local · ${error.message}`, 'error');
    return false;
  } finally {
    cloud.syncing = false;
  }
}

function scheduleCloudPush() {
  if (!cloud.enabled || !cloud.syncKey) return;
  clearTimeout(cloud.timer);
  cloud.timer = setTimeout(() => pushCloudState(), 900);
}

function watchLocalStorageChanges() {
  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function(key, value) {
    originalSetItem.apply(this, arguments);
    if (this === localStorage && key === APP_STORAGE_KEY) scheduleCloudPush();
  };

  window.addEventListener('storage', event => {
    if (event.key === APP_STORAGE_KEY) scheduleCloudPush();
  });

  setInterval(() => {
    const now = localStorage.getItem(APP_STORAGE_KEY) || '';
    if (now !== cloud.lastLocalSnapshot) scheduleCloudPush();
  }, 2500);
}

function injectCloudUI() {
  const config = document.getElementById('config');
  if (!config || document.getElementById('cloudSyncCard')) return;

  const card = document.createElement('div');
  card.className = 'card';
  card.id = 'cloudSyncCard';
  card.innerHTML = `
    <span class="eyebrow">Vercel Cloud Sync</span>
    <h2>Sincronização entre dispositivos</h2>
    <p class="muted">Use o mesmo perfil e a mesma chave no PC e no celular. O app continua funcionando offline e envia as alterações quando a conexão voltar.</p>
    <div class="field">
      <label>Perfil na nuvem</label>
      <input id="cloudProfile" value="${cloud.profile.replace(/"/g, '&quot;')}" placeholder="vitor">
    </div>
    <div class="field">
      <label>Chave de sincronização</label>
      <input id="cloudKey" type="password" value="${cloud.syncKey.replace(/"/g, '&quot;')}" placeholder="mesma SYNC_KEY configurada na Vercel">
    </div>
    <label style="display:flex;align-items:center;gap:9px;margin:12px 0">
      <input id="cloudEnabled" type="checkbox" ${cloud.enabled ? 'checked' : ''}>
      <b>Ativar sincronização em nuvem</b>
    </label>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn primary" id="cloudSave">Salvar e sincronizar</button>
      <button class="btn" id="cloudPull">Baixar da nuvem</button>
      <button class="btn" id="cloudPush">Enviar este dispositivo</button>
    </div>
    <p class="footer-note" id="cloudStatus">${cloud.enabled ? 'Sincronização pronta.' : 'Sincronização desativada.'}</p>
  `;

  const grid = config.querySelector('.grid2') || config;
  grid.appendChild(card);

  document.getElementById('cloudSave').onclick = async () => {
    cloud.profile = (document.getElementById('cloudProfile').value || 'vitor').trim();
    cloud.syncKey = document.getElementById('cloudKey').value;
    cloud.enabled = document.getElementById('cloudEnabled').checked;
    localStorage.setItem(CLOUD_PROFILE_KEY, cloud.profile);
    localStorage.setItem(CLOUD_SYNC_KEY, cloud.syncKey);
    localStorage.setItem(CLOUD_ENABLED, cloud.enabled ? '1' : '0');
    if (!cloud.enabled) {
      cloudStatus('Sincronização desativada.');
      return;
    }
    if (!cloud.syncKey) {
      cloudStatus('Informe a chave configurada na Vercel.', 'error');
      return;
    }
    const result = await cloudRequest('GET').catch(() => null);
    if (result?.found) await pullCloudState({ force: true });
    else await pushCloudState({ force: true });
  };

  document.getElementById('cloudPull').onclick = () => pullCloudState({ force: true });
  document.getElementById('cloudPush').onclick = () => pushCloudState({ force: true });
}

window.TranspetroCloud = {
  pull: pullCloudState,
  push: pushCloudState,
  status: () => ({ ...cloud, syncKey: cloud.syncKey ? '***' : '' })
};

watchLocalStorageChanges();
window.addEventListener('DOMContentLoaded', async () => {
  injectCloudUI();
  if (cloud.enabled && cloud.syncKey) {
    await pullCloudState();
  }
});
