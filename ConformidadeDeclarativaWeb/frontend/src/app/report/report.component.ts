import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { Router } from '@angular/router'; 
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'
import { ReportDTO } from "../models/report.dto";
import { ServiceProcessing } from '../services/processamento.service';

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

  result: ReportDTO | null = null; 
  dategeneration: Date = new Date(); 

  constructor(private service: ServiceProcessing) {}

  ngOnInit() {
    this.result = this.service.getResult();
  }

  onExportCSV(): void {
    if (!this.result) return;

    const rows: string[] = [];
    rows.push("Activity,Resource,Data Object,Operation,Category,Instances");

    for (const category in this.result.violations) {
      const violations = this.result.violations[category];

      const isDataAccess = category.toLowerCase().includes("data access");

      for (const v of violations) {

        const instances = Array.isArray(v.instance)
          ? v.instance
          : (typeof v.instance === "string" ? v.instance.split(",").map(i => i.trim()) : [""]);

        const activities = Array.isArray(v.activity)
          ? v.activity
          : (typeof v.activity === "string" ? v.activity.split(",").map(a => a.trim()) : [""]);

        const resources = Array.isArray(v.resource)
          ? v.resource
          : (typeof v.resource === "string" ? v.resource.split(",").map(r => r.trim()) : [""]);

        const tool = v.tool ?? "";
        const formattedOperation = v.operation ? this.formatOperation(v.operation) : "";

        for (let i = 0; i < instances.length; i++) {

          const activity = activities[i] ?? activities[0] ?? "";
          const resource = resources[i] ?? resources[0] ?? "";

          let finalTool = "";
          let finalOperation = "";

          if (isDataAccess) {
            finalTool = tool;
            finalOperation = formattedOperation;
          }

          const line = `"${activity}","${resource}","${finalTool}","${finalOperation}","${category}","${instances[i]}"`;
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

  onExportPDF(): void {
    if (!this.result?.violations) return;

    const doc = new jsPDF();
    let y = 15; 
    const marginX = 12; 
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();

    const totalViolations = this.result.overview.violationCount; 
    const categoryCounts: { [key: string]: number } = {};

    for (const category in this.result.violations) {
      categoryCounts[category] = this.result.violations[category].length;
    }

    const styles = {
      title: () => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
      },
      textBold: (size: number) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(size);
        doc.setTextColor(0, 0, 0);
      },
      textNormal: (size: number) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(size);
        doc.setTextColor(0, 0, 0);
      },
      drawLine: (yPos: number) => {
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.1);
        doc.line(marginX, yPos, pageWidth - marginX, yPos);
      }
    };

    styles.title();
    doc.text("Conformance Checking Results", marginX, y);

    const successRate = this.result.overview.successRate;
    styles.textBold(10);
    doc.text(`${successRate.toFixed(2)}% Success`, pageWidth - marginX, y, { align: "right" });
    
    y += 5;
    styles.textNormal(9);
    doc.text(`Total Violations: ${totalViolations}`, pageWidth - marginX, y, { align: "right" });
    
    y += 3;
    styles.drawLine(y); 
    y += 8;
  
    for (const category in this.result.violations) {
      if (y > pageHeight - 15) { doc.addPage(); y = 15; }

      const count = categoryCounts[category];
      const percent = totalViolations > 0 ? ((count / totalViolations) * 100).toFixed(2) : "0.00";

      styles.textBold(10);
      doc.text(`${category.toUpperCase()} - ${percent}% (${count} errors)`, marginX, y);
      y += 2;
      styles.drawLine(y); 
      y += 6;

      for (const v of this.result.violations[category]) {
        if (y > pageHeight - 15) { doc.addPage(); y = 15; }

        const catLower = category.toLowerCase();
        let highlightText = "";
        let descriptionText = "";

        if (catLower.includes('mandatory activity') || catLower.includes('prohibited activity')) {
          highlightText = `Constraint Violated: ${v.rule}`;
          descriptionText = v.instance !== '' 
            ? `In trace number ${v.case_id}, this rule was violated on instance number ${v.instance}.`
            : `In trace number ${v.case_id}, this rule was violated because an expected activity was not found in the log.`;
        } else if (catLower.includes('unexpected activity') || catLower.includes('illegal activity')) {
          highlightText = `Activity: ${v.activity}`;
          descriptionText = `In trace number ${v.case_id}, this activity was done by the resource ${v.resource} on instance ${v.instance}.`;
        } else if (catLower.includes('data')) {
          highlightText = `Data access: ${v.operation} on ${v.tool} in the activity ${v.activity}`;
          descriptionText = `In trace number ${v.case_id}, this data access was performed on instance ${v.instance}.`;
        } else {
          highlightText = `Violation in trace ${v.case_id}`;
          descriptionText = "";
        }

      
        styles.textBold(8);
        doc.text(highlightText, marginX + 2, y);
        y += 4;

        styles.textNormal(8);
        const maxWidth = pageWidth - marginX - 10;
        const descriptionLines = doc.splitTextToSize(descriptionText, maxWidth);
        
        doc.text(descriptionLines, marginX + 4, y);
        y += (descriptionLines.length * 3.5) + 2; 
      }
      y += 3;
    }

    doc.save("Conformance_Report.pdf");
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