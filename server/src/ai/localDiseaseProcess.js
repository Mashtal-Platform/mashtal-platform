const path = require('path');
const { spawn } = require('child_process');
const { DISEASE_URL } = require('../ai/services/localDiseaseService');

let child = null;
let starting = null;

function getPythonCmd() {
  return process.env.LOCAL_DISEASE_PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
}

async function waitUntilReady(timeoutMs = 180000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${DISEASE_URL}/health`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        const data = await res.json();
        if (data?.ready) return true;
        // Server up but still loading weights
      }
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  return false;
}

/**
 * Start the local disease FastAPI sidecar if not already running.
 * Non-blocking for Express boot; waits in background until ready.
 */
function startLocalDiseaseSidecar() {
  if (process.env.LOCAL_DISEASE_AUTOSTART === '0' || process.env.LOCAL_DISEASE_AUTOSTART === 'false') {
    console.log('[LocalDisease] Autostart disabled (LOCAL_DISEASE_AUTOSTART=false)');
    return;
  }

  if (child || starting) return;

  starting = (async () => {
    // Already running?
    try {
      const res = await fetch(`${DISEASE_URL}/health`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) {
        console.log('[LocalDisease] Sidecar already running at', DISEASE_URL);
        starting = null;
        return;
      }
    } catch {
      /* need to start */
    }

    const script = path.join(__dirname, '..', '..', 'ai-disease', 'predict_server.py');
    const py = getPythonCmd();
    console.log(`[LocalDisease] Starting sidecar: ${py} ${script}`);

    child = spawn(py, ['-u', script], {
      cwd: path.join(__dirname, '..', '..'),
      env: {
        ...process.env,
        LOCAL_DISEASE_HOST: '127.0.0.1',
        LOCAL_DISEASE_PORT: process.env.LOCAL_DISEASE_PORT || '8765',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });

    child.stdout.on('data', (buf) => {
      String(buf)
        .split(/\r?\n/)
        .filter(Boolean)
        .forEach((line) => console.log(line));
    });
    child.stderr.on('data', (buf) => {
      String(buf)
        .split(/\r?\n/)
        .filter(Boolean)
        .forEach((line) => console.error(line));
    });
    child.on('exit', (code, signal) => {
      console.warn(`[LocalDisease] Sidecar exited code=${code} signal=${signal}`);
      child = null;
      starting = null;
    });

    const ready = await waitUntilReady(300000);
    if (ready) {
      console.log('[LocalDisease] Sidecar ready at', DISEASE_URL);
    } else {
      console.warn(
        '[LocalDisease] Sidecar did not become ready in time. Image disease detection may fail until it loads.'
      );
    }
    starting = null;
  })().catch((err) => {
    console.error('[LocalDisease] Failed to start sidecar:', err?.message || err);
    starting = null;
  });
}

function stopLocalDiseaseSidecar() {
  if (child) {
    try {
      child.kill();
    } catch {
      /* ignore */
    }
    child = null;
  }
}

module.exports = {
  startLocalDiseaseSidecar,
  stopLocalDiseaseSidecar,
  waitUntilReady,
};
