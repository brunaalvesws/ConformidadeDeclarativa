import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
import { ProcessamentoService } from '../services/processamento.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-log-generator',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './log-generator.component.html',
  styleUrl: './log-generator.component.css'
})
export class LogGeneratorComponent implements OnInit{
  declareModel = ''
  arquivoDeclare: File | null = null;
  arquivoAcesso: File | null = null;
  arquivoOrganizacional: File | null = null;
  arquivoLogEventos: File | null = null;
  arquivoLogAcesso: File | null = null;
  loading = false

  constructor(
    private service: ProcessamentoService,
    private router: Router
  ) {
  }

  ngOnInit(): void {} 

  onDeclareFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.arquivoDeclare = file;
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
      this.arquivoOrganizacional = file;
    }
  }

  onAccessFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      const reader = new FileReader();
      this.arquivoAcesso = file;
    }
  }

  onEventLogFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      const reader = new FileReader();
      this.arquivoLogEventos = file;
    }
  }

  onAccessLogFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      const reader = new FileReader();
      this.arquivoLogAcesso = file;
    }
  }

  startAlgorithm() {
    const formData = new FormData();
    if (this.arquivoDeclare != null && this.arquivoOrganizacional != null && this.arquivoAcesso != null && this.arquivoLogEventos != null && this.arquivoLogAcesso != null) {
      formData.append('declare', this.arquivoDeclare!); 
      formData.append('organizational', this.arquivoOrganizacional!); 
      formData.append('access', this.arquivoAcesso!); 
      formData.append('logeventos', this.arquivoLogEventos!); 
      formData.append('logacesso', this.arquivoLogAcesso!); 

      // this.service.processarArquivos(formData).subscribe({
      //   next: (resultado: ReportDTO) => {
      //     this.service.setResultado(resultado);
      //     this.router.navigate(['/report']);
      //     this.loading = false;
      //   },
      //   error: (err: any) => {
      //     this.loading = false; 
      //     alert(err.error?.message || 'Unexpected Error');
      //   }
      // });
      this.router.navigate(['/report']);

    } else {
      alert('You must upload a DECLARE model, an organizational model, an access model, an event log and a data access log to start the conformance checking')
    }
  }

}


