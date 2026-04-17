import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UomMasterRoutingModule } from './uom-master-routing.module';
import { UomMasterComponent } from './uom-master.component';
import { SharedModule } from '../shared/shared.module';


@NgModule({
  declarations: [UomMasterComponent],
  imports: [
    CommonModule,
    UomMasterRoutingModule,
    SharedModule
  ]
})
export class UomMasterModule { }
