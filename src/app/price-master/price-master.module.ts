import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PriceMasterRoutingModule } from './price-master-routing.module';
import { PriceMasterComponent } from './price-master.component';
import { SharedModule } from '../shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatButtonModule } from '@angular/material/button';


@NgModule({
  declarations: [PriceMasterComponent],
  imports: [
    CommonModule,
    PriceMasterRoutingModule,
    SharedModule,
    NgSelectModule,
    MatButtonModule
  ]
})
export class PriceMasterModule { }
