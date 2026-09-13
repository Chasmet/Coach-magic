const fs = require('fs');
const path = require('path');

const root = process.cwd();
const out = path.join(root, 'www');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const version = process.env.VERSION_NAME || pkg.version || '1.0.0';
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

for (const file of ['index.html', 'manifest.webmanifest', 'service-worker.js', 'icon.svg', 'settings-update.js']) {
  fs.copyFileSync(path.join(root, file), path.join(out, file));
}
fs.writeFileSync(path.join(out, 'app-version.js'), `window.COACH_MAGIC_VERSION=${JSON.stringify(version)};\n`);

const indexPath = path.join(out, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
const updaterTags = '<script src="./app-version.js"></script><script src="./settings-update.js"></script>';
if (!html.includes('settings-update.js')) {
  html = html.replace('</body>', `${updaterTags}</body>`);
  fs.writeFileSync(indexPath, html);
}
console.log(`Web assets prepared in www/ - Coach Magic ${version}`);
