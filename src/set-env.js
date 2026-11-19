const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
try {
  require('dotenv').config({ path: envPath, override: true });
} catch (e) {
  console.warn('[set-env] Warning: could not load dotenv:', e.message);
}

const projectRoot = path.resolve(__dirname, '..');
const targetPath = path.join(projectRoot, 'src/environments/environment.ts');

const apiUrl = (process.env.API_URL || 'http://localhost:3000/api').trim();
const production = process.env.PRODUCTION === 'true' || process.env.NODE_ENV === 'production';
const currencySymbol = process.env.CURRENCY_SYMBOL || 'L ';
const validarSession = process.env.VALIDAR_SESSION || 'N';
const empresaId = parseInt(process.env.EMPRESA_ID || '2', 10);

const envConfigFile = `export const environment = {
  production: ${production},
  apiUrl: '${apiUrl}',
  currencySymbol: '${currencySymbol}',
  VALIDAR_SESSION: '${validarSession}',
  empresaId: ${empresaId},
};
`;

fs.writeFileSync(targetPath, envConfigFile);
console.log(`[set-env] .env leido correctamente desde: ${envPath}`);
console.log(`[set-env] API_URL establecida en environment.ts -> ${apiUrl}`);
console.log(`environment generated -> ${targetPath}`);
