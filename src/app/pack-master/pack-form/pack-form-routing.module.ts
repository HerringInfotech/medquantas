import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PackFormComponent } from './pack-form.component';

const routes: Routes = [{ path: '', component: PackFormComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PackFormRoutingModule { }
