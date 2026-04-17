import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ItemtypeFormRoutingModule } from './itemtype-form-routing.module';
import { ItemtypeFormComponent } from './itemtype-form.component';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [ItemtypeFormComponent],
  imports: [
    CommonModule,
    ItemtypeFormRoutingModule,
    FormsModule
  ]
})
export class ItemtypeFormModule { }
