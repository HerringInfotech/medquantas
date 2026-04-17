import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SalesViewComponent } from './sales-view.component';

const routes: Routes = [{ path: '', component: SalesViewComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SalesViewRoutingModule { }
