import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  CtaContable, GrupoContable, CopdaMae, CopdaDet, MovCta,
  SaldoCta, PeriodoContable, CierreContable, PlantillaPdaMae,
  PlantillaPdaDet, PlantillaBalancesMae, PlantillaBalancesDet,
  TipoDocFiscal, FactorCambio, ReporteLiquidez, ReporteDiario,
  ReporteBalance, ImpuestoVecinal, NivelCta, NaturalezaCta,
  ContabilizarPartidaDto, CierreContableRequest, ReporteRequest,
  CrearPartidaInicialRequest,
  BalanceComprobacion, PartidaDiario, LibroMayorItem,
  BalanceDinamicoRequest, BalanceDinamicoReporte,
  BalanceFinancieroRequest, BalanceFinancieroReporte,
  EstadoResultadoRequest, EstadoResultadoReporte,
  Cartera, CierreDet, DashboardData,
} from '../models/contabilidad.models';

@Injectable({ providedIn: 'root' })
export class ContabilidadService {
  private api = inject(ApiService);

  private readonly R = '/contabilidad';

  // ========== Plan de Cuentas ==========

  getCuentas(): Observable<CtaContable[]> {
    return this.api.get<CtaContable[]>(`${this.R}/ctacontables`);
  }

  getCuenta(id: number): Observable<CtaContable> {
    return this.api.getOne<CtaContable>(`${this.R}/ctacontables`, id);
  }

  crearCuenta(dto: Partial<CtaContable>): Observable<CtaContable> {
    return this.api.post<CtaContable>(`${this.R}/ctacontables`, dto);
  }

  actualizarCuenta(id: number, dto: Partial<CtaContable>): Observable<CtaContable> {
    return this.api.put<CtaContable>(`${this.R}/ctacontables`, id, dto);
  }

  eliminarCuenta(id: number): Observable<any> {
    return this.api.put<any>(`${this.R}/ctacontables`, `${id}/remove`, {});
  }

  // ========== Grupos Contables ==========

  getGrupos(): Observable<GrupoContable[]> {
    return this.api.get<GrupoContable[]>(`${this.R}/grupocontable`);
  }

  getGrupo(id: number): Observable<GrupoContable> {
    return this.api.getOne<GrupoContable>(`${this.R}/grupocontable`, id);
  }

  crearGrupo(dto: Partial<GrupoContable>): Observable<GrupoContable> {
    return this.api.post<GrupoContable>(`${this.R}/grupocontable`, dto);
  }

  actualizarGrupo(id: number, dto: Partial<GrupoContable>): Observable<GrupoContable> {
    return this.api.put<GrupoContable>(`${this.R}/grupocontable`, id, dto);
  }

  eliminarGrupo(id: number): Observable<any> {
    return this.api.put<any>(`${this.R}/grupocontable`, `${id}/remove`, {});
  }

  // ========== Niveles de Cuenta ==========

  getNiveles(): Observable<NivelCta[]> {
    return this.api.get<NivelCta[]>(`${this.R}/nivelcta`);
  }

  getNivel(id: number): Observable<NivelCta> {
    return this.api.getOne<NivelCta>(`${this.R}/nivelcta`, id);
  }

  crearNivel(dto: Partial<NivelCta>): Observable<NivelCta> {
    return this.api.post<NivelCta>(`${this.R}/nivelcta`, dto);
  }

  actualizarNivel(id: number, dto: Partial<NivelCta>): Observable<NivelCta> {
    return this.api.put<NivelCta>(`${this.R}/nivelcta`, id, dto);
  }

  eliminarNivel(id: number): Observable<any> {
    return this.api.put<any>(`${this.R}/nivelcta`, `${id}/remove`, {});
  }

  // ========== Naturaleza de Cuenta ==========

  getNaturalezas(): Observable<NaturalezaCta[]> {
    return this.api.get<NaturalezaCta[]>(`${this.R}/naturalezacta`);
  }

  // ========== Partidas de Diario (Comprobantes) ==========

  getPartidas(): Observable<CopdaMae[]> {
    return this.api.get<CopdaMae[]>(`${this.R}/copdamae`);
  }

  getPartida(id: number): Observable<CopdaMae> {
    return this.api.getOne<CopdaMae>(`${this.R}/copdamae`, id);
  }

  crearPartida(dto: Partial<CopdaMae>): Observable<CopdaMae> {
    return this.api.post<CopdaMae>(`${this.R}/copdamae`, dto);
  }

  actualizarPartida(id: number, dto: Partial<CopdaMae>): Observable<CopdaMae> {
    return this.api.put<CopdaMae>(`${this.R}/copdamae`, id, dto);
  }

  eliminarPartida(id: number): Observable<any> {
    return this.api.put<any>(`${this.R}/copdamae`, `${id}/remove`, {});
  }

