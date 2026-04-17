import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AccessManagerComponent } from './access-manager.component';
import { AuthGuard } from '../shared/auth/auth.guard';

const routes: Routes = [
  { path: '', component: AccessManagerComponent },
  { path: 'form', canActivate: [AuthGuard], data: { permission: 'Access.Create' }, loadChildren: () => import('../access-manager/access-form/access-form.module').then(m => m.AccessFormModule) },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AccessManagerRoutingModule { }
