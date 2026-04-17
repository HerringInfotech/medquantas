import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ViewBomRoutingModule } from './view-bom-routing.module';
import { ViewBomComponent } from './view-bom.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { SharedModule } from '../../shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';



@NgModule({
  declarations: [ViewBomComponent],
  imports: [
    CommonModule,
    ViewBomRoutingModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatButtonModule,

    FormsModule,
    QuillModule.forRoot(),
    SharedModule,
    NgSelectModule,
    NgbModule
  ]
})
export class ViewBomModule { }
