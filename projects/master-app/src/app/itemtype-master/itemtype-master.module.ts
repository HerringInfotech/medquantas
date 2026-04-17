import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ItemtypeMasterRoutingModule } from './itemtype-master-routing.module';
import { ItemtypeMasterComponent } from './itemtype-master.component';
import { SharedModule } from '../shared/shared.module';


@NgModule({
  declarations: [ItemtypeMasterComponent],
  imports: [
    CommonModule,
    ItemtypeMasterRoutingModule,
    SharedModule
  ]
})
export class ItemtypeMasterModule { }
