import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ModuleFormComponent } from './module-form.component';

const routes: Routes = [{ path: '', component: ModuleFormComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ModuleFormRoutingModule { }
