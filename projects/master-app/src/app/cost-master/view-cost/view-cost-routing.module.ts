import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ViewCostComponent } from './view-cost.component';

const routes: Routes = [{ path: '', component: ViewCostComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ViewCostRoutingModule { }
