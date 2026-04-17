import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PackMasterComponent } from './pack-master.component';
import { AuthGuard } from '../shared/auth/auth.guard';

const routes: Routes = [
  { path: '', component: PackMasterComponent },
  { path: 'form', canActivate: [AuthGuard], data: { permission: 'Packmaster.Create' }, loadChildren: () => import('../pack-master/pack-form/pack-form.module').then(m => m.PackFormModule) },
  { path: 'form/:id', canActivate: [AuthGuard], data: { permission: 'Packmaster.Update' }, loadChildren: () => import('../pack-master/pack-form/pack-form.module').then(m => m.PackFormModule) },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PackMasterRoutingModule { }
