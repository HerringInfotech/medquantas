import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CostFormComponent } from './cost-form.component';

const routes: Routes = [{ path: '', component: CostFormComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CostFormRoutingModule { }
