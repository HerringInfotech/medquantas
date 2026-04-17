import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BomFormComponent } from './bom-form.component';

const routes: Routes = [{ path: '', component: BomFormComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BomFormRoutingModule { }
