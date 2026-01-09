import { Component } from '@angular/core';
import { LogsService } from './logs.service';
import { KeyValuePipe, NgFor } from '@angular/common';

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [NgFor, KeyValuePipe],
  templateUrl: './logs.component.html',
  styleUrl: './logs.component.css'
})
export class LogsComponent {

  conteudo: any;

  constructor(private service: LogsService){
    this.service.mostrarLogs().subscribe((logs) => {
      this.conteudo = logs;
    });
  }


}