  // ========== Detalle de Partidas ==========

  getDetallesPartida(partidaId: number): Observable<CopdaDet[]> {
    return this.api.get<CopdaDet[]>(`${this.R}/copdadet`, { copdamaeId: partidaId });
  }

  crearDetallePartida(dto: Partial<CopdaDet>): Observable<CopdaDet> {
    return this.api.post<CopdaDet>(`${this.R}/copdadet`, dto);
  }

  actualizarDetallePartida(id: number, dto: Partial<CopdaDet>): Observable<CopdaDet> {
    return this.api.put<CopdaDet>(`${this.R}/copdadet`, id, dto);
  }

  eliminarDetallePartida(id: number): Observable<any> {
    return this.api.put<any>(`${this.R}/copdadet`, `${id}/remove`, {});
  }

  // ========== Contabilización (lógica de negocio) ==========

  contabilizarPartida(dto: ContabilizarPartidaDto): Observable<CopdaMae> {
    return this.api.post<CopdaMae>(`${this.R}/copdamae/contabilizar`, dto);
  }

  /**
   * Crea la partida inicial de operaciones en el período contable ABIERTO.
   * El backend decide el período, la fecha documento y la referencia.
   */
  crearPartidaInicial(dto: CrearPartidaInicialRequest): Observable<CopdaMae> {
    return this.api.post<CopdaMae>(`${this.R}/partida-inicial`, dto);
  }

  // ========== Movimientos Contables ==========

  getMovimientos(): Observable<MovCta[]> {
    return this.api.get<MovCta[]>(`${this.R}/movcta`);
  }

  getMovimiento(id: number): Observable<MovCta> {
    return this.api.getOne<MovCta>(`${this.R}/movcta`, id);
  }

  reclasificarCuenta(ctacontableAnterior: string, ctacontableNueva: string, empresaId: number): Observable<any> {
    return this.api.post<any>(`${this.R}/movcta/reclasificar`, {
      ctacontableAnterior,
      ctacontableNueva,
      empresaId,
    });
  }

  getCtacontables(): Observable<CtaContable[]> {
    return this.api.get<CtaContable[]>(`${this.R}/ctacontables`);
  }

  // ========== Saldos de Cuentas ==========

  getSaldos(): Observable<SaldoCta[]> {
    return this.api.get<SaldoCta[]>(`${this.R}/saldoscta`);
  }

  getSaldo(id: number): Observable<SaldoCta> {
    return this.api.getOne<SaldoCta>(`${this.R}/saldoscta`, id);
  }

  crearSaldo(dto: Partial<SaldoCta>): Observable<SaldoCta> {
    return this.api.post<SaldoCta>(`${this.R}/saldoscta`, dto);
  }

  actualizarSaldo(id: number, dto: Partial<SaldoCta>): Observable<SaldoCta> {
    return this.api.put<SaldoCta>(`${this.R}/saldoscta`, id, dto);
  }

  // ========== Períodos Contables ==========

  getPeriodos(): Observable<PeriodoContable[]> {
    return this.api.get<PeriodoContable[]>(`${this.R}/periodoctable`);
  }

  getPeriodo(id: number): Observable<PeriodoContable> {
    return this.api.getOne<PeriodoContable>(`${this.R}/periodoctable`, id);
  }

  crearPeriodo(dto: Partial<PeriodoContable>): Observable<PeriodoContable> {
    return this.api.post<PeriodoContable>(`${this.R}/periodoctable`, dto);
  }

  actualizarPeriodo(id: number, dto: Partial<PeriodoContable>): Observable<PeriodoContable> {
    return this.api.put<PeriodoContable>(`${this.R}/periodoctable`, id, dto);
  }

  eliminarPeriodo(id: number): Observable<any> {
    return this.api.put<any>(`${this.R}/periodoctable`, `${id}/remove`, {});
  }

  // ========== Cierre Contable ==========

  getCierres(): Observable<CierreContable[]> {
    return this.api.get<CierreContable[]>(`${this.R}/cierrectable`);
  }

  getCierre(id: number): Observable<CierreContable> {
    return this.api.getOne<CierreContable>(`${this.R}/cierrectable`, id);
  }

  crearCierre(dto: Partial<CierreContable>): Observable<CierreContable> {
    return this.api.post<CierreContable>(`${this.R}/cierrectable`, dto);
  }

  realizarCierre(request: CierreContableRequest): Observable<any> {
    return this.api.post<any>(`${this.R}/cierrectable/realizar`, request);
  }

  /** Reversión de cierre: deshace el cierre y reabre el período contable */
  revertirCierre(request: CierreContableRequest): Observable<any> {
    return this.api.post<any>(`${this.R}/cierrectable/revertir`, request);
  }

  // ========== Detalle de Cierre Contable ==========

