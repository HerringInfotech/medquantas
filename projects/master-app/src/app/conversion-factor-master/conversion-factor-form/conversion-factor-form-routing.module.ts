import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';

import { ConversionFactorFormComponent } from './conversion-factor-form.component';


const routes: Routes = [{ path: '', component: ConversionFactorFormComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class ConversionFactorFormRoutingModule { }
