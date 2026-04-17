import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TypeMasterRoutingModule } from './type-master-routing.module';
import { TypeMasterComponent } from './type-master.component';
import { SharedModule } from '../shared/shared.module';


@NgModule({
  declarations: [TypeMasterComponent],
  imports: [
    CommonModule,
    TypeMasterRoutingModule,
    SharedModule
  ]
})
export class TypeMasterModule { }
