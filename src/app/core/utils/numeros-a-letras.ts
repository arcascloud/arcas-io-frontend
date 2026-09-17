/**
 * Convierte un número a letras en español hondureño.
 * Ejemplo: 1250.50 → "MIL DOSCIENTOS CINCUENTA Y 50/100 LEMPIRAS"
 */
export function numeroALetras(num: number): string {
  if (num === 0) return 'CERO LEMPIRAS';

  const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const especiales = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
  const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

  function convertirBloque(n: number): string {
    if (n === 0) return '';
    if (n === 100) return 'CIEN';

    let resultado = '';

    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;

    if (c > 0) resultado += centenas[c] + ' ';
    if (d >= 2) {
      resultado += decenas[d];
      if (u > 0) resultado += ' Y ' + unidades[u];
    } else if (d === 1) {
      resultado += especiales[u];
    } else if (u > 0) {
      resultado += unidades[u];
    }

    return resultado.trim();
  }

  const parteEntera = Math.floor(num);
  const parteDecimal = Math.round((num - parteEntera) * 100);

  let enteroLetras = '';
  const millones = Math.floor(parteEntera / 1000000);
  const miles = Math.floor((parteEntera % 1000000) / 1000);
  const resto = parteEntera % 1000;

  if (millones === 1) {
    enteroLetras += 'UN MILLÓN ';
  } else if (millones > 1) {
    enteroLetras += convertirBloque(millones) + ' MILLONES ';
  }

  if (miles === 1) {
    enteroLetras += 'MIL ';
  } else if (miles > 1) {
    enteroLetras += convertirBloque(miles) + ' MIL ';
  }

  if (resto > 0) {
    enteroLetras += convertirBloque(resto);
  }

  enteroLetras = enteroLetras.trim() || 'CERO';

  const decimalStr = String(parteDecimal).padStart(2, '0');

  return `${enteroLetras} ${decimalStr}/100 LEMPIRAS`;
}
