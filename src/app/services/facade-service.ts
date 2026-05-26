import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Injectable, Inject, Injector, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { ErrorsService } from './tools/errors-service';
import { ValidatorService } from './tools/validator-service';
import { AlumnoService } from './alumno-service';
import { OrganizadorService } from './organizador-service';
import { AdminServiceService } from './admin-service.service';

export const EMAIL_DOMAIN_REGEX = /^[^@\s]+@(alumno|admin|organizador)\.com$/i;

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

const session_cookie_name = 'gtea-proyecto-token';
const user_email_cookie_name = 'gtea-proyecto-email';
const user_id_cookie_name = 'gtea-proyecto-user_id';
const user_complete_name_cookie_name = 'gtea-proyecto-user_complete_name';
const group_name_cookie_name = 'gtea-proyecto-group_name';

@Injectable({
  providedIn: 'root',
})
export class FacadeService {
  alumnoService: any;
  organizadorService: any;
  adminService: any;
  constructor(
    private http: HttpClient,
    private validatorService: ValidatorService,
    private errorService: ErrorsService,
    private injector: Injector,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  //Validar login
  //Funcion para validar login
  public validarLogin(username: String, password: String) {
    var data = {
      "username": username,
      "password": password
    }
    // Validación eliminada de console.log para producción
    let error: any = [];

    if (!this.validatorService.required(data["username"])) {
      error["username"] = this.errorService.required;
    } else if (!this.validatorService.max(data["username"], 40)) {
      error["username"] = this.errorService.max(40);
    }
    else if (!this.validatorService.email(data['username'])) {
      error['username'] = this.errorService.email;
    }

    if (!this.validatorService.required(data["password"])) {
      error["password"] = this.errorService.required;
    }

    return error;
  }

  //Servicios para login y para cerrar sesión
  //Iniciar sesión
  login(username: String, password: String): Observable<any> {
    var data = {
      username: username,
      password: password
    }

    return this.http.post<any>(`${environment.url_api}/auth/login/`, data);
  }

  //Cerrar sesión
  logout(): Observable<any> {
    var token = this.getSessionToken();
    var headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Token ' + token });
    return this.http.get<any>(`${environment.url_api}/auth/logout/`, { headers: headers });
  }

  //Funciones para las cookies y almacenar datos de inicio de sesión
  //Funciones para utilizar las cookies en web
  retrieveSignedUser() {
    var token = this.getSessionToken();
    var headers = new HttpHeaders({ 'Authorization': 'Token ' + token });
    return this.http.get<any>(`${environment.url_api}/auth/login/`, { headers: headers });
  }

  getCookieValue(key: string) {
    if (this.isBrowser) {
      return localStorage.getItem(key) || sessionStorage.getItem(key) || '';
    }
    return '';
  }

  saveCookieValue(key: string, value: string) {
    if (this.isBrowser) {
      try {
        localStorage.setItem(key, value);
      } catch (e) {/* ignore */ }
    }
  }

  getSessionToken() {
    if (this.isBrowser) {
      return localStorage.getItem(session_cookie_name) || sessionStorage.getItem(session_cookie_name) || '';
    }
    return '';
  }


  saveUserData(user_data: any, remember: boolean = true) {
    if (!this.isBrowser) return;

    try {
      const userPayload = (user_data.user !== null && typeof user_data.user === 'object')
        ? user_data.user
        : user_data;

      const rawFirstName =
        userPayload.first_name ||
        userPayload.firstName ||
        userPayload.nombre ||
        userPayload.name ||
        userPayload.usuario ||
        userPayload.username ||
        '';

      const rawLastName =
        userPayload.last_name ||
        userPayload.lastName ||
        userPayload.apellido ||
        '';

      const completeName = `${rawFirstName} ${rawLastName}`.trim() ||
        (userPayload.email ? userPayload.email.split('@')[0] : '') ||
        userPayload.id ||
        'Usuario';

      const storage = remember ? localStorage : sessionStorage;

      storage.setItem(user_id_cookie_name, String(userPayload.id || ''));
      storage.setItem(user_email_cookie_name, String(userPayload.email || ''));
      storage.setItem(user_complete_name_cookie_name, String(completeName));
      storage.setItem('user_complete_name', String(completeName));
      storage.setItem('userName', String((completeName.split(' ')[0] || '').trim()));

      storage.setItem(session_cookie_name, String(user_data.token || ''));
      storage.setItem(group_name_cookie_name, String(user_data.rol || userPayload.rol || ''));
      storage.setItem('group_name', String(user_data.rol || userPayload.rol || ''));

      console.debug('saveUserData:', { user_data, userPayload, completeName, remember });
    } catch (e) {
      console.error('saveUserData error:', e);
    }
  }

  destroyUser() {
    if (!this.isBrowser) return;

    try {
      const keys = [
        user_id_cookie_name,
        user_email_cookie_name,
        user_complete_name_cookie_name,
        session_cookie_name,
        group_name_cookie_name,
        'user_complete_name',
        'userName',
        'group_name'
      ];
      keys.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
    } catch (e) {/* ignore */ }
  }

  getUserEmail() {
    return this.getCookieValue(user_email_cookie_name);
  }

  getUserCompleteName() {
    return this.getCookieValue(user_complete_name_cookie_name);
  }

  getUserId() {
    return this.getCookieValue(user_id_cookie_name);
  }

  getUserGroup() {
    return this.getCookieValue(group_name_cookie_name);
  }

  getUserDisplayName() {
    if (!this.isBrowser) {
      return 'Usuario';
    }

    const completeName = this.getCookieValue(user_complete_name_cookie_name) ||
      this.getCookieValue('user_complete_name') ||
      this.getCookieValue('userName') ||
      this.getCookieValue('user_name');

    if (completeName && completeName.trim().length > 0) {
      return completeName.trim();
    }

    const email = this.getCookieValue(user_email_cookie_name) || this.getCookieValue('email');
    if (email && email.includes('@')) {
      return email.split('@')[0];
    }

    return 'Usuario';
  }

  // Método para registrar usuario con rol automático basado en dominio de email
  registroUsuario(formData: any): Observable<any> {
    // Extraer dominio del email
    const emailDomain = this.extractEmailDomain(formData.email);

    // Mapear dominio a rol
    const rol = this.mapDomainToRole(emailDomain);

    // Preparar payload según el rol
    let payload: any;

    switch (rol) {
      case 'alumno':
        payload = {
          rol: 'alumno',
          matricula: formData.idNumber,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          password: formData.password,
          confirmar_password: formData.confirmPassword,
        };
        const alumnoSvc = this.injector.get(AlumnoService);
        return alumnoSvc.registrarAlumno(payload);

      case 'organizador':
        payload = {
          rol: 'organizador',
          id_trabajador: formData.idNumber,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          password: formData.password,
          confirmar_password: formData.confirmPassword,
        };
        const orgSvc = this.injector.get(OrganizadorService);
        return orgSvc.registrarOrg(payload);

      case 'administrador':
        payload = {
          rol: 'administrador',
          clave_admin: formData.idNumber,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          password: formData.password,
          confirmar_password: formData.confirmPassword,
        };
        const adminSvc = this.injector.get(AdminServiceService);
        return adminSvc.registrarAdmin(payload);

      default:
        throw new Error(`Rol desconocido: ${rol}`);
    }
  }

  // Helper: Extraer dominio del email (ej: "usuario@alumno.com" -> "alumno")
  private extractEmailDomain(email: string): string {
    const match = email.match(/@([a-z]+)\.com$/i);
    return match ? match[1].toLowerCase() : '';
  }

  // Helper: Mapear dominio a rol
  private mapDomainToRole(domain: string): string {
    const domainToRoleMap: { [key: string]: string } = {
      'alumno': 'alumno',
      'organizador': 'organizador',
      'admin': 'administrador',
    };
    return domainToRoleMap[domain] || '';
  }

  // Validador: passwords deben coincidir
  public passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    return password && confirmPassword && password !== confirmPassword
      ? { passwordMismatch: true }
      : null;
  }

  // Utilitario: fuerza de password
  public getPasswordStrength(value: string): { level: number; label: string } {
    let score = 0;
    if (value.length >= 8) score += 1;
    if (value.length >= 12) score += 1;
    if (/[A-Z]/.test(value)) score += 1;
    if (/[0-9]/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;

    const level = Math.min(4, score);
    const labels = ['Muy debil', 'Debil', 'Medio', 'Fuerte', 'Muy fuerte'];
    return { level, label: labels[level] };
  }
}
