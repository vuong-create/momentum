import { useEffect, useState } from 'react';
import { getAvailableBuild } from './updateService';
import './app-install.css';

export default function AppUpdateNotice() {
  const [available, setAvailable] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(null);
  useEffect(() => {
    if (!import.meta.env.PROD) return;
    let active = true;
    let lastCheck = 0;
    let pending: AbortController | undefined;
    async function check() {
      if (document.visibilityState !== 'visible' || Date.now() - lastCheck < 60_000) return;
      lastCheck = Date.now();
      pending?.abort();
      const controller = new AbortController();
      pending = controller;
      const timeout = window.setTimeout(() => controller.abort(), 10_000);
      const version = await getAvailableBuild(import.meta.env.VITE_MOMENTUM_BUILD_ID, controller.signal);
      window.clearTimeout(timeout);
      if (active) setAvailable(version);
    }
    void check();
    const timer = window.setInterval(() => void check(), 5 * 60_000);
    const onVisible = () => void check();
    window.addEventListener('focus', onVisible);
    document.addEventListener('visibilitychange', onVisible);
    return () => { active = false; pending?.abort(); window.clearInterval(timer); window.removeEventListener('focus', onVisible); document.removeEventListener('visibilitychange', onVisible); };
  }, []);
  if (!available || available === dismissed) return null;
  return <aside className="app-update-notice" aria-label="Momentum update" role="status">
    <div><strong>Update available</strong><p>Save any open edits before reloading.</p></div>
    <button type="button" onClick={() => setDismissed(available)}>Later</button>
    <button type="button" onClick={() => { if (window.confirm('Reload Momentum now? Save any unfinished edits first. Saved records will remain on this device.')) window.location.reload(); }}>Reload app</button>
  </aside>;
}
