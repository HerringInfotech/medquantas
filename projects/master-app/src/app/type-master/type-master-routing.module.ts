import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TypeMasterComponent } from './type-master.component';

const routes: Routes = [
  { path: '', component: TypeMasterComponent }, 
  { path: 'form', loadChildren: () => import('./form/form.module').then(m => m.FormModule) },
  { path: 'form/:id', loadChildren: () => import('./form/form.module').then(m => m.FormModule) },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TypeMasterRoutingModule { }
