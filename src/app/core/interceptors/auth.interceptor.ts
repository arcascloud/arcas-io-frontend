import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // withCredentials: cookies (mismo sitio) + Bearer (cross-site: la cookie
  // SameSite=Lax no viaja en XHR contra onrender, y es el canal principal
  // cuando frontend y backend son sitios distintos).
  const token = localStorage.getItem('token');
  const cloned = token
    ? req.clone({ withCredentials: true, setHeaders: { Authorization: `Bearer ${token}` } })
    : req.clone({ withCredentials: true });
  return next(cloned);
};
