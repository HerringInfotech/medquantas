import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PriceMasterComponent } from './price-master.component';
import { AuthGuard } from '../shared/auth/auth.guard';

const routes: Routes = [
  { path: '', component: PriceMasterComponent },
  { path: 'form', canActivate: [AuthGuard], data: { permission: 'Pricemaster.Create' }, loadChildren: () => import('../price-master/price-form/price-form.module').then(m => m.PriceFormModule) },
  { path: 'form/:id', canActivate: [AuthGuard], data: { permission: 'Pricemaster.Update' }, loadChildren: () => import('../price-master/price-form/price-form.module').then(m => m.PriceFormModule) },
  { path: 'log/:id', loadChildren: () => import('./price-log/price-log.module').then(m => m.PriceLogModule) },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PriceMasterRoutingModule { }
