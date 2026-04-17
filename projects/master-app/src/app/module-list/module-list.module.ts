import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ModuleListRoutingModule } from './module-list-routing.module';
import { ModuleListComponent } from './module-list.component';
import { SharedModule } from '../shared/shared.module';


@NgModule({
  declarations: [ModuleListComponent],
  imports: [
    CommonModule,
    ModuleListRoutingModule,
    SharedModule
  ]
})
export class ModuleListModule { }
