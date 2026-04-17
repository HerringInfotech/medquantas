import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PriceFormComponent } from './price-form.component';

const routes: Routes = [{ path: '', component: PriceFormComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PriceFormRoutingModule { }
