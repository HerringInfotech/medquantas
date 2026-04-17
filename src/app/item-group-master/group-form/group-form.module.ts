import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GroupFormRoutingModule } from './group-form-routing.module';
import { GroupFormComponent } from './group-form.component';
import { FormsModule } from '@angular/forms';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SharedModule } from '../../shared/shared.module';


@NgModule({
  declarations: [GroupFormComponent],
  imports: [
    CommonModule,
    GroupFormRoutingModule,
    FormsModule,
    BsDatepickerModule.forRoot(),
    FontAwesomeModule,
    NgSelectModule,
    NgbModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    SharedModule
  ],
  providers: [
    DatePipe,
  ],
})
export class GroupFormModule { }
