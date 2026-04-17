import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccordionModule } from 'ngx-bootstrap/accordion';
import { MainRoutingModule } from './main-routing.module';
import { MainComponent } from './main.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AlertModule } from 'ngx-bootstrap/alert';
import { NgxSpinnerModule } from "ngx-spinner";
import { HeaderComponent } from './header/header.component';
import { SharedModule } from '../shared/shared.module';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ModalModule } from 'ngx-bootstrap/modal';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from './sidebar/sidebar.component';






@NgModule({
  declarations: [MainComponent, HeaderComponent, SidebarComponent],
  imports: [
    CommonModule,
    MainRoutingModule,
    AccordionModule.forRoot(),
    FontAwesomeModule,
    AlertModule.forRoot(),
    NgxSpinnerModule,
    SharedModule,
    MatSnackBarModule,
    ModalModule.forRoot(),
    FormsModule
  ]
})
export class MainModule { }
