import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getFiles(dir, files = []) {
  const fileList = fs.readdirSync(dir);
  for (const file of fileList) {
    const name = path.join(dir, file);
    if (fs.statSync(name).isDirectory()) {
      if (!name.includes('node_modules') && !name.includes('.git')) {
        getFiles(name, files);
      }
    } else {
      if (name.endsWith('.js')) {
        files.push(name);
      }
    }
  }
  return files;
}

const allFiles = getFiles(path.join(__dirname, 'src'));
console.log('Found ' + allFiles.length + ' files');

allFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Replace const { a, b } = require('...')
  content = content.replace(/const\s+\{\s*([^}]+)\s*\}\s*=\s*require\((['"])(.*?)\2\);?/g, (match, imports, quote, reqPath) => {
    const p = reqPath.startsWith('.') && !reqPath.endsWith('.js') ? reqPath + '.js' : reqPath;
    return `import { ${imports} } from '${p}';`;
  });

  // Replace const a = require('...')
  content = content.replace(/const\s+([a-zA-Z0-9_]+)\s*=\s*require\((['"])(.*?)\2\);?/g, (match, imp, quote, reqPath) => {
    const p = reqPath.startsWith('.') && !reqPath.endsWith('.js') ? reqPath + '.js' : reqPath;
    return `import ${imp} from '${p}';`;
  });

  // Replace require('...') (side-effect import)
  content = content.replace(/require\((['"])(.*?)\1\);?/g, (match, quote, reqPath) => {
    if (match.includes('const') || match.includes('let') || match.includes('var') || match.includes('=')) return match; // fallback
    const p = reqPath.startsWith('.') && !reqPath.endsWith('.js') ? reqPath + '.js' : reqPath;
    return `import '${p}';`;
  });

  // Replace module.exports = { a, b }
  content = content.replace(/module\.exports\s*=\s*\{\s*([^}]+)\s*\};?/g, (match, exports) => {
    return `export { ${exports} };`;
  });

  // Replace module.exports.connect = ... with export const connect = ...
  content = content.replace(/module\.exports\.([a-zA-Z0-9_]+)\s*=\s*/g, 'export const $1 = ');

  // Replace module.exports = x
  content = content.replace(/module\.exports\s*=\s*(.*?);?/g, (match, exp) => {
    if (exp.startsWith('{')) return match; // Handled above
    return `export default ${exp};`;
  });

  fs.writeFileSync(file, content, 'utf8');
});

console.log('Migration complete');
