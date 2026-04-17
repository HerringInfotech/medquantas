import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BomMasterRoutingModule } from './bom-master-routing.module';
import { BomMasterComponent } from './bom-master.component';
import { SharedModule } from '../shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import { MatButtonModule } from '@angular/material/button';

@NgModule({
  declarations: [BomMasterComponent],
  imports: [
    CommonModule,
    BomMasterRoutingModule,
    SharedModule,
    NgSelectModule,
    NgbPopoverModule,
    MatButtonModule
  ]
})
export class BomMasterModule { }
