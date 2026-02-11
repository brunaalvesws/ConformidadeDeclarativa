import { Routes } from '@angular/router';
import { LogsComponent } from './logs/logs.component';
import { ParseFilesComponent } from './parse-files/parse-files.component';

export const routes: Routes = [{path: '', component: ParseFilesComponent},
                               {path: 'report', component: LogsComponent}
];
