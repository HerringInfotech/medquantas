import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CostMasterRoutingModule } from './cost-master-routing.module';
import { CostMasterComponent } from './cost-master.component';
import { SharedModule } from '../shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import { MatButtonModule } from '@angular/material/button';

@NgModule({
  declarations: [CostMasterComponent],
  imports: [
    CommonModule,
    CostMasterRoutingModule,
    SharedModule,
    NgSelectModule,
    NgbPopoverModule,
    MatButtonModule
  ]
})
export class CostMasterModule { }
