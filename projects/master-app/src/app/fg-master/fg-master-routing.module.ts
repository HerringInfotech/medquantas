import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FgMasterComponent } from './fg-master.component';
import { AuthGuard } from '../shared/auth/auth.guard';

const routes: Routes = [
  { path: '', component: FgMasterComponent },
  { path: 'form', canActivate: [AuthGuard], data: { permission: 'FGmaster.Create' }, loadChildren: () => import('../fg-master/fgmaster-form/fgmaster-form.module').then(m => m.FgmasterFormModule) },
  { path: 'form/:id', canActivate: [AuthGuard], data: { permission: 'FGmaster.Update' }, loadChildren: () => import('../fg-master/fgmaster-form/fgmaster-form.module').then(m => m.FgmasterFormModule) },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FgMasterRoutingModule { }
