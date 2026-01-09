import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LogsService {

  private readonly API = 'http://localhost:5000/api/v1/main/'

  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': 'http://localhost:5000/'
  });

  constructor(private http: HttpClient) { }

  mostrarLogs(): Observable<string> {
    return this.http.get<string>(this.API, {headers: this.headers});
  }
}
