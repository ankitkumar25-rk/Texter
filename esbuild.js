const esbuild = require('esbuild');

const isProduction = process.argv.includes('--production');
const isWatch = process.argv.includes('--watch');

async function build() {
  const options = {
    entryPoints: ['src/extension.ts'],
    bundle: true,
    format: 'cjs',
    minify: isProduction,
    sourcemap: !isProduction,
    sourcesContent: false,
    platform: 'node',
    outfile: 'dist/extension.js',
    external: ['vscode', 'canvas', '@napi-rs/canvas', 'pdfjs-dist', 'pdfjs-dist/*'],
    logLevel: 'info',
  };

  if (isWatch) {
    const ctx = await esbuild.context(options);
    await ctx.watch();
    console.log('Watching for changes...');
  } else {
    await esbuild.build(options);
    console.log('Build complete.');
  }
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
