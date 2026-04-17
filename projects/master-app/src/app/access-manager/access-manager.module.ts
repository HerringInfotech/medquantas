import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AccessManagerRoutingModule } from './access-manager-routing.module';
import { AccessManagerComponent } from './access-manager.component';
import { SharedModule } from '../shared/shared.module';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';


@NgModule({
  declarations: [AccessManagerComponent],
  imports: [
    CommonModule,
    AccessManagerRoutingModule,
    SharedModule,
    NgSelectModule,
    FormsModule
  ]
})
export class AccessManagerModule { }
