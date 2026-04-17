import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ViewReportRoutingModule } from './view-report-routing.module';
import { ViewReportComponent } from './view-report.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [ViewReportComponent],
  imports: [
    CommonModule,
    ViewReportRoutingModule,
    FontAwesomeModule,
    NgbModule,
    FormsModule
  ]
})
export class ViewReportModule { }
