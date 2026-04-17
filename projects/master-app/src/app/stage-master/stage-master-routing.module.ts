import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { StageMasterComponent } from './stage-master.component';

const routes: Routes = [
  { path: '', component: StageMasterComponent }, 
  { path: 'form', loadChildren: () => import('./form/form.module').then(m => m.FormModule) },
  { path: 'form/:id', loadChildren: () => import('./form/form.module').then(m => m.FormModule) }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StageMasterRoutingModule { }
