import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from '../../environments/environment';
import { ReportDTO } from "../models/resultado.dto";

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