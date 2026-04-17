import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ErbLogsRoutingModule } from './erb-logs-routing.module';
import { ErbLogsComponent } from './erb-logs.component';
import { SharedModule } from '../../shared/shared.module';


@NgModule({
  declarations: [ErbLogsComponent],
  imports: [
    CommonModule,
    ErbLogsRoutingModule,
    SharedModule
  ]
})
export class ErbLogsModule { }
