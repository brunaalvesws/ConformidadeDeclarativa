import { Routes } from '@angular/router';
import { ReportComponent } from './report/report.component';
import { ParseFilesComponent } from './parse-files/parse-files.component';

export const routes: Routes = [{path: '', component: ParseFilesComponent},
                               {path: 'report', component: ReportComponent}
];
