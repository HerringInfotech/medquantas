import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ItemMasterRoutingModule } from './item-master-routing.module';
import { ItemMasterComponent } from './item-master.component';
import { SharedModule } from '../shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MatButtonModule } from '@angular/material/button';


@NgModule({
  declarations: [ItemMasterComponent],
  imports: [
    CommonModule,
    ItemMasterRoutingModule,
    SharedModule,
    NgSelectModule,
    NgbModule,
    MatButtonModule
  ]
})
export class ItemMasterModule { }
