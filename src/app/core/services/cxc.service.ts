import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { CxcCliente, CxcMovimiento, CxcHistorico, CxcSaldoFavor } from '../models/cxc.models';

@Injectable({ providedIn: 'root' })
export class CxcService {
  private api = inject(ApiService);

  private clientes = '/cxc/clientes';

  /**
   * Obtiene la lista de clientes con paginación y búsqueda.
   * @param page - Número de página (default: 1)
   * @param limit - Cantidad de registros por página (default: 50)
   * @param q - Texto de búsqueda para filtrar clientes
   * @returns Observable con los datos paginados y el total de registros
   */
  getClientes(page?: number, limit?: number, q?: string): Observable<{ data: CxcCliente[], total: number }> {
    const p = page ?? 1;
    const l = limit ?? 50; // default grande para compatibilidad
    let url = `${this.clientes}?page=${p}&limit=${l}`;
    if (q && q.trim()) url += `&q=${encodeURIComponent(q.trim())}`;
    return this.api.get<{ data: CxcCliente[], total: number }>(url);
  }

  /**
   * Obtiene un cliente por su ID.
   * @param id - Identificador único del cliente
   * @returns Observable con el cliente encontrado
   */
  getCliente(id: number): Observable<CxcCliente> {
    return this.api.getOne<CxcCliente>(this.clientes, id);
  }

  /**
   * Crea un nuevo cliente en el sistema.
   * @param payload - Datos del cliente a crear
   * @returns Observable con el cliente creado
   */
  createCliente(payload: unknown): Observable<CxcCliente> {
    return this.api.post<CxcCliente>(this.clientes, payload);
  }

  /**
   * Actualiza los datos de un cliente existente.
   * @param id - Identificador único del cliente
   * @param payload - Datos a actualizar del cliente
   * @returns Observable con el cliente actualizado
   */
  updateCliente(id: number, payload: unknown): Observable<CxcCliente> {
    return this.api.put<CxcCliente>(this.clientes, id, payload);
  }

  /**
   * Obtiene todos los movimientos de cuentas por cobrar.
   * @returns Observable con la lista de movimientos CxC
   */
  getMovimientos(): Observable<CxcMovimiento[]> {
    return this.api.get<CxcMovimiento[]>('/cxc/movimientos');
  }

  /**
   * Obtiene los movimientos de CxC de un cliente específico.
   * @param clienteId - Identificador del cliente
   * @returns Observable con la lista de movimientos del cliente
   */
  getMovimientosByCliente(clienteId: number): Observable<CxcMovimiento[]> {
    return this.api.get<CxcMovimiento[]>(`/cxc/movimientos/cliente/${clienteId}`);
  }

  /**
   * Obtiene el histórico de transacciones de CxC.
   * @returns Observable con la lista de registros históricos
   */
  getHistorico(): Observable<CxcHistorico[]> {
    return this.api.get<CxcHistorico[]>('/cxc/historico');
  }

  /**
   * Obtiene el histórico de transacciones de un cliente específico.
   * @param clienteId - Identificador del cliente
   * @returns Observable con la lista de registros históricos del cliente
   */
  getHistoricoByCliente(clienteId: number): Observable<CxcHistorico[]> {
    return this.api.get<CxcHistorico[]>(`/cxc/historico/cliente/${clienteId}`);
  }

  /**
   * Obtiene los saldos a favor registrados en CxC.
   * @returns Observable con la lista de saldos a favor
   */
  getSaldoFavor(): Observable<CxcSaldoFavor[]> {
    return this.api.get<CxcSaldoFavor[]>('/cxc/saldo-favor');
  }

  /**
   * Obtiene todos los préstamos registrados en CxC.
   * @returns Observable con la lista de préstamos
   */
  getPrestamos(): Observable<any[]> {
    return this.api.get<any[]>('/cxc/prestamos');
  }

  /**
   * Obtiene los préstamos de un cliente específico.
   * @param clienteId - Identificador del cliente
   * @returns Observable con la lista de préstamos del cliente
   */
  getPrestamosByCliente(clienteId: number): Observable<any[]> {
    return this.api.get<any[]>(`/cxc/prestamos/cliente/${clienteId}`);
  }

