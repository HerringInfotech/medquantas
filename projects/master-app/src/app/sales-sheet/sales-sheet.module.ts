import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SalesSheetRoutingModule } from './sales-sheet-routing.module';
import { SalesSheetComponent } from './sales-sheet.component';
import { SharedModule } from '../shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import { MatButtonModule } from '@angular/material/button';


@NgModule({
  declarations: [SalesSheetComponent],
  imports: [
    CommonModule,
    SalesSheetRoutingModule,
    SharedModule,
    NgSelectModule,
    NgbPopoverModule,
    MatButtonModule
  ]
})
export class SalesSheetModule { }
