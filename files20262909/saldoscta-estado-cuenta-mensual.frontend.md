# Frontend: estado de cuenta por mes con saldo acumulado

Regla (la tuya): saldo acumulado = suma con signo de los netos (Debe − Haber). El lado sale del signo:
positivo → (D), negativo → (C). `saldoTexto()` ya hace exactamente eso.

Por cada mes con movimientos:

- Saldo Acum = `saldoanterior` + netos de los meses anteriores
- Movimiento mes = Σ Debe − Σ Haber del mes
- Saldo actual = Saldo Acum + Movimiento mes (y pasa como Saldo Acum al mes siguiente)

Los meses sin movimientos no generan bloque, pero el acumulado sigue corriendo.

## 1. `catalogo-generico.ts`

Arriba, junto a los imports:

```ts
interface BloqueMes {
  periodo: number;
  mes: string;
  saldoAcum: string;
  movimientos: Record<string, any>[];
  movimientoMes: string;
  saldoActual: string;
}

const MESES_NOMBRE = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
```

Dentro de la clase, junto a `ecSaldoActual`:

```ts
/** Estado de cuenta por mes: Saldo Acum + partidas + Movimiento mes + Saldo actual */
bloquesMes(item: any): BloqueMes[] {
  const det = this.config()?.detalle;
  const data = this.detalleDe(item);
  if (!det || !data) return [];

  const r2 = (n: number) => Math.round(n * 100) / 100;
  let acum = Number(item?.[det.saldoKey]) || 0;

  const porPeriodo = new Map<number, Record<string, any>[]>();
  for (const m of data.movimientos) {
    const p = Number(m['periodo']);
    if (!porPeriodo.has(p)) porPeriodo.set(p, []);
    porPeriodo.get(p)!.push(m);
  }

  const bloques: BloqueMes[] = [];
  for (const p of [...porPeriodo.keys()].sort((a, b) => a - b)) {
    const movs = porPeriodo.get(p)!;
    const debito = movs.reduce((s, m) => s + (Number(m['debito']) || 0), 0);
    const credito = movs.reduce((s, m) => s + (Number(m['credito']) || 0), 0);
    const neto = r2(debito - credito);

    bloques.push({
      periodo: p,
      mes: MESES_NOMBRE[p - 1] ?? `Período ${p}`,
      saldoAcum: this.saldoTexto(acum),
      movimientos: movs,
      movimientoMes: this.saldoTexto(neto),
      saldoActual: this.saldoTexto(r2(acum + neto)),
    });
    acum = r2(acum + neto);
  }
  return bloques;
}
```

## 2. `catalogo-generico.html`

Dentro de `.ec-detalle`, reemplaza TODO el bloque `@else { ... }` (la tabla única, el separador y el pie) por:

```html
} @else {
  @let bloques = bloquesMes(item);

  @for (b of bloques; track b.periodo) {
    <div class="ec-mes mono">
      <div class="ec-negrita">{{ b.mes }}</div>
      <div>Saldo Acum: {{ b.saldoAcum }}</div>
    </div>

    <table class="ec-detalle-table mono">
      <thead>
        <tr>
          @for (col of config()!.detalle!.columnas; track col.key) {
            <th [class.text-right]="col.tipo === 'numero' || col.tipo === 'fecha'">{{ col.label }}</th>
          }
        </tr>
      </thead>
      <tbody>
        @for (mov of b.movimientos; track $index) {
          <tr>
            @for (col of config()!.detalle!.columnas; track col.key) {
              <td [class.text-right]="col.tipo === 'numero' || col.tipo === 'fecha'">{{ formatValor(mov, col) }}</td>
            }
          </tr>
        }
      </tbody>
    </table>

    <div class="ec-pie mono">Movimiento mes: {{ b.movimientoMes }}</div>
    <div class="ec-pie mono ec-negrita">Saldo actual: {{ b.saldoActual }}</div>
    <div class="ec-separador"></div>
  }

  @if (bloques.length === 0) {
    <div class="text-center mono">Sin movimientos.</div>
  }

  <div class="ec-pie mono">Saldo actual: {{ ecSaldoActual(item) }}</div>
}
```

(El pie final es el saldo al cierre del último mes con movimientos; coincide con el último bloque.)

## 3. `catalogo-generico.scss`

```scss
.ec-mes {
  display: flex;
  justify-content: space-between;
  margin: 0.75rem 0 0.25rem;
}
```

## Nota

`saldoTexto` es `private`; `bloquesMes` está en la misma clase, así que puede llamarlo sin cambios.
La grilla (Saldo Acum, Enero…Diciembre) no la toqué.
