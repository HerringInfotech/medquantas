import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SharedModule } from '../shared/shared.module';

import { UserActivityRoutingModule } from './user-activity-routing.module';
import { UserActivityComponent } from './user-activity.component';


@NgModule({
  declarations: [UserActivityComponent],
  imports: [
    CommonModule,
    UserActivityRoutingModule,
    FormsModule,
    FontAwesomeModule,
    SharedModule
  ]
})
export class UserActivityModule { }
