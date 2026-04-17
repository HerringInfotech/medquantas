import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';
import * as CanvasJSAngularChart from '../../assets/canvasjs.angular.component';
import { FormsModule } from '@angular/forms';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ModalModule } from 'ngx-bootstrap/modal';
var CanvasJSChart = CanvasJSAngularChart.CanvasJSChart;




@NgModule({
  declarations: [DashboardComponent,CanvasJSChart],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    FormsModule,
    NgxSpinnerModule,
    ModalModule.forRoot()
  ]
})
export class DashboardModule { }
