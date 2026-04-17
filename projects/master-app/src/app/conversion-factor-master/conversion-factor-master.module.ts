import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConversionFactorMasterComponent } from './conversion-factor-master.component';
import { ConversionFactorMasterRoutingModule } from './conversion-factor-master-routing.module';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [ConversionFactorMasterComponent],
  imports: [
    CommonModule,
    ConversionFactorMasterRoutingModule,
    SharedModule,
    
  ]
})
export class ConversionFactorModule { }
