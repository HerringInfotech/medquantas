import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataMigrationRoutingModule } from './data-migration-routing.module';
import { DataMigrationComponent } from './data-migration.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@NgModule({
  declarations: [DataMigrationComponent],
  imports: [
    CommonModule,
    FormsModule,
    DataMigrationRoutingModule,
    FontAwesomeModule
  ]
})
export class DataMigrationModule { }
