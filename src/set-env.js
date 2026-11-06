const fs = require('fs');
const path = require('path');
try {
  require('dotenv').config({ path: path.join(__dirname, '.env'), override: true });
} catch (_) { }

const projectRoot = path.resolve(__dirname, '..');
const targetPath = path.join(projectRoot, 'src/environments/environment.ts');

const direct = (process.env.API_URL || '').trim();
const provider = (process.env.API_PROVIDER || '').trim().toUpperCase();
const fromProvider = provider ? (process.env[`${provider}_API_URL`] || '').trim() : '';
let apiUrl = direct || fromProvider || 'https://arcas-io-backend.onrender.com/api';
if (apiUrl.includes('${')) {
  apiUrl = 'https://arcas-io-backend.onrender.com/api';
}

const production = process.env.PRODUCTION === 'true' || process.env.NODE_ENV === 'production';
const currencySymbol = process.env.CURRENCY_SYMBOL || 'L ';
const validarSession = process.env.VALIDAR_SESSION || 'N';
const empresaId = parseInt(process.env.EMPRESA_ID || '2', 10);

const envConfigFile = `export const environment = {\n  production: ${production},\n  apiUrl: '${apiUrl}',\n  currencySymbol: '${currencySymbol}',\n  VALIDAR_SESSION: '${validarSession}',\n  empresaId: ${empresaId},\n};\n`;

fs.writeFileSync(targetPath, envConfigFile);
console.log(`environment generated -> ${targetPath}`);
