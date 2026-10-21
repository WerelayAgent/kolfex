const fs = require('fs');
const path = require('path');

const outDir = path.join('.vercel', 'output');
const staticDir = path.join(outDir, 'static');

// Clean and recreate .vercel/output
if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true, force: true });
}
fs.mkdirSync(staticDir, { recursive: true });

// Write Build Output API v3 config.json
fs.writeFileSync(
  path.join(outDir, 'config.json'),
  JSON.stringify({ version: 3 }, null, 2)
);

// Items to copy into static output
const items = [
  'index.html',
  'icon.svg',
  'brand',
  'icons',
  'markets',
  'kols',
  'points',
  'how-it-works',
  'docs',
  '_next'
];

for (const item of items) {
  if (fs.existsSync(item)) {
    const dest = path.join(staticDir, item);
    fs.cpSync(item, dest, { recursive: true });
    console.log(`Copied ${item} -> ${dest}`);
  }
}

console.log('Build Output API v3 successfully generated!');
