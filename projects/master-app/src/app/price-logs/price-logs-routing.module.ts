import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PriceLogsComponent } from './price-logs.component';

const routes: Routes = [{ path: '', component: PriceLogsComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PriceLogsRoutingModule { }
