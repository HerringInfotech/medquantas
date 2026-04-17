import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CostMasterComponent } from './cost-master.component';
import { AuthGuard } from '../shared/auth/auth.guard';

const routes: Routes = [
  { path: '', component: CostMasterComponent },
  { path: 'form', canActivate: [AuthGuard], data: { permission: 'CostSheet.Create' }, loadChildren: () => import('../cost-master/cost-form/cost-form.module').then(m => m.CostFormModule) },
  { path: 'form/:id', loadChildren: () => import('../cost-master/cost-form/cost-form.module').then(m => m.CostFormModule) },
  { path: 'view/:id', loadChildren: () => import('../cost-master/view-cost/view-cost.module').then(m => m.ViewCostModule) },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CostMasterRoutingModule { }
