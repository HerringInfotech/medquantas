import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SalesSheetComponent } from './sales-sheet.component';

const routes: Routes = [
  { path: '', component: SalesSheetComponent },
  { path: 'form', data: { permission: 'SaleSheet.Create' }, loadChildren: () => import('./sales-form/sales-form.module').then(m => m.SalesFormModule) },
  { path: 'form/:id', data: { permission: 'SaleSheet.Update' }, loadChildren: () => import('./sales-form/sales-form.module').then(m => m.SalesFormModule) },
  { path: 'view/:id', data: { permission: 'SaleSheet.List' }, loadChildren: () => import('./sales-view/sales-view.module').then(m => m.SalesViewModule) },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SalesSheetRoutingModule { }
