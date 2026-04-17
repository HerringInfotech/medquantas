import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { UomMasterComponent } from './uom-master.component';
import { AuthGuard } from '../shared/auth/auth.guard';

const routes: Routes = [
  { path: '', component: UomMasterComponent },
  { path: 'form', canActivate: [AuthGuard], data: { permission: 'UOM.Create' }, loadChildren: () => import('../uom-master/uom-form/uom-form.module').then(m => m.UomFormModule) },
  { path: 'form/:id', canActivate: [AuthGuard], data: { permission: 'UOM.Update' }, loadChildren: () => import('../uom-master/uom-form/uom-form.module').then(m => m.UomFormModule) },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UomMasterRoutingModule { }
