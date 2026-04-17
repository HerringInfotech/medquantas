import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GroupMasterRoutingModule } from './group-master-routing.module';
import { GroupMasterComponent } from './group-master.component';
import { SharedModule } from '../shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatButtonModule } from '@angular/material/button';


@NgModule({
  declarations: [GroupMasterComponent],
  imports: [
    CommonModule,
    GroupMasterRoutingModule,
    SharedModule,
    NgSelectModule,
    MatButtonModule
  ]
})
export class GroupMasterModule { }
