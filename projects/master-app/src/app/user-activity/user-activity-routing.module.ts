import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { UserActivityComponent } from './user-activity.component';

const routes: Routes = [{ path: '', component: UserActivityComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserActivityRoutingModule { }
