import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpParams } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
import { environment } from '../../environments/environment';

interface Activity {
  name: string
  min_duration: number
  max_duration: number
}

@Component({
  selector: 'app-log-generator',
  standalone: true,
  imports: [FormsModule, CommonModule, HttpClientModule],
  templateUrl: './log-generator.component.html',
  styleUrl: './log-generator.component.css'
})
export class LogGeneratorComponent implements OnInit{
  traces = 100
  minEvents = 500
  maxEvents = 1000
  showActivities = false
  declareModel = ''
  arquivoDeclare: File | null = null;
  arquivoAcesso: File | null = null;
  arquivoOrganizacional: File | null = null;
  loading = false

  activities: Activity[] = []

  constructor(private http: HttpClient) {}

  ngOnInit(): void {}

  toggleActivities(): void {
    this.showActivities = !this.showActivities
  }

  parseActivities(text: string): Activity[] {
    const lines = text.split(/\r?\n/);
    const activities: Activity[] = [];

    for (const line of lines) {
      if (line.startsWith('activity ')) {
        const name = line.slice('activity '.length).trim(); 
        activities.push({
          name,
          min_duration: 1,
          max_duration: 1
        });
      }
    }
    return activities;
  }

  onDeclareFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      const reader = new FileReader();
      this.arquivoDeclare = file;
      reader.onload = () => {
        this.declareModel = reader.result as string;
        this.activities = this.parseActivities(this.declareModel);
      };
      reader.readAsText(file);
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

  handleMinDurationChange(index: number, event: any): void {
    const newDuration = Number.parseFloat(event.target.value)
    this.activities[index].min_duration = newDuration

    if (this.activities[index].min_duration > this.activities[index].max_duration) {
      this.activities[index].max_duration = this.activities[index].min_duration
    }
  }

  handleMaxDurationChange(index: number, event: any): void {
    const newDuration = Number.parseFloat(event.target.value)
    this.activities[index].max_duration = newDuration
  }

  // Ensure min doesn't exceed max
  onMinEventsChange(event: any): void {
    const value = Number.parseInt(event.target.value)
    this.minEvents = value

    if (this.minEvents > this.maxEvents) {
      this.maxEvents = this.minEvents
    }
  }

  findInvalidActivities(activities: Activity[]): Activity[] {
    return activities.filter(activity => activity.max_duration < activity.min_duration);
  }


  downloadCSV() {
    const formData = new FormData();
    if (this.arquivoDeclare != null && this.arquivoOrganizacional != null && this.arquivoAcesso != null) {
      formData.append('declare', this.arquivoDeclare!); 
      formData.append('organizational', this.arquivoOrganizacional!); 
      formData.append('access', this.arquivoAcesso!); 

      if (this.maxEvents > 0 && this.traces > 0 && this.minEvents > 0 && this.minEvents <= this.maxEvents) {
        const params = new HttpParams()
          .set('maxEvents', this.maxEvents)
          .set('minEvents', this.minEvents)
          .set('traces', this.traces);

          if (this.findInvalidActivities(this.activities).length == 0) {
            formData.append('activities', JSON.stringify(this.activities));
            this.loading = true;

            this.http.post(`${environment.apiUrl}/generate`, formData, { 
              responseType: 'blob',
              params: params  
            }).subscribe({next: (blob) => {
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'generated_logs.zip';
              a.click();
              window.URL.revokeObjectURL(url);

              this.loading = false;
            },
            error: (err) => {
              this.loading = false; 

              if (err.error instanceof Blob) {
                const reader = new FileReader();
                reader.onload = () => {
                  try {
                    const json = JSON.parse(reader.result as string);
                    alert(json.message); 
                  } catch {
                    console.error('Unknown error:', reader.result);
                  }
                };
                reader.readAsText(err.error);
              } else {
                alert(err.error?.message || 'Unexpected Error');
              }
            }
            });
          } else {
            const names = this.findInvalidActivities(this.activities).map(a => a.name).join(', ');
            alert(`The following activities have minimum duration greater than maximum duration: ${names}. Fix that before trying again.`)
          }

      } else {
        alert('Number of Traces, Minimum number of events and Maximum number of events must be greater than 0.')
      }

    } else {
      alert('You must upload a DECLARE model, an organizational model and a access model to generate the log')
    }
  }

}


