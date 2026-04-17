import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FgMasterRoutingModule } from './fg-master-routing.module';
import { FgMasterComponent } from './fg-master.component';
import { SharedModule } from '../shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';


@NgModule({
  declarations: [FgMasterComponent],
  imports: [
    CommonModule,
    FgMasterRoutingModule,
    SharedModule,
    NgSelectModule,
    NgbModule
  ]
})
export class FgMasterModule { }
