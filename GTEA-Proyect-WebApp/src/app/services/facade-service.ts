import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Injectable, Inject } from '@angular/core';
import { Router } from 'express';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ErrorsService } from './tools/errors-service';
import { ValidatorService } from './tools/validator-service';
import { CookieService } from 'ngx-cookie-service';
import { AlumnoService } from './alumno-service';
import { OrganizadorService } from './organizador-service';
import { AdminServiceService } from './admin-service.service';

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
   constructor(
    private http: HttpClient,
    public router: Router,
    private cookieService: CookieService,
    private validatorService: ValidatorService,
    private errorService: ErrorsService,
    private alumnoService: AlumnoService,
    private organizadorService: OrganizadorService,
    private adminService: AdminServiceService,
  ) { }

  //Validar login
  //Funcion para validar login
  public validarLogin(username: String, password: String){
    var data = {
      "username": username,
      "password": password
    }
    console.log("Validando login... ", data);
    let error: any = [];

    if(!this.validatorService.required(data["username"])){
      error["username"] = this.errorService.required;
    }else if(!this.validatorService.max(data["username"], 40)){
      error["username"] = this.errorService.max(40);
    }
    else if (!this.validatorService.email(data['username'])) {
      error['username'] = this.errorService.email;
    }

    if(!this.validatorService.required(data["password"])){
      error["password"] = this.errorService.required;
    }

    return error;
  }

  //Servicios para login y para cerrar sesión
  //Iniciar sesión
  login(username:String, password:String): Observable<any> {
    var data={
      username: username,
      password: password
    }
    return this.http.post<any>(`${environment.url_api}/token/`,data);
  }

    //Cerrar sesión
    logout(): Observable<any> {
      var headers: any;
      var token = this.getSessionToken();
      headers = new HttpHeaders({ 'Content-Type': 'application/json' , 'Authorization': 'Bearer '+token});
      return this.http.get<any>(`${environment.url_api}/logout/`, {headers: headers});
    }

    //Funciones para las cookies y almacenar datos de inicio de sesión
    //Funciones para utilizar las cookies en web
    retrieveSignedUser(){
      var headers: any;
      var token = this.getSessionToken();
      headers = new HttpHeaders({'Authorization': 'Bearer '+token});
      return this.http.get<any>(`${environment.url_api}/me/`,{headers:headers});
    }

    getCookieValue(key:string){
      return this.cookieService.get(key);
    }

    saveCookieValue(key:string, value:string){
      var secure = environment.url_api.indexOf("https")!=-1;
      this.cookieService.set(key, value, undefined, undefined, undefined, secure, secure?"None":"Lax");
    }

    getSessionToken(){
      return this.cookieService.get(session_cookie_name);
    }


    saveUserData(user_data:any){
      var secure = environment.url_api.indexOf("https")!=-1;
      if(user_data.rol == "administrador"){
        this.cookieService.set(user_id_cookie_name, user_data.id, undefined, undefined, undefined, secure, secure?"None":"Lax");
        this.cookieService.set(user_email_cookie_name, user_data.email, undefined, undefined, undefined, secure, secure?"None":"Lax");
        this.cookieService.set(user_complete_name_cookie_name, user_data.first_name + " " + user_data.last_name, undefined, undefined, undefined, secure, secure?"None":"Lax");
      }else{
        this.cookieService.set(user_id_cookie_name, user_data.user.id, undefined, undefined, undefined, secure, secure?"None":"Lax");
        this.cookieService.set(user_email_cookie_name, user_data.user.email, undefined, undefined, undefined, secure, secure?"None":"Lax");
        this.cookieService.set(user_complete_name_cookie_name, user_data.user.first_name + " " + user_data.user.last_name, undefined, undefined, undefined, secure, secure?"None":"Lax");
      }
      this.cookieService.set(session_cookie_name, user_data.token, undefined, undefined, undefined, secure, secure?"None":"Lax");
      this.cookieService.set(group_name_cookie_name, user_data.rol, undefined, undefined, undefined, secure, secure?"None":"Lax");
    }

    destroyUser(){
      this.cookieService.deleteAll();
    }

    getUserEmail(){
      return this.cookieService.get(user_email_cookie_name);
    }

    getUserCompleteName(){
      return this.cookieService.get(user_complete_name_cookie_name);
    }

    getUserId(){
      return this.cookieService.get(user_id_cookie_name);
    }

    getUserGroup(){
      return this.cookieService.get(group_name_cookie_name);
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
          return this.alumnoService.registrarAlumno(payload);

        case 'organizador':
          payload = {
            rol: 'organizador',
            clave_org: formData.idNumber,
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            password: formData.password,
            confirmar_password: formData.confirmPassword,
          };
          return this.organizadorService.registrarOrg(payload);

        case 'admin':
          payload = {
            rol: 'admin',
            clave_admin: formData.idNumber,
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            password: formData.password,
            confirmar_password: formData.confirmPassword,
          };
          return this.adminService.registrarAdmin(payload);

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
        'admin': 'admin',
      };
      return domainToRoleMap[domain] || '';
    }
}
