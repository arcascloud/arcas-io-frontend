export interface PlanillaEmpleado {
  empleadoId: number;
  fecharegistro: string;
  nombres: string;
  apellidos: string;
  dni: string;
  fechanacimiento: string;
  sexo: 'M' | 'F' | 'T';
  estadocivil: 'S' | 'C' | 'V' | 'D' | 'U';
  paisorigen?: number;
  paisresidencia?: number;
  nroseguro?: string;
  telefono: string;
  celular: string;
  email: string;
  profesionId?: number;
  puestoId?: number;
  sueldobruto: number;
  techoseguro: number;
  cuentabancaria?: string;
  lugardenacimiento?: string;
  sn_activo: 'S' | 'N';
  tipoempId: number;
  Idsucursal: number;
  empresaId: number;
}