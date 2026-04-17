import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ItemFormComponent } from './item-form.component';

const routes: Routes = [{ path: '', component: ItemFormComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ItemFormRoutingModule { }
