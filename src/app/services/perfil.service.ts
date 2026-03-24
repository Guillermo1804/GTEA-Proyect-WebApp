import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { FacadeService } from './facade-service';

@Injectable({ providedIn: 'root' })
export class PerfilService {

  constructor(
    private http: HttpClient,
    private facadeService: FacadeService,
  ) {}

  getPerfilAlumno(): Observable<any> {
    const token = this.facadeService.getSessionToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + token,
    });

    return this.http.get<any>(`${environment.url_api}/alumnos/perfil/`, { headers });
  }
}
