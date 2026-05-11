const fs = require('fs');
const path = require('path');

// ─── Leer .env manualmente (sin dependencias externas) ───────────
const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .filter((line) => line.trim() && !line.startsWith('#'))
    .forEach((line) => {
      const [key, ...rest] = line.split('=');
      process.env[key.trim()] = rest.join('=').trim();
    });
}

// ─── Inyectar en los archivos de environment de Angular ──────────
const apiUrl = process.env.API_URL || 'http://localhost:8080';

// environment.local.ts / environment.remote.ts: mismo origen + proxy; no sobrescribir aquí.
const targetPaths = [
  './src/environments/environment.ts',
  './src/environments/environment.development.ts',
];

targetPaths.forEach((targetPath) => {
  if (fs.existsSync(targetPath)) {
    let content = fs.readFileSync(targetPath, 'utf8');
    content = content.replace(/serverBaseUrl:\s*'.*?'/, `serverBaseUrl: '${apiUrl}'`);
    fs.writeFileSync(targetPath, content);
    console.log(`[set-env] ${targetPath} → serverBaseUrl: '${apiUrl}'`);
  }
});
