const fs = require('fs');
const path = require('path');

// CONFIGURACIÓN - AJUSTA ESTAS RUTAS SEGÚN TU PROYECTO
const SRC_DIR = path.join(__dirname, 'src');
const OUTPUT_FILE = path.join(__dirname, 'frontend_codebase.md');

// Extensiones de archivos que queremos extraer
const ALLOWED_EXTENSIONS = ['.html','.ts','.scss','.css','.json', '.env'];

// Archivos y carpetas a ignorar
const IGNORE_PATTERNS = [
  'node_modules',
  'dist',
  '.git',
  'package-lock.json',
  'extract-code.js',
  'frontend_codebase.md',
  'test',
  'spec.ts',
];

function shouldIgnore(filePath) {
  return IGNORE_PATTERNS.some(pattern => filePath.includes(pattern));
}

function shouldInclude(filePath) {
  const ext = path.extname(filePath);
  return ALLOWED_EXTENSIONS.includes(ext) && !shouldIgnore(filePath);
}

function getAllFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (!shouldIgnore(fullPath)) {
        getAllFiles(fullPath, files);
      }
    } else if (shouldInclude(fullPath)) {
      files.push(fullPath);
    }
  }
  return files;
}

function extractCodebase() {
  console.log('🔍 Escaneando proyecto...');

  if (!fs.existsSync(SRC_DIR)) {
    console.error(`❌ No se encontró la carpeta src en: ${SRC_DIR}`);
    console.log('💡 Ajusta la constante SRC_DIR en este script.');
    process.exit(1);
  }

  const files = getAllFiles(SRC_DIR);

  // Agregar archivos raíz importantes
  const rootFiles = ['package.json', 'tsconfig.json', 'angular.json', '.env'];
  for (const rf of rootFiles) {
    const rfPath = path.join(__dirname, rf);
    if (fs.existsSync(rfPath)) {
      files.unshift(rfPath);
    }
  }

  console.log(`📁 Se encontraron ${files.length} archivos.`);

  let mdContent = `# ERP Arcas - Código Fuente Completo\n`;
  mdContent += `> Generado automáticamente el ${new Date().toLocaleString()}\n\n`;
  mdContent += `---\n\n`;

  for (const file of files) {
    const relativePath = path.relative(__dirname, file);
    const ext = path.extname(file);
    let lang = 'typescript';
    if (ext === '.json') lang = 'json';
    if (ext === '.env') lang = 'env';

    const content = fs.readFileSync(file, 'utf-8');

    mdContent += `## 📄 ${relativePath}\n\n`;
    mdContent += `\`\`\`${lang}\n`;
    mdContent += content;
    mdContent += `\n\`\`\`\n\n`;
    mdContent += `---\n\n`;
  }

  fs.writeFileSync(OUTPUT_FILE, mdContent, 'utf-8');
  console.log(`✅ Archivo generado: ${OUTPUT_FILE}`);
  console.log(`📊 Tamaño: ${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(1)} KB`);
  console.log(`\n👉 Copia el contenido de ${OUTPUT_FILE} y pégalo en la conversación con la IA.`);
}

extractCodebase();