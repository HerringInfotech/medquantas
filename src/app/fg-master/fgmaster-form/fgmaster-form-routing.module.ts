import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FgmasterFormComponent } from './fgmaster-form.component';

const routes: Routes = [{ path: '', component: FgmasterFormComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FgmasterFormRoutingModule { }
