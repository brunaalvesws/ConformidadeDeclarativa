import { Component, OnInit } from '@angular/core';
import { KeyValuePipe, NgFor } from '@angular/common';
import { ProcessamentoService } from '../services/processamento.service';
import { ReportDTO } from "../models/resultado.dto";

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [NgFor, KeyValuePipe],
  templateUrl: './logs.component.html',
  styleUrl: './logs.component.css'
})
export class LogsComponent implements OnInit{

  resultado!: ReportDTO;

  constructor( 
    private service: ProcessamentoService){};

  ngOnInit() {
    this.resultado = this.service.getResultado();
  }
}
