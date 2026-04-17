import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CustomerComponent } from './customer.component';
import { AuthGuard } from '../shared/auth/auth.guard';

const routes: Routes = [
  { path: '', component: CustomerComponent }, 
  { path: 'form', canActivate: [AuthGuard], data: { permission: 'Customer.Create' }, loadChildren: () => import('./form/form.module').then(m => m.FormModule) },
  { path: 'form/:id', canActivate: [AuthGuard], data: { permission: 'Customer.Create' }, loadChildren: () => import('./form/form.module').then(m => m.FormModule) },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CustomerRoutingModule { }
