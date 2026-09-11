const fs = require('fs');
const path = require('path');

function verifyRelease() {
  console.log('Verifying release requirements for Texter extension...');

  const pkgJsonPath = path.join(__dirname, '../package.json');
  if (!fs.existsSync(pkgJsonPath)) {
    throw new Error('package.json missing');
  }

  const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));

  // 1. Check commands
  const requiredCommands = [
    'pdf-to-text.convertFile',
    'pdf-to-text.convertFolder',
    'pdf-to-text.convertWorkspace',
  ];

  const commandIds = (pkg.contributes?.commands || []).map((c) => c.command);
  for (const req of requiredCommands) {
    if (!commandIds.includes(req)) {
      throw new Error(`Missing required command contribution: ${req}`);
    }
  }

  // 2. Check configuration settings
  const requiredConfigs = [
    'pdfToText.ocrAllPages',
    'pdfToText.ocrConfidenceThreshold',
    'pdfToText.outputSuffix',
    'pdfToText.preservePageMarkers',
  ];

  const configKeys = Object.keys(pkg.contributes?.configuration?.properties || {});
  for (const req of requiredConfigs) {
    if (!configKeys.includes(req)) {
      throw new Error(`Missing required configuration property: ${req}`);
    }
  }

  // 3. Check icon asset
  const iconPath = path.join(__dirname, '..', pkg.icon);
  if (!fs.existsSync(iconPath)) {
    throw new Error(`Icon file missing at ${pkg.icon}`);
  }

  // 4. Check LICENSE and README
  const licensePath = path.join(__dirname, '../LICENSE');
  if (!fs.existsSync(licensePath)) {
    throw new Error('LICENSE file missing');
  }

  const readmePath = path.join(__dirname, '../README.md');
  if (!fs.existsSync(readmePath)) {
    throw new Error('README.md file missing');
  }

  console.log('All release checks passed successfully. The extension is production ready.');
}

verifyRelease();
