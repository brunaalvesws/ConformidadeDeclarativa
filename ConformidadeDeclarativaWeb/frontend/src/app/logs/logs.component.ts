import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { Router } from '@angular/router'; 
import { ReportDTO } from "../models/resultado.dto";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'

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

  if (!this.resultado) {
    this.resultado = {
      overview: {
        successRate: 85.5,
        averageDuration: "12m 30s",
        totalTraces: 150,
        violationCount: 2
      },
      activityDistribution: [
        { name: "Receber Pedido", count: 150 },
        { name: "Verificar Estoque", count: 140 },
        { name: "Enviar Fatura", count: 120 },
        { name: "Entregar", count: 100 }
      ],
      violations: [
        {
          title: "Atividade Obrigatória Faltando",
          description: "O fluxo exige que 'Verificar Estoque' aconteça antes do envio.",
          severity: "high",
          details: [
            { trace: "Trace 001", message: "Pulou a verificação de estoque", count: 1 }
          ]
        },
        {
          title: "Usuário Não Autorizado",
          description: "O usuário 'Estagiario' executou uma ação restrita 'Aprovar Pagamento'.",
          severity: "medium",
          details: [
             { trace: "Trace 050", message: "Executado por user_123", count: 1 }
          ]
        }
      ]
    };
  }
}

  onExportCSV(): void {
    if (!this.resultado) {
      return;
    }
    const doc = new jsPDF('p', 'mm', 'a4');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Process Conformance Report", 14, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100); 
    doc.text(`Generated on: ${this.dataGeracao.toLocaleString('en-US')}`, 14, 28);
  
    doc.setDrawColor(200); 
    doc.line(14, 32, 196, 32);

    doc.setFontSize(12);
    doc.setTextColor(0); 
    doc.setFont("helvetica", "bold");
    doc.text("Executive Summary", 14, 42);

    autoTable(doc, {
      startY: 45,
      body: [
        ['Success Rate', `${this.resultado.overview.successRate}%`],
        ['Average Duration', this.resultado.overview.averageDuration], 
        ['Total Traces', this.resultado.overview.totalTraces.toString()],
        ['Total Violations', this.resultado.overview.violationCount.toString()]
      ],
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 2, textColor: 50 },
      columnStyles: { 
        0: { fontStyle: 'bold', cellWidth: 50, textColor: 0 } 
      }
    });

    let finalY = (doc as any).lastAutoTable.finalY || 50;
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text("Violation Details", 14, finalY + 15);

    const tableData = this.resultado.violations.map(v => [
      v.title,
      v.description,
      v.severity.toUpperCase(), 
      (v.details ? v.details.length : 0).toString()
    ]);

    autoTable(doc, {
      startY: finalY + 20,
      head: [['Title', 'Description', 'Severity', 'Count']],
      body: tableData,
      theme: 'grid', 
      headStyles: { 
        fillColor: [240, 240, 240], 
        textColor: 0,
        fontStyle: 'bold',
        lineWidth: 0.1,
        lineColor: [200, 200, 200]
      },
      styles: { 
        fontSize: 9, 
        textColor: 50, 
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
        valign: 'top'
      },
      alternateRowStyles: {
        fillColor: [255, 255, 255] 
      },
      columnStyles: {
        0: { cellWidth: 40 }, 
        1: { cellWidth: 'auto' }, 
        2: { cellWidth: 25 }, 
        3: { cellWidth: 15, halign: 'center' } 
      }
    });

    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} of ${totalPages}`,
        196, 
        285, 
        { align: 'right' }
      );
    }
    doc.save('Conformance_Report.pdf');
  }

    onRegenerate(): void {
      alert('Botão de Regenerar foi clicado')
      console.log('Função Regenerar acionada');
    }

}