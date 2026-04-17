import { Component, OnInit } from '@angular/core';
import { ApiService } from '../shared/api/api.service';
import { CommonService } from '../shared/api/common.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { PermissionService } from '../shared/permission/permission.service';

@Component({
  selector: 'app-module-list',
  templateUrl: './module-list.component.html',
  styleUrls: ['./module-list.component.scss'],
})
export class ModuleListComponent implements OnInit {
  page_loading: Boolean = false;
  module;
  pagination_data;
  page: 1;
  faTrashAlt = faTrashAlt;
  permissions;
  user;
  constructor(
    private api: ApiService,
    private common: CommonService,
    private spinner: NgxSpinnerService,
    private permissionService: PermissionService
  ) {
    this.common.change_page.subscribe((data) => {
      if (data.section == 'module') {
        this.get_module(data.page);
      }
    });
    this.common.delete_detail.subscribe((value) => {
      if (value.page == 'module') {
        this.delete(value.id);
      }
    });
  }

  ngOnInit(): void {
    this.get_module(1);
    this.get_user();
  }
  get_user() {
    let params = {
      id: localStorage.getItem('user_id'),
    };
    this.api.post('get_user', params).subscribe((response) => {
      this.user = response.data?.users[0];
    });
  }
  get_module(page) {
    this.spinner.show();
    let params = {
      pagination: 'true',
      page: page,
      per_page: 10,
    };
    this.api.post('get_module', params).subscribe((response) => {
      this.spinner.hide();
      this.page_loading = false;
      this.module = response.data.modules.docs;
      this.pagination_data = response.data.modules;
      this.common.set_pagination_data(this.pagination_data, 'module');
    });
  }

  delete(id) {
    let params = {
      id: id,
      user: this.user,
    };
    this.api.post('delete_module', params).subscribe((response) => {
      this.get_module(1);
      this.common.alert({
        msg: response.message,
        type: response.status ? 'success' : 'danger',
      });
      // location.reload();

      // this.checkPermission()
    });
  }
  confirm_delete(data) {
    data.page = 'module';
    data.message = 'Are you sure to delete this Measurement module?';
    this.common.set_delete_confirmation_data(data);
  }

  checkPermission() {
    let params = {
      toke: localStorage.getItem('token'),
    };
    this.api.post('speed', params).subscribe((response) => {
      if (response.status) {
        this.permissions = response.data?.user_access;
        this.permissions.forEach((permission) => {
          this.permissionService.addUserPermission(permission);
        });
      }
    });
  }
}
