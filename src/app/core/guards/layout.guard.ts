import { inject } from '@angular/core';
import { CanMatchFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Decide si la ruta raíz usa `main-layout-private` (ERP).
 *
 * Regla (definida por el usuario, 29/10/2026):
 * - El switch de layouts depende SOLO del tipo de usuario, NO de
 *   `VALIDAR_SESSION` (aplica igual en modo 'N' y 'S'):
 *   - Sin sesión → `false` → `main-layout-public` (startPage / logout
 *     con 'N' aterriza en `facturacion/tienda` con layout público)
 *   - Cliente (`sn_cliente='S'` o `tipoPersona='C'`) → `main-layout-public`
 *   - Empleado (`sn_cliente='N'`) → `main-layout-private` (Dashboard)
 * - Con 'N' la diferencia está en `authGuard`: no exige sesión ni permisos.
 *
 * `canMatch` devuelve:
 * - `true`  → la ruta ERP coincide y se renderiza `MainPrivateLayout`
 * - `false` → Angular prueba la siguiente ruta raíz (layout público)
 */
export const erpLayoutGuard: CanMatchFn = () => {
  const auth = inject(AuthService);
  const user = auth.currentUser();

  // Sin sesión → layout público (startPage / logout → tienda con layout público)
  if (!user) return false;

  // Cliente por tipoPersona ('C') → layout público (cubre sesiones viejas
  // en localStorage que no tienen sn_cliente porque se crearon antes del cambio)
  if (user.tipoPersona === 'C') return false;

  // sn_cliente = 'S' → CRM → layout público
  if (user.sn_cliente === 'S') return false;

  // Cualquier otro caso (sn_cliente = 'N', vacío o indefinido) → ERP
  return true;
};
