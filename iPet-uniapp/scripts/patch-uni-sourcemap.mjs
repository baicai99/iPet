import fs from 'node:fs'
import path from 'node:path'

const targetPath = path.resolve(
  process.cwd(),
  'node_modules/@dcloudio/uni-cli-shared/dist/vite/plugins/sourceMap.js',
)

if (!fs.existsSync(targetPath)) {
  process.exit(0)
}

const original = fs.readFileSync(targetPath, 'utf8')

if (
  original.includes("name: 'uni:sourcemap'") &&
  original.includes('typeof outputChunk.code ===')
) {
  process.exit(0)
}

const before = `                const jsFile = file.replace('.js.map', '.js');
                const outputChunk = bundle[jsFile];
                if (outputChunk) {
                    outputChunk.code = outputChunk.code.replace(/\\/\\/# sourceMappingURL=.*/, \`//# sourceMappingURL=\${(0, utils_1.normalizePath)(path_1.default.relative(file, options.relativeSourceMapDir))}/\${file}\`);
                }
                delete bundle[file];`

const after = `                const jsFile = file.replace('.js.map', '.js');
                const outputChunk = bundle[jsFile];
                const normalizedMapDir = (0, utils_1.normalizePath)(path_1.default.relative(file, options.relativeSourceMapDir));
                const sourceMappingURL = \`//# sourceMappingURL=\${normalizedMapDir}/\${file}\`;
                if (outputChunk && typeof outputChunk.code === 'string') {
                    outputChunk.code = outputChunk.code.replace(/\\/\\/# sourceMappingURL=.*/, sourceMappingURL);
                }
                else if (outputChunk && typeof outputChunk.source === 'string') {
                    outputChunk.source = outputChunk.source.replace(/\\/\\/# sourceMappingURL=.*/, sourceMappingURL);
                }
                delete bundle[file];`

if (!original.includes(before)) {
  console.error(
    `[postinstall] Failed to patch uni:sourcemap plugin: expected snippet not found.\n` +
      `Target: ${targetPath}\n` +
      `You may need to update the patch script for the current @dcloudio/uni-cli-shared version.`,
  )
  process.exit(1)
}

const patched = original.replace(before, after)
fs.writeFileSync(targetPath, patched, 'utf8')
console.log('[postinstall] Patched uni:sourcemap plugin to guard missing outputChunk.code')

