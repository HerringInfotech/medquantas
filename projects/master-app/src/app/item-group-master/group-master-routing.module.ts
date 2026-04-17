import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GroupMasterComponent } from './group-master.component';
import { AuthGuard } from '../shared/auth/auth.guard';

const routes: Routes = [
  { path: '', component: GroupMasterComponent },
  { path: 'form', canActivate: [AuthGuard], data: { permission: 'Pricemaster.Create' }, loadChildren: () => import('../item-group-master/group-form/group-form.module').then(m => m.GroupFormModule) },
  { path: 'form/:id', canActivate: [AuthGuard], data: { permission: 'Pricemaster.Update' }, loadChildren: () => import('../item-group-master/group-form/group-form.module').then(m => m.GroupFormModule) },
  // { path: 'log/:id', loadChildren: () => import('./price-log/price-log.module').then(m => m.PriceLogModule) },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GroupMasterRoutingModule { }
