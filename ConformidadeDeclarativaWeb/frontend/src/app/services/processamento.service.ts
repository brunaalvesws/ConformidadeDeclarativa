import { Time } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from '../../environments/environment';

export interface ReportDTO {
  Duration: Time;
  ActivityList: [Object];
  ProhibitedActivity: [Object];
  UnexpectedActivity: [Object];
  IllegalActivity: [Object];
  IgnoredMandatoryActivity: [Object];
  ProhibitedDataAccess: [Object];
  UnexpectedDataAccess: [Object];
  IllegalDataAccess: [Object];
  IgnoredMandatoryDataAccess: [Object];
}

@Injectable({ providedIn: 'root' })
export class ProcessamentoService {

  private resultado!: ReportDTO;

  constructor(private http: HttpClient) {}

  processarArquivos(files: FormData) {
    return this.http.post<ReportDTO>(`${environment.apiUrl}/check`, files);
  }

  setResultado(resultado: ReportDTO) {
    this.resultado = resultado;
  }

  getResultado(): ReportDTO {
    return this.resultado;
  }
}