import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ModuleFormRoutingModule } from './module-form-routing.module';
import { ModuleFormComponent } from './module-form.component';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [ModuleFormComponent],
  imports: [
    CommonModule,
    ModuleFormRoutingModule,
    FormsModule,
  ]
})
export class ModuleFormModule { }
