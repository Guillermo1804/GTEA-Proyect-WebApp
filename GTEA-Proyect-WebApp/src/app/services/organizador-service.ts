import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { FacadeService } from './facade-service';
import { ErrorsService } from './tools/errors-service';
import { ValidatorService } from './tools/validator-service';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root',
})
export class OrganizadorService {
  constructor(
    private http: HttpClient,
    private validatorService: ValidatorService,
    private errorService: ErrorsService,
    private facadeService: FacadeService
  ) {  }

  public esquemaOrga(){
    return {
      'rol':'',
      'clave_org': '',
      'first_name': '',
      'last_name': '',
      'email': '',
      'password': '',
      'confirmar_password': '',
    }
  }

//Validación para el formulario
public validarOrga(data: any, editar: boolean){
  console.log("Validando organizador... ", data);
  let error: any = [];

  if(!this.validatorService.required(data["clave_org"])){
    error["clave_org"] = this.errorService.required;
  }

  if(!this.validatorService.required(data["first_name"])){
    error["first_name"] = this.errorService.required;
  }

  if(!this.validatorService.required(data["last_name"])){
    error["last_name"] = this.errorService.required;
  }

  if(!this.validatorService.required(data["email"])){
    error["email"] = this.errorService.required;
  }else if(!this.validatorService.max(data["email"], 40)){
    error["email"] = this.errorService.max(40);
  }else if (!this.validatorService.email(data['email'])) {
    error['email'] = this.errorService.email;
  }

  if(!editar){
    if(!this.validatorService.required(data["password"])){
      error["password"] = this.errorService.required;
    }

    if(!this.validatorService.required(data["confirmar_password"])){
      error["confirmar_password"] = this.errorService.required;
    }
  }
  //Return arreglo
  return error;
}

  //Aquí van los servicios HTTP
  //Servicio para registrar un nuevo usuario
  public registrarOrg (data: any): Observable <any>{
    return this.http.post<any>(`${environment.url_api}/organizadores/`,data, httpOptions);
  }

  public obtenerListaOrgs (): Observable <any>{
    var token = this.facadeService.getSessionToken();
    var headers = new HttpHeaders({ 'Content-Type': 'application/json' , 'Authorization': 'Bearer '+token});
    return this.http.get<any>(`${environment.url_api}/lista-org/`, {headers:headers});
  }

    //Obtener un solo usuario dependiendo su ID
    public getOrgByID(idUser: Number){
      return this.http.get<any>(`${environment.url_api}/organizadores/?id=${idUser}`,httpOptions);
    }

    //Servicio para actualizar un usuario
    public editarOrg (data: any): Observable <any>{
      var token = this.facadeService.getSessionToken();
      var headers = new HttpHeaders({ 'Content-Type': 'application/json' , 'Authorization': 'Bearer '+token});
      return this.http.put<any>(`${environment.url_api}/organizadores-edit/`, data, {headers:headers});
    }

    //Eliminar Admin
  public eliminarOrg(idUser: number): Observable <any>{
    var token = this.facadeService.getSessionToken();
    var headers = new HttpHeaders({ 'Content-Type': 'application/json' , 'Authorization': 'Bearer '+token});
    return this.http.delete<any>(`${environment.url_api}/organizadores-edit/?id=${idUser}`,{headers:headers});
  }

    //Obtener el total de cada uno de los usuarios
    public getTotalUsuarios(){
      var token = this.facadeService.getSessionToken();
      var headers = new HttpHeaders({ 'Content-Type': 'application/json' , 'Authorization': 'Bearer '+token});
      return this.http.get<any>(`${environment.url_api}/organizadores-edit/`, {headers:headers});
    }
}
