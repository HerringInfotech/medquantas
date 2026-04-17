import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AccessFormComponent } from './access-form.component';

const routes: Routes = [{ path: '', component: AccessFormComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AccessFormRoutingModule { }
