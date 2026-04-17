import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BomMasterComponent } from './bom-master.component';
import { AuthGuard } from '../shared/auth/auth.guard';

const routes: Routes = [
  { path: '', component: BomMasterComponent },
  { path: 'form', canActivate: [AuthGuard], data: { permission: 'BOM.Create' }, loadChildren: () => import('../bom-master/bom-form/bom-form.module').then(m => m.BomFormModule) },
  { path: 'form/:id', loadChildren: () => import('../bom-master/bom-form/bom-form.module').then(m => m.BomFormModule) },
  { path: 'view/:id', loadChildren: () => import('../bom-master/view-bom/view-bom.module').then(m => m.ViewBomModule) },];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BomMasterRoutingModule { }
