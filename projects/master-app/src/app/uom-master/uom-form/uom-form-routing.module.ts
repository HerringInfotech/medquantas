import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { UomFormComponent } from './uom-form.component';

const routes: Routes = [{ path: '', component: UomFormComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UomFormRoutingModule { }
