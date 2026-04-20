import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from '../shared/auth/auth.guard';
import { MainComponent } from './main.component';


const routes: Routes = [
  {
    path: '',
    component: MainComponent,
    children: [
      { path: '', canActivate: [AuthGuard], loadChildren: () => import('../dashboard/dashboard.module').then(m => m.DashboardModule) },
      { path: 'bom', canActivate: [AuthGuard], data: { permission: 'BOM.List' }, loadChildren: () => import('../bom-master/bom-master.module').then(m => m.BomMasterModule) },
      { path: 'price-logs', loadChildren: () => import('../price-logs/price-logs.module').then(m => m.PriceLogsModule) },
      { path: 'costsheet', canActivate: [AuthGuard], data: { permission: 'CostSheet.List' }, loadChildren: () => import('../cost-master/cost-master.module').then(m => m.CostMasterModule) },
      { path: 'item', canActivate: [AuthGuard], data: { permission: 'ItemMaster.List' }, loadChildren: () => import('../item-master/item-master.module').then(m => m.ItemMasterModule) },
      { path: 'price', canActivate: [AuthGuard], data: { permission: 'Pricemaster.List' }, loadChildren: () => import('../price-master/price-master.module').then(m => m.PriceMasterModule) },
      { path: 'pack', canActivate: [AuthGuard], data: { permission: 'Packmaster.List' }, loadChildren: () => import('../pack-master/pack-master.module').then(m => m.PackMasterModule) },
      { path: 'sales', canActivate: [AuthGuard], data: { permission: 'SaleSheet.List' }, loadChildren: () => import('../sales-sheet/sales-sheet.module').then(m => m.SalesSheetModule) },

      // { path: 'type', canActivate: [AuthGuard], data: { permission: 'ItemTypeMaster.List' }, loadChildren: () => import('../type-master/type-master.module').then(m => m.TypeMasterModule) },
      { path: 'stage', canActivate: [AuthGuard], data: { permission: 'StageMaster.List' }, loadChildren: () => import('../stage-master/stage-master.module').then(m => m.StageMasterModule) },
      { path: 'logs', canActivate: [AuthGuard], data: { permission: 'ActivityLogs.List' }, loadChildren: () => import('../activity-logs/activity-log.module').then(m => m.ActivityLogModule) },
      { path: 'conversionfactor', canActivate: [AuthGuard], data: { permission: 'ConversionFactorMaster.List' }, loadChildren: () => import('../conversion-factor-master/conversion-factor-master.module').then(m => m.ConversionFactorModule) },
      { path: 'packtype', canActivate: [AuthGuard], data: { permission: 'Packtype.List' }, loadChildren: () => import('../pack-master/pack-master.module').then(m => m.PackMasterModule) },
      { path: 'user-activity', canActivate: [AuthGuard], data: { permission: 'ActivityLogs.List' }, loadChildren: () => import('../user-activity/user-activity.module').then(m => m.UserActivityModule) },

      { path: 'module', loadChildren: () => import('../module-list/module-list.module').then(m => m.ModuleListModule) },
      { path: 'user', canActivate: [AuthGuard], data: { permission: 'User.List' }, loadChildren: () => import('../user/user.module').then(m => m.UserModule) },
      { path: 'report', canActivate: [AuthGuard], data: { permission: 'Commercial.List' }, loadChildren: () => import('../report/report.module').then(m => m.ReportModule) },


      { path: 'access', loadChildren: () => import('../access-manager/access-manager.module').then(m => m.AccessManagerModule) },
      { path: 'setting', canActivate: [AuthGuard], data: { permission: 'Setting.List' }, loadChildren: () => import('../setting/setting.module').then(m => m.SettingModule) },
      { path: 'itemtype', canActivate: [AuthGuard], data: { permission: 'Itemtype.List' }, loadChildren: () => import('../itemtype-master/itemtype-master.module').then(m => m.ItemtypeMasterModule) },
      { path: 'uom', canActivate: [AuthGuard], data: { permission: 'UOM.List' }, loadChildren: () => import('../uom-master/uom-master.module').then(m => m.UomMasterModule) },
      { path: 'customer', canActivate: [AuthGuard], data: { permission: 'Customer.List' }, loadChildren: () => import('../customer/customer.module').then(m => m.CustomerModule) },
      { path: 'migration', canActivate: [AuthGuard], loadChildren: () => import('../data-migration/data-migration.module').then(m => m.DataMigrationModule) },

      { path: 'sales', canActivate: [AuthGuard], data: { permission: 'SaleSheet.List' }, loadChildren: () => import('../sales-sheet/sales-sheet.module').then(m => m.SalesSheetModule) },
      { path: 'profile', canActivate: [AuthGuard], loadChildren: () => import('../user/form/form.module').then(m => m.FormModule) },

      { path: '**', redirectTo: '/404' },
      { path: '404', loadChildren: () => import('../shared/not-found/not-found.module').then(m => m.NotFoundModule) },
    ]
  },
  { path: '**', component: MainComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MainRoutingModule { }