  /**
   * Obtiene los parientes registrados de los clientes.
   * @returns Observable con la lista de parientes
   */
  getParientes(): Observable<any[]> {
    return this.api.get<any[]>('/cxc/parientes');
  }

  /**
   * Obtiene los parientes de un cliente específico.
   * @param clienteId - Identificador del cliente
   * @returns Observable con la lista de parientes del cliente
   */
  getParientesByCliente(clienteId: number): Observable<any[]> {
    return this.api.get<any[]>(`/cxc/parientes/cliente/${clienteId}`);
  }

  /**
   * Obtiene las referencias personales de los clientes.
   * @returns Observable con la lista de referencias
   */
  getReferencias(): Observable<any[]> {
    return this.api.get<any[]>('/cxc/clientes-ref');
  }

  /**
   * Obtiene las referencias personales de un cliente específico.
   * @param clienteId - Identificador del cliente
   * @returns Observable con la lista de referencias del cliente
   */
  getReferenciasByCliente(clienteId: number): Observable<any[]> {
    return this.api.get<any[]>(`/cxc/clientes-ref/cliente/${clienteId}`);
  }

  /**
   * Crea un nuevo registro en el histórico de CxC.
   * @param payload - Datos del registro histórico a crear
   * @returns Observable con el registro histórico creado
   */
  createHistorico(payload: unknown): Observable<CxcHistorico> {
    return this.api.post<CxcHistorico>('/cxc/historico', payload);
  }

  /**
   * Crea un nuevo movimiento de CxC.
   * @param payload - Datos del movimiento a crear
   * @returns Observable con el movimiento creado
   */
  createMovimiento(payload: unknown): Observable<any> {
    return this.api.post<any>('/cxc/movimientos', payload);
  }

  /**
   * Crea un nuevo préstamo en CxC.
   * @param payload - Datos del préstamo a crear
   * @returns Observable con el préstamo creado
   */
  createPrestamo(payload: unknown): Observable<any> {
    return this.api.post<any>('/cxc/prestamos', payload);
  }

  /**
   * Crea una nueva referencia personal para un cliente.
   * @param payload - Datos de la referencia a crear
   * @returns Observable con la referencia creada
   */
  createReferencia(payload: unknown): Observable<any> {
    return this.api.post<any>('/cxc/clientes-ref', payload);
  }

  /**
   * Crea un nuevo pariente registrado para un cliente.
   * @param payload - Datos del pariente a crear
   * @returns Observable con el pariente creado
   */
  createPariente(payload: unknown): Observable<any> {
    return this.api.post<any>('/cxc/parientes', payload);
  }

  /**
   * Crea un nuevo registro de plan de pago de préstamo.
   * @param payload - Datos del plan de pago a crear
   * @returns Observable con el registro creado
   */
  createPrestamoPP(payload: unknown): Observable<any> {
    return this.api.post<any>('/cxc/prestamo-pp', payload);
  }

  /**
   * Obtiene el plan de pago de un préstamo específico.
   * @param prestamoId - Identificador del préstamo
   * @returns Observable con la lista de cuotas del plan de pago
   */
  getPrestamoPPByPrestamo(prestamoId: number): Observable<any[]> {
    return this.api.get<any[]>(`/cxc/prestamo-pp?prestamoId=${prestamoId}`);
  }

  /**
   * Obtiene la antigüedad de saldos de todos los clientes.
   * Muestra saldos categorizados por antigüedad: corriente, 30, 60 y 90+ días.
   * @returns Observable con la lista de antigüedad de saldos
   */
  getAntiguedadSaldos(): Observable<any[]> {
    const t = Date.now();
    return this.api.get<any[]>(`/cxc/antiguedad-saldos?_t=${t}`);
  }

  /**
   * Obtiene los clientes que tienen saldo pendiente por cobrar.
   * @returns Observable con la lista de clientes con saldo
   */
  getClientesConSaldo(): Observable<any[]> {
    return this.api.get<any[]>('/cxc/clientes-con-saldo');
  }

  /**
   * Obtiene los documentos con saldo pendiente de pago de un cliente.
   * @param clienteId - Identificador del cliente
   * @returns Observable con la lista de documentos pendientes
   */
  getDocumentosPendientesCliente(clienteId: number): Observable<any[]> {
    return this.api.get<any[]>(`/cxc/documentos-pendientes/cliente/${clienteId}`);
  }
}
