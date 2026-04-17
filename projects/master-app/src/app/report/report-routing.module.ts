import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ReportComponent } from './report.component';

const routes: Routes = [
  { path: '', component: ReportComponent },
  { path: 'form/:id', loadChildren: () => import('./view-report/view-report.module').then(m => m.ViewReportModule) },
  // { path: 'form/:id', loadChildren: () => import('./variance/variance.module').then(m => m.VarianceModule) },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportRoutingModule { }
