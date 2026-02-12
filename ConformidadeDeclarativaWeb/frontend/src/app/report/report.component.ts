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
  //   if (!this.resultado) {
  //     return;
  //   }
  //   const doc = new jsPDF('p', 'mm', 'a4');

  //   doc.setFont("helvetica", "bold");
  //   doc.setFontSize(18);
  //   doc.text("Process Conformance Report", 14, 20);

  //   doc.setFont("helvetica", "normal");
  //   doc.setFontSize(10);
  //   doc.setTextColor(100); 
  //   doc.text(`Generated on: ${this.dataGeracao.toLocaleString('en-US')}`, 14, 28);
  
  //   doc.setDrawColor(200); 
  //   doc.line(14, 32, 196, 32);

  //   doc.setFontSize(12);
  //   doc.setTextColor(0); 
  //   doc.setFont("helvetica", "bold");
  //   doc.text("Executive Summary", 14, 42);

  //   autoTable(doc, {
  //     startY: 45,
  //     body: [
  //       ['Success Rate', `${this.resultado.overview.successRate}%`],
  //       ['Average Duration', this.resultado.overview.averageDuration],
  //       ['Total Violations', this.resultado.overview.violationCount.toString()]
  //     ],
  //     theme: 'plain',
  //     styles: { fontSize: 10, cellPadding: 2, textColor: 50 },
  //     columnStyles: { 
  //       0: { fontStyle: 'bold', cellWidth: 50, textColor: 0 } 
  //     }
  //   });

  //   let finalY = (doc as any).lastAutoTable.finalY || 50;
    
  //   doc.setFontSize(12);
  //   doc.setFont("helvetica", "bold");
  //   doc.setTextColor(0);
  //   doc.text("Violation Details", 14, finalY + 15);

  //   // const tableData = this.resultado.violations.map(v => [
  //   //   v.case_id,
  //   //   v.rule,
  //   //   v.resource.toUpperCase(), 
  //   //   // (v.details ? v.details.length : 0).toString()
  //   // ]);

  //   autoTable(doc, {
  //     startY: finalY + 20,
  //     head: [['Title', 'Description', 'Severity', 'Count']],
  //     body: tableData,
  //     theme: 'grid', 
  //     headStyles: { 
  //       fillColor: [240, 240, 240], 
  //       textColor: 0,
  //       fontStyle: 'bold',
  //       lineWidth: 0.1,
  //       lineColor: [200, 200, 200]
  //     },
  //     styles: { 
  //       fontSize: 9, 
  //       textColor: 50, 
  //       lineColor: [200, 200, 200],
  //       lineWidth: 0.1,
  //       valign: 'top'
  //     },
  //     alternateRowStyles: {
  //       fillColor: [255, 255, 255] 
  //     },
  //     columnStyles: {
  //       0: { cellWidth: 40 }, 
  //       1: { cellWidth: 'auto' }, 
  //       2: { cellWidth: 25 }, 
  //       3: { cellWidth: 15, halign: 'center' } 
  //     }
  //   });

  //   const totalPages = (doc as any).internal.getNumberOfPages();
  //   for (let i = 1; i <= totalPages; i++) {
  //     doc.setPage(i);
  //     doc.setFontSize(8);
  //     doc.setTextColor(150);
  //     doc.text(
  //       `Page ${i} of ${totalPages}`,
  //       196, 
  //       285, 
  //       { align: 'right' }
  //     );
  //   }
  //   doc.save('Conformance_Report.pdf');
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