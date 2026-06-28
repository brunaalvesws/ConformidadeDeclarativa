import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
import { ServiceProcessing } from '../services/processamento.service';
import { Router } from '@angular/router';
import { ReportDTO } from '../models/report.dto';
import { HttpErrorResponse } from '@angular/common/http';

interface ApiResponse {
  data: ReportDTO;
}


@Component({
  selector: 'app-parse-files',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './parse-files.component.html',
  styleUrl: './parse-files.component.css'
})
export class ParseFilesComponent implements OnInit{
  declareModel = ''
  declareFile: File | null = null;
  accessFile: File | null = null;
  organizationalFile: File | null = null;
  eventLogFile: File | null = null;
  accessLogFile: File | null = null;
  loading = false

  constructor(
    private service: ServiceProcessing,
    private router: Router
  ) {
  }

  ngOnInit(): void {} 

  onDeclareFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.declareFile = file;
    }
  }

  onFileInputClick(inputId: string): void {
    document.getElementById(inputId)?.click()
  }

  onResourceFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      const reader = new FileReader();
      this.organizationalFile = file;
    }
  }

  onAccessFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      const reader = new FileReader();
      this.accessFile = file;
    }
  }

  onEventLogFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      const reader = new FileReader();
      this.eventLogFile = file;
    }
  }

  onAccessLogFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      const reader = new FileReader();
      this.accessLogFile = file;
    }
  }

  startAlgorithm() {
    const formData = new FormData();
    if (this.declareFile != null && this.organizationalFile != null && this.accessFile != null && this.eventLogFile != null && this.accessLogFile != null) {
      this.loading = true;
      formData.append('declare', this.declareFile!); 
      formData.append('organizational', this.organizationalFile!); 
      formData.append('access', this.accessFile!); 
      formData.append('accessLog', this.accessLogFile!); 
      formData.append('eventLog', this.eventLogFile!); 

      this.service.processFiles(formData).subscribe({
        next: (result: ApiResponse) => {
          this.service.setResult(result.data);
          this.router.navigate(['/report']);
        },
        error: (err: HttpErrorResponse) => {
          alert(err.error?.message || 'Unexpected Error');
          this.loading = false;
        }
      });
    } else {
      alert('You must upload a DECLARE model, an organizational model, an access model, an event log and a data access log to start the conformance checking')
    }
  }

}


