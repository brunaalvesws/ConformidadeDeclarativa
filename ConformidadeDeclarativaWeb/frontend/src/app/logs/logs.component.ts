import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { Router } from '@angular/router'; 
import { ReportDTO } from "../models/resultado.dto";

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule], 
  templateUrl: './logs.component.html',
  styleUrl: './logs.component.css'
})
export class LogsComponent implements OnInit {

  resultado: ReportDTO | null = null; 
  dataGeracao: Date = new Date(); 

  constructor(private router: Router) {
    const nav = this.router.getCurrentNavigation();
    if (nav?.extras.state && nav.extras.state['data']) {
      this.resultado = nav.extras.state['data'];
    }
  }

  ngOnInit() {
    if (!this.resultado && history.state['data']) {
      this.resultado = history.state['data'];
    }
  }
}