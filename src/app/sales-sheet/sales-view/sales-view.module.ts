import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SalesViewRoutingModule } from './sales-view-routing.module';
import { SalesViewComponent } from './sales-view.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [SalesViewComponent],
  imports: [
    CommonModule,
    SalesViewRoutingModule,
    FontAwesomeModule,
    FormsModule
  ]
})
export class SalesViewModule { }
