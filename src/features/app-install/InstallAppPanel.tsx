import './app-install.css';

export default function InstallAppPanel() {
  return <section className="settings-panel app-install-panel" aria-label="Install Momentum">
    <div className="settings-panel-heading"><div><span className="text-label">Desktop app</span><h2>Momentum in your Dock</h2></div></div>
    <p>Open Momentum in its own window, without VS Code or a running terminal.</p>
    <dl>
      <dt>Safari · macOS Sonoma 14 or later</dt><dd>Open this address in Safari, then choose File → Add to Dock. Name it Momentum.</dd>
      <dt>Chrome or Edge</dt><dd>Use the browser’s install app option in the address bar or browser menu. Installation controls vary by browser.</dd>
    </dl>
    <p className="app-install-data-note"><strong>Moving from localhost?</strong> Install first, then open the Dock app and restore your full backup there. Safari web apps have separate storage. Verify your records before leaving your old app.</p>
    <p>Your data stays in this browser or installed app on this device. Hosting is not cloud sync or a backup. Keep exporting backups, and don’t clear website data.</p>
    <p>Internet is required to load this version. Approved releases are available on your next reload; an open app periodically checks for updates and never reloads automatically.</p>
  </section>;
}
