import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ItemMasterComponent } from './item-master.component';
import { AuthGuard } from '../shared/auth/auth.guard';

const routes: Routes = [
  { path: '', component: ItemMasterComponent },
  { path: 'form', canActivate: [AuthGuard], data: { permission: 'ItemMaster.Create' }, loadChildren: () => import('../item-master/item-form/item-form.module').then(m => m.ItemFormModule) },
  { path: 'form/:id', canActivate: [AuthGuard], data: { permission: 'ItemMaster.Update' }, loadChildren: () => import('../item-master/item-form/item-form.module').then(m => m.ItemFormModule) },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ItemMasterRoutingModule { }