  getCierresDet(cocierremaeId?: number): Observable<CierreDet[]> {
    return this.api.get<CierreDet[]>(`${this.R}/cierredet`, cocierremaeId != null ? { cocierremaeId } : undefined);
  }

  getCierreDet(id: number): Observable<CierreDet> {
    return this.api.getOne<CierreDet>(`${this.R}/cierredet`, id);
  }

  crearCierreDet(dto: Partial<CierreDet>): Observable<CierreDet> {
    return this.api.post<CierreDet>(`${this.R}/cierredet`, dto);
  }

  actualizarCierreDet(id: number, dto: Partial<CierreDet>): Observable<CierreDet> {
    return this.api.put<CierreDet>(`${this.R}/cierredet`, id, dto);
  }

  eliminarCierreDet(id: number): Observable<any> {
    return this.api.put<any>(`${this.R}/cierredet`, `${id}/remove`, {});
  }

  // ========== Plantillas PDA ==========

  getPlantillasPda(): Observable<PlantillaPdaMae[]> {
    return this.api.get<PlantillaPdaMae[]>(`${this.R}/plantillapdamae`);
  }

  getPlantillaPda(id: number): Observable<PlantillaPdaMae> {
    return this.api.getOne<PlantillaPdaMae>(`${this.R}/plantillapdamae`, id);
  }

  getDetallesPlantillaPda(plantillaId: number): Observable<PlantillaPdaDet[]> {
    return this.api.get<PlantillaPdaDet[]>(`${this.R}/plantillapdadet`, { tcoplantillapdamaeId: plantillaId });
  }

  createPlantillaPdaMae(dto: Partial<PlantillaPdaMae>): Observable<PlantillaPdaMae> {
    return this.api.post<PlantillaPdaMae>(`${this.R}/plantillapdamae`, dto);
  }

  updatePlantillaPdaMae(id: number, dto: Partial<PlantillaPdaMae>): Observable<PlantillaPdaMae> {
    return this.api.put<PlantillaPdaMae>(`${this.R}/plantillapdamae`, id, dto);
  }

  deletePlantillaPdaMae(id: number): Observable<void> {
    return this.api.putBase<void>(`${this.R}/plantillapdamae/${id}/remove`, {});
  }

  createPlantillaPdaDet(dto: Partial<PlantillaPdaDet>): Observable<PlantillaPdaDet> {
    return this.api.post<PlantillaPdaDet>(`${this.R}/plantillapdadet`, dto);
  }

  updatePlantillaPdaDet(id: number, dto: Partial<PlantillaPdaDet>): Observable<PlantillaPdaDet> {
    return this.api.put<PlantillaPdaDet>(`${this.R}/plantillapdadet`, id, dto);
  }

  deletePlantillaPdaDet(id: number): Observable<void> {
    return this.api.putBase<void>(`${this.R}/plantillapdadet/${id}/remove`, {});
  }

  // ========== Plantillas Balances ==========

  getPlantillasBalances(): Observable<PlantillaBalancesMae[]> {
    return this.api.get<PlantillaBalancesMae[]>(`${this.R}/plantillabalancesmae`);
  }

  getPlantillaBalances(id: number): Observable<PlantillaBalancesMae> {
    return this.api.getOne<PlantillaBalancesMae>(`${this.R}/plantillabalancesmae`, id);
  }

  getDetallesPlantillaBalances(plantillaId: number): Observable<PlantillaBalancesDet[]> {
    return this.api.get<PlantillaBalancesDet[]>(`${this.R}/plantillabalancesdet`, { cocdefbalmaId: plantillaId });
  }

  createPlantillaBalancesMae(dto: Partial<PlantillaBalancesMae>): Observable<PlantillaBalancesMae> {
    return this.api.post<PlantillaBalancesMae>(`${this.R}/plantillabalancesmae`, dto);
  }

  updatePlantillaBalancesMae(id: number, dto: Partial<PlantillaBalancesMae>): Observable<PlantillaBalancesMae> {
    return this.api.put<PlantillaBalancesMae>(`${this.R}/plantillabalancesmae`, id, dto);
  }

  deletePlantillaBalancesMae(id: number): Observable<void> {
    return this.api.putBase<void>(`${this.R}/plantillabalancesmae/${id}/remove`, {});
  }

  createPlantillaBalancesDet(dto: Partial<PlantillaBalancesDet>): Observable<PlantillaBalancesDet> {
    return this.api.post<PlantillaBalancesDet>(`${this.R}/plantillabalancesdet`, dto);
  }

  updatePlantillaBalancesDet(id: number, dto: Partial<PlantillaBalancesDet>): Observable<PlantillaBalancesDet> {
    return this.api.put<PlantillaBalancesDet>(`${this.R}/plantillabalancesdet`, id, dto);
  }

  deletePlantillaBalancesDet(id: number): Observable<void> {
    return this.api.putBase<void>(`${this.R}/plantillabalancesdet/${id}/remove`, {});
  }

