export interface Banco {
  bancoId: number;
  descripcion: string;
  sn_activo: 'S' | 'N';
  Idsucursal: number;
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: string;
}

export interface BcoCta {
  bcoctasId: number;
  bancoId: number;
  nrocuenta: string;
  monedaId: number;
  sn_activo: 'S' | 'N';
  Idsucursal: number;
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: string;
}

export interface BcoMovimiento {
  bcomovimientosId: number;
  fecharegistro: string;
  bancoId: number;
  bcoctasId: number;
  moduloId: number;
  tipomov: 'DEPOSITO' | 'RETIRO' | 'TRANSFERENCIA' | 'PAGO' | 'NOTA_DEBITO' | 'NOTA_CREDITO';
  dc_debitocredito: 'D' | 'C';
  nroreferencia: string;
  nrochq: string;
  factordecambio: number;
  importe: number;
  concepto: string;
  sn_cotabilizada: 'S' | 'N';
  sn_doc_anulado: 'S' | 'N';
  fec_anulacion: string;
  partidaId: number;
  Idsucursal: number;
  empresaId: number;
  usuarioCreated: string;
  usuarioUpdated?: string;
  fechaUpdated?: string;
}

// ── Emisión de cheques ──────────────────────────────────────

export interface CompraPendientePago {
  compraId: number;
  nroreferencia: string;
  fecha: string;
  total: number;
  totalPagado?: number;
  saldo?: number;
  proveedorId: number;
  codproveedor: string;
  proveedorNombre: string;
  _selected?: boolean;
  /** Monto a pagar (HNL). Inicia vacío (undefined) para que el campo no muestre 0. */
  _montoPago?: number;
}

export interface ChequeEmitido {
  nrochq: string;
  proveedor: string;
  importe: number;
  concepto?: string;
  compraId?: number;
  facturas?: { compraId: number; nroReferencia: string; saldo: number }[];
}

export interface EmitirChequeResponse {
  mensaje: string;
  cheques: ChequeEmitido[];
}
