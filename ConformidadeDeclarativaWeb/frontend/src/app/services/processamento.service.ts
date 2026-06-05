import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from '../../environments/environment';
import { ReportDTO } from "../models/report.dto";

interface ApiResponse {
  data: ReportDTO;
}

@Injectable({ providedIn: 'root' })
export class ServiceProcessing {

  private result!: ReportDTO;

  constructor(private http: HttpClient) {}

  processFiles(files: FormData) {
    return this.http.post<ApiResponse>(`${environment.apiUrl}/check`, files);
  }

  setResult(result: ReportDTO) {
    this.result = result;
  }

  getResult(): ReportDTO {
    return this.result;
  }
}