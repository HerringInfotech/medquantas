import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PriceLogsRoutingModule } from './price-logs-routing.module';
import { PriceLogsComponent } from './price-logs.component';
import { SharedModule } from '../shared/shared.module';


@NgModule({
  declarations: [PriceLogsComponent],
  imports: [
    CommonModule,
    PriceLogsRoutingModule,
    SharedModule
  ]
})
export class PriceLogsModule { }
