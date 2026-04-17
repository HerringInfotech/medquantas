import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FgmasterFormRoutingModule } from './fgmaster-form-routing.module';
import { FgmasterFormComponent } from './fgmaster-form.component';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from '../../shared/shared.module';


@NgModule({
  declarations: [FgmasterFormComponent],
  imports: [
    CommonModule,
    FgmasterFormRoutingModule,
    FormsModule,
    NgSelectModule,
    SharedModule
  ]
})
export class FgmasterFormModule { }
