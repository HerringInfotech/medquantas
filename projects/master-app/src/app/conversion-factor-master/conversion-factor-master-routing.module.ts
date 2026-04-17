import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConversionFactorMasterComponent } from './conversion-factor-master.component';
import { AuthGuard } from '../shared/auth/auth.guard';

const routes: Routes = [
  { path: '', component: ConversionFactorMasterComponent },
  { path: 'form', canActivate: [AuthGuard], data: { permission: 'ConversionFactorMaster.Create' }, loadChildren: () => import('./conversion-factor-form/conversion-factor-form.module').then(m => m.ConversionFactorFormModule) },
  { path: 'form/:id', canActivate: [AuthGuard], data: { permission: 'ConversionFactorMaster.Update' }, loadChildren: () => import('./conversion-factor-form/conversion-factor-form.module').then(m => m.ConversionFactorFormModule) },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ConversionFactorMasterRoutingModule { }