  // ========== Tipos de Documento Fiscal ==========

  getTiposDocFiscal(): Observable<TipoDocFiscal[]> {
    return this.api.get<TipoDocFiscal[]>(`${this.R}/tipos-doc-fiscal`);
  }

  // ========== Factores de Cambio ==========

  getFactoresCambio(): Observable<FactorCambio[]> {
    return this.api.get<FactorCambio[]>(`${this.R}/factordecambio`);
  }

  // ========== Reportes ==========

  getReportesLiquidez(): Observable<ReporteLiquidez[]> {
    return this.api.get<ReporteLiquidez[]>(`${this.R}/repliquidez`);
  }

  getReportesDiarios(): Observable<ReporteDiario[]> {
    return this.api.get<ReporteDiario[]>(`${this.R}/repdiarios`);
  }

  getReportesBalances(): Observable<ReporteBalance[]> {
    return this.api.get<ReporteBalance[]>(`${this.R}/repbalances`);
  }

  // ========== Reportes Generados ==========

  generarBalanceComprobacion(request: ReporteRequest): Observable<BalanceComprobacion[]> {
    return this.api.post<BalanceComprobacion[]>(`${this.R}/reportes/balance-comprobacion`, request);
  }

  generarLibroDiario(request: ReporteRequest): Observable<PartidaDiario[]> {
    return this.api.post<PartidaDiario[]>(`${this.R}/reportes/libro-diario`, request);
  }

  generarLibroMayor(request: ReporteRequest): Observable<LibroMayorItem[]> {
    return this.api.post<LibroMayorItem[]>(`${this.R}/reportes/libro-mayor`, request);
  }

  generarBalanceDinamico(request: BalanceDinamicoRequest): Observable<BalanceDinamicoReporte> {
    return this.api.post<BalanceDinamicoReporte>(`${this.R}/reportes/balance-dinamico`, request);
  }

  /** Estado de Resultado — UNA variante por vez (P=período, A=acumulado, N=año anterior). */
  generarEstadoResultado(request: EstadoResultadoRequest): Observable<EstadoResultadoReporte> {
    return this.api.post<EstadoResultadoReporte>(`${this.R}/reportes/estado-resultado`, request);
  }

  generarBalanceFinanciero(
    request: BalanceFinancieroRequest,
  ): Observable<BalanceFinancieroReporte> {
    return this.api.post<BalanceFinancieroReporte>(
      `${this.R}/reportes/balance-financiero`,
      request,
    );
  }

  // ========== Impuesto Vecinal ==========

  getImpuestosVecinales(): Observable<ImpuestoVecinal[]> {
    return this.api.get<ImpuestoVecinal[]>(`${this.R}/impuestovecinal`);
  }

  // ========== Carteras Contables ==========

  getCarteras(): Observable<Cartera[]> {
    return this.api.get<Cartera[]>(`${this.R}/carteras`);
  }

  getCartera(id: number): Observable<Cartera> {
    return this.api.getOne<Cartera>(`${this.R}/carteras`, id);
  }

  crearCartera(dto: Partial<Cartera>): Observable<Cartera> {
    return this.api.post<Cartera>(`${this.R}/carteras`, dto);
  }

  actualizarCartera(id: number, dto: Partial<Cartera>): Observable<Cartera> {
    return this.api.put<Cartera>(`${this.R}/carteras`, id, dto);
  }

  eliminarCartera(id: number): Observable<any> {
    return this.api.put<any>(`${this.R}/carteras`, `${id}/remove`, {});
  }

  // ========== Dashboard Módulo 7 ==========

  /**
   * Payload completo del dashboard de Contabilidad (6 widgets).
   * `empresaId` lo inyecta ApiService automáticamente en la query string.
   */
  getDashboard(anio?: number, periodo?: number): Observable<DashboardData> {
    const params: Record<string, number> = {};
    if (anio != null) params['anio'] = anio;
    if (periodo != null) params['periodo'] = periodo;
    return this.api.get<DashboardData>(`${this.R}/dashboard`, params);
  }

  // ========== Integración con otros módulos ==========

  contabilizarFactura(facturaId: number): Observable<any> {
    return this.api.post<any>(`${this.R}/integracion/factura`, { documentoId: facturaId });
  }

  contabilizarCxC(movimientoId: number): Observable<any> {
    return this.api.post<any>(`${this.R}/integracion/cxc`, { documentoId: movimientoId });
  }

  contabilizarCxP(movimientoId: number): Observable<any> {
    return this.api.post<any>(`${this.R}/integracion/cxp`, { documentoId: movimientoId });
  }

  contabilizarBanco(movimientoId: number): Observable<any> {
    return this.api.post<any>(`${this.R}/integracion/bancos`, { documentoId: movimientoId });
  }
}
