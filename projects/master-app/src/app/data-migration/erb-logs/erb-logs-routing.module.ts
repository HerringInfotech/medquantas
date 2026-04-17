import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ErbLogsComponent } from './erb-logs.component';

const routes: Routes = [{ path: '', component: ErbLogsComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ErbLogsRoutingModule { }
