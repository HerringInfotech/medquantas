import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ModuleListComponent } from './module-list.component';

const routes: Routes = [
  { path: '', component: ModuleListComponent },
  { path: 'form', loadChildren: () => import('../module-list/module-form/module-form.module').then(m => m.ModuleFormModule) },
  { path: 'form/:id', loadChildren: () => import('../module-list/module-form/module-form.module').then(m => m.ModuleFormModule) },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ModuleListRoutingModule { }
