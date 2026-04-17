import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ItemtypeFormComponent } from './itemtype-form.component';

const routes: Routes = [{ path: '', component: ItemtypeFormComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ItemtypeFormRoutingModule { }
