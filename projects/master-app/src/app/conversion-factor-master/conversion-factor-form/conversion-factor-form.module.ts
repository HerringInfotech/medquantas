import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConversionFactorFormComponent } from './conversion-factor-form.component';
import { ConversionFactorFormRoutingModule } from './conversion-factor-form-routing.module';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [ConversionFactorFormComponent],
  imports: [
    CommonModule,
    ConversionFactorFormRoutingModule,
    FormsModule
  ]
})

export class ConversionFactorFormModule { }
