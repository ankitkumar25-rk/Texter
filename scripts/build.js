const esbuild = require('esbuild');
const path = require('path');

const isProduction = process.argv.includes('--production');

async function buildAll() {
  console.log(`Building Texter extension (Production: ${isProduction})...`);

  // Build extension bundle
  await esbuild.build({
    entryPoints: [path.join(__dirname, '../src/extension.ts')],
    bundle: true,
    format: 'cjs',
    minify: isProduction,
    sourcemap: !isProduction,
    platform: 'node',
    outfile: path.join(__dirname, '../dist/extension.js'),
    external: ['vscode', 'canvas', '@napi-rs/canvas'],
    target: 'node18',
    logLevel: 'info',
  });

  // Build test runner bundle
  await esbuild.build({
    entryPoints: [path.join(__dirname, '../test/runTests.ts')],
    bundle: true,
    format: 'cjs',
    minify: false,
    sourcemap: true,
    platform: 'node',
    outfile: path.join(__dirname, '../dist/test/runTests.js'),
    external: ['vscode', 'canvas', '@napi-rs/canvas'],
    target: 'node18',
    logLevel: 'info',
  });

  console.log('Build completed successfully.');
}

buildAll().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
