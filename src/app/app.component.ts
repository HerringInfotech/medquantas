import { Component, OnInit } from '@angular/core';
import { ApiService } from './shared/api/api.service';
import { PermissionService } from './shared/permission/permission.service';
import { CommonService } from './shared/api/common.service';
import { MatSnackBar, MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';
import { CurrencyService } from './shared/currency.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'master-app';
  permissions: any[] = [];
  subscriptions = [];
  horizontalPosition: MatSnackBarHorizontalPosition = 'end';
  verticalPosition: MatSnackBarVerticalPosition = 'top';




  constructor(private api: ApiService, private permissionService: PermissionService, private common: CommonService, private _snackBar: MatSnackBar,private currencyService: CurrencyService) {
    this.subscriptions.push(this.common.on_alert.subscribe(value => {
      let message = value.msg || "this is Costing app msg"
      if (value?.category == 'Login') {
        this._snackBar.open(message, 'Close', { duration: 5000, horizontalPosition: this.horizontalPosition, verticalPosition: this.verticalPosition });
      }
      else {
        this._snackBar.open(message, 'Close', { duration: 2000 });
      }
    }))
   }

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    if (token && token !== '') {
      this.checkPermission();
    }
    this.currencyService.fetchConversionFactor();
  }

  checkPermission() {
    let params = {}
    this.api.post('speed', params).subscribe((response) => {
      if (response.status) {
        this.permissions = response.data?.user_access;
        this.permissions.forEach((permission) => {
          this.permissionService.addUserPermission(permission);
        });
      }
    })
  }
}
