import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UomFormRoutingModule } from './uom-form-routing.module';
import { UomFormComponent } from './uom-form.component';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [UomFormComponent],
  imports: [
    CommonModule,
    UomFormRoutingModule,
    FormsModule
  ]
})
export class UomFormModule { }
