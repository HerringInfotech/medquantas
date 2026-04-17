import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ItemtypeMasterComponent } from './itemtype-master.component';
import { AuthGuard } from '../shared/auth/auth.guard';

const routes: Routes = [
  { path: '', component: ItemtypeMasterComponent },
  { path: 'form', canActivate: [AuthGuard], data: { permission: 'Itemtype.Create' }, loadChildren: () => import('../itemtype-master/itemtype-form/itemtype-form.module').then(m => m.ItemtypeFormModule) },
  { path: 'form/:id', canActivate: [AuthGuard], data: { permission: 'Itemtype.Update' }, loadChildren: () => import('../itemtype-master/itemtype-form/itemtype-form.module').then(m => m.ItemtypeFormModule) },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ItemtypeMasterRoutingModule { }
