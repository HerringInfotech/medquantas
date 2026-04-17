import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DataMigrationComponent } from './data-migration.component';

const routes: Routes = [
  { path: '', component: DataMigrationComponent },
  { path: 'erb/:id', loadChildren: () => import('./erb-logs/erb-logs.module').then(m => m.ErbLogsModule) },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DataMigrationRoutingModule { }
