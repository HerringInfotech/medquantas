import { Component, OnInit } from '@angular/core';
import { CommonService } from '../shared/api/common.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ApiService } from '../shared/api/api.service';
import { PermissionService } from '../shared/permission/permission.service';
import {
  faEdit,
  faPlus,
  faSearch,
  faSort,
  faSortUp,
  faTrashAlt,
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-pack-master',
  templateUrl: './pack-master.component.html',
  styleUrls: ['./pack-master.component.scss'],
})
export class PackMasterComponent implements OnInit {
  page = 1;
  page_loading: Boolean = false;
  packtype;
  pagination_data;
  search = '';
  sort = '';
  permissions;
  faEdit = faEdit;
  faTrashAlt = faTrashAlt;
  faSortUp = faSortUp;
  faSort = faSort;
  faSearch = faSearch;
  faPlus = faPlus;
  user;
deleteInProgress = false;
  deleteSub: any;

  constructor(
    private api: ApiService,
    private common: CommonService,
    private spinner: NgxSpinnerService,
    private permission: PermissionService
  ) {
    
    this.common.change_page.subscribe((data) => {
      if (data.section == 'packtype') {
        this.get_packtype(data.page);
      }
    });
  }

  ngOnInit(): void {
    this.get_packtype(1);
    this.get_current_user();
    this.deleteSub = this.common.delete_detail.subscribe((value) => {
      if (value.page == 'packtype') {
        this.delete(value.id);
      }
    });
  }
ngOnDestroy(): void {
    if (this.deleteSub) {
      this.deleteSub.unsubscribe();
    }
  }
  toggleSort(column) {
    this.sort = this.sort.startsWith(`${column}_asc`)
      ? `${column}_desc`
      : `${column}_asc`;
    this.get_packtype(1);
  }

  getSortIcon(column) {
    return this.sort.startsWith(`${column}_asc`) ? this.faSortUp : this.faSort;
  }

  get_current_user() {
    let params = {
      id: localStorage.getItem('user_id'),
    };
    this.api.post('get_user', params).subscribe((response) => {
      this.user = response.data?.users[0];
    });
  }

  get_packtype(page) {
    this.spinner.show();
    this.page_loading = true;
    let params = {
      pagination: 'true',
      page: page,
      per_page: 10,
      language: 'en',
      search: this.search,
      sort: this.sort,
    };
    this.api.post('get_pack', params).subscribe((response) => {
      this.page_loading = false;
      this.spinner.hide();
      this.packtype = response.data.packtype.docs;
      this.pagination_data = response.data.packtype;
      this.common.set_pagination_data(this.pagination_data, 'packtype');
    });
  }

  hasPermission(permissionName: any): boolean {
    return this.permission.hasPermission(permissionName);
  }

  delete(id) {
  if (this.deleteInProgress) return;

  this.deleteInProgress = true;
  const params = {
    id: id,
    user: this.user,
  };

  this.api.post('delete_pack', params).subscribe((response) => {
    this.get_packtype(1);
    this.common.alert({
      msg: response.message,
      type: response.status ? 'success' : 'danger',
    });
        this.deleteInProgress = false; 

  }, () => {
    this.deleteInProgress = false; 
  });
}
  confirm_delete(data) {
    data.page = 'packtype';
    data.message = 'Are you sure to delete this packtype?';
    this.common.set_delete_confirmation_data(data);
  }
}
