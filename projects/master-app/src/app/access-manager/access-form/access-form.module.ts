import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AccessFormRoutingModule } from './access-form-routing.module';
import { AccessFormComponent } from './access-form.component';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [AccessFormComponent],
  imports: [
    CommonModule,
    AccessFormRoutingModule,
    FormsModule
  ]
})
export class AccessFormModule { }
