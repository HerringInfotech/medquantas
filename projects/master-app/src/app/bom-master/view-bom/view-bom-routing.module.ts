import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ViewBomComponent } from './view-bom.component';

const routes: Routes = [{ path: '', component: ViewBomComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ViewBomRoutingModule { }
