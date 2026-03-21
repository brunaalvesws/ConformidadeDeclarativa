import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { Router } from '@angular/router'; 
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'
import { ReportDTO } from "../models/report.dto";
import { ProcessamentoService } from '../services/processamento.service';

export const NON_CONFORMANCE_CATEGORY_DESCRIPTIONS: Record<string, string> = {

  "Prohibited activity":
    "An activity forbidden by the process model but observed in the event log.",

  "Unexpected activity":
    "An activity not defined in the process model but observed in the event log.",

  "Illegal activity":
    "An activity performed by someone outside of the designated team.",

  "Ignored mandatory activity":
    "A mandatory activity defined in the model that was not executed in the event log.",

  "Prohibited data access":
    "A data access explicitly forbidden by the model but performed in the event log.",

  "Unexpected data access":
    "A data access linked to an unexpected activity.",

  "Illegal data access":
    "A data access performed by someone outside of the designated team or not assigned to the corresponding activity.",

  "Ignored mandatory data access":
    "A mandatory data access defined in the model that was not executed in the event log."
};

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [CommonModule], 
  templateUrl: './report.component.html',
  styleUrl: './report.component.css'
})
export class ReportComponent implements OnInit {

  resultado: ReportDTO | null = null; 
  dataGeracao: Date = new Date(); 

  constructor(private service: ProcessamentoService) {}

  ngOnInit() {
    this.resultado = this.service.getResultado();
  }

  onExportCSV(): void {
    if (!this.resultado) return;

    const rows: string[] = [];
    rows.push("Activity,Resource,Data Object,Operation,Category");

    for (const category in this.resultado.violations) {
      const violations = this.resultado.violations[category];

      const isDataAccess = category.toLowerCase().includes("data access");

      for (const v of violations) {

        const instances = Array.isArray(v.instance)
          ? v.instance
          : (typeof v.instance === "string"
              ? v.instance.split(",").map(i => i.trim())
              : [""]);

        const activities = Array.isArray(v.activity)
          ? v.activity
          : (typeof v.activity === "string" ? v.activity.split(",").map(a => a.trim()) : [""]);

        const resources = Array.isArray(v.resource)
          ? v.resource
          : (typeof v.resource === "string" ? v.resource.split(",").map(r => r.trim()) : [""]);

        const tool = v.tool ?? "";
        const formattedOperation = v.operation
          ? this.formatOperation(v.operation)
          : "";

        for (let i = 0; i < instances.length; i++) {

          const activity = activities[i] ?? activities[0] ?? "";
          const resource = resources[i] ?? resources[0] ?? "";

          let finalTool = "";
          let finalOperation = "";

          if (isDataAccess) {
            finalTool = tool;
            finalOperation = formattedOperation;
          }

          const line = `"${activity}","${resource}","${finalTool}","${finalOperation}","${category}"`;
          rows.push(line);
        }
      }
    }

    const csvContent = rows.join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "report.csv");

    link.click();
  }

    onRegenerate(): void {
      alert('Botão de Regenerar foi clicado')
      console.log('Função Regenerar acionada');
    }

    getDescription(category: string): string {
      return NON_CONFORMANCE_CATEGORY_DESCRIPTIONS[category] 
            ?? "Unknown category";
    }

    formatOperation(action: string): string {
      const actions: Record<string, string> = {
        c: 'create',
        r: 'read',
        u: 'update',
        d: 'delete'
      };

      const result = actions[action.toLowerCase()];
      if (!result) {
        throw new Error("Invalid operation");
      }

      return result;
    }


    formatDuration(seconds: number): string {
      const totalMilliseconds = Math.floor(seconds * 1000);

      const hours = Math.floor(totalMilliseconds / 3600000);
      const minutes = Math.floor((totalMilliseconds % 3600000) / 60000);
      const secs = Math.floor((totalMilliseconds % 60000) / 1000);
      const milliseconds = totalMilliseconds % 1000;

      return `${hours.toString().padStart(2, '0')}h `
          + `${minutes.toString().padStart(2, '0')}m `
          + `${secs.toString().padStart(2, '0')}s `
          + `${milliseconds.toString().padStart(3, '0')}ms`;
    }

}