import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PriceLogRoutingModule } from './price-log-routing.module';
import { PriceLogComponent } from './price-log.component';
import { SharedModule } from '../../shared/shared.module';


@NgModule({
  declarations: [PriceLogComponent],
  imports: [
    CommonModule,
    PriceLogRoutingModule,
    SharedModule
  ]
})
export class PriceLogModule { }
