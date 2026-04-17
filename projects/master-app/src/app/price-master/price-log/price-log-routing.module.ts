import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PriceLogComponent } from './price-log.component';

const routes: Routes = [{ path: '', component: PriceLogComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PriceLogRoutingModule { }
