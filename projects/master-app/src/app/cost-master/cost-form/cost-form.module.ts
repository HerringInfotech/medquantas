import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CostFormRoutingModule } from './cost-form-routing.module';
import { CostFormComponent } from './cost-form.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { QuillModule } from 'ngx-quill';
import { SharedModule } from '../../shared/shared.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

@NgModule({
  declarations: [CostFormComponent],
  imports: [
    CommonModule,
    CostFormRoutingModule,
    FormsModule,
    FontAwesomeModule,
    QuillModule.forRoot(),
    SharedModule,
    NgbModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatTooltipModule
  ]
})
export class CostFormModule { }
