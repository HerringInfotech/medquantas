import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PackFormRoutingModule } from './pack-form-routing.module';
import { PackFormComponent } from './pack-form.component';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { SharedModule } from '../../shared/shared.module';


@NgModule({
  declarations: [PackFormComponent],
  imports: [
    CommonModule,
    PackFormRoutingModule,
    FormsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    SharedModule
  ]
})
export class PackFormModule { }
