import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { PaginationComponent } from './pagination/pagination.component';
import { NotDataComponent } from './not-data/not-data.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { ResizableColumnDirective } from './api/size.directive';
import { NumberDirective } from '../number.directive';
import { LoaderComponent } from './loader/loader.component';
import { AiChatComponent } from './ai-chat/ai-chat.component';
import { AiFormatPipe } from './ai-chat/ai-format.pipe';

@NgModule({
  declarations: [PaginationComponent, NotDataComponent, ResizableColumnDirective, NumberDirective, LoaderComponent, AiChatComponent, AiFormatPipe],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    NgbModule,
    TooltipModule.forRoot(),
  ],
  exports: [
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    PaginationComponent,
    NgbModule,
    NotDataComponent,
    FontAwesomeModule,
    FormsModule,
    ResizableColumnDirective,
    LoaderComponent,
    NumberDirective,
    AiChatComponent,
    AiFormatPipe
  ],
  providers: [],
})

export class SharedModule { }
