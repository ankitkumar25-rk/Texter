const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function packageExtension() {
  console.log('Packaging PDF to Text Converter (Texter) extension...');

  // 1. Run production bundle
  console.log('Running production bundle build...');
  execSync('node scripts/build.js --production', { stdio: 'inherit' });

  // 2. Check if output dist file exists
  const distFile = path.join(__dirname, '../dist/extension.js');
  if (!fs.existsSync(distFile)) {
    throw new Error('dist/extension.js not found after build.');
  }

  const stat = fs.statSync(distFile);
  console.log(`Bundle created successfully: ${(stat.size / 1024).toFixed(2)} KB`);

  console.log('Ready for vsce package execution: npx @vscode/vsce package');
}

packageExtension().catch((err) => {
  console.error('Packaging failed:', err);
  process.exit(1);
});
