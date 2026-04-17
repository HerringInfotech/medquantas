import { Component, OnInit } from '@angular/core';
import { ApiService } from '../shared/api/api.service';
import { CommonService } from '../shared/api/common.service';
import {
  faEdit,
  faEye,
  faPlus,
  faSearch,
  faSort,
  faSortUp,
  faTrashAlt,
  faFileExcel,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { PermissionService } from '../shared/permission/permission.service';
import { NgxSpinnerService } from 'ngx-spinner';
import * as ExcelJS from 'exceljs/dist/exceljs.min.js';
import { debounceTime } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { CurrencyService } from '../shared/currency.service';
@Component({
  selector: 'app-group-master',
  templateUrl: './group-master.component.html',
  styleUrls: ['./group-master.component.scss'],
})
export class GroupMasterComponent implements OnInit {
  btn_loading: Boolean = false;
  search = '';
  sort = '';
  page_loading: Boolean = false;
  pagination_data;
  rate_item;
  permissions;
  faTrashAlt = faTrashAlt;
  faEye = faEye;
  faEdit = faEdit;
  faSearch = faSearch;
  faSortUp = faSortUp;
  faPlus = faPlus;
  faSort = faSort;
  faFileExcel = faFileExcel;
  faSpinner = faSpinner;
  user;
  private searchChanged: Subject<string> = new Subject<string>();

  constructor(
    private api: ApiService,
    private common: CommonService,
    private spinner: NgxSpinnerService,
    private permission: PermissionService,
        public currencyService: CurrencyService

  ) {
        this.currencyService.fetchConversionFactor();

    this.common.delete_detail.subscribe((value) => {
      if (value.page == 'ratemaster') {
        this.delete(value.id);
      }
    });
    this.common.change_page.subscribe((data) => {
      if (data.section == 'ratemaster') {
        this.get_rate(data.page);
      }
    });
  }

  toggleSort(column) {
    this.sort = this.sort.startsWith(`${column}_asc`)
      ? `${column}_desc`
      : `${column}_asc`;
    this.get_rate(1);
  }

  getSortIcon(column) {
    return this.sort.startsWith(`${column}_asc`) ? this.faSortUp : this.faSort;
  }

  ngOnInit(): void {
    this.get_rate(1);
        this.currencyService.fetchConversionFactor();

    this.searchChanged.pipe(debounceTime(300)).subscribe((searchTerm) => {
      this.fetch_items(); // Trigger the API
    });
    this.get_user();
  }

  onSearchChange(value: string) {
    this.searchChanged.next(value);
  }

  get_user() {
    let params = {
      id: localStorage.getItem('user_id'),
    };
    this.api.post('get_user', params).subscribe((response) => {
      this.user = response.data?.users[0];
    });
  }

  get_rate(page) {
    // this.spinner.show();
    this.page_loading = true;

    let params = {
      pagination: 'true',
      page: page,
      per_page: 10,
      language: 'en',
      search: this.search,
      sort: this.sort,
    };
    this.api.post('get_group', params).subscribe((response) => {
      this.rate_item = response.data?.pagedRates;
      this.pagination_data = response.data;
      this.common.set_pagination_data(this.pagination_data, 'ratemaster');
      this.page_loading = false;
    });
  }

  fetch_items() {
    let params = {
      pagination: 'true',
      per_page: 10,
      language: 'en',
      search: this.search,
      sort: this.sort,
    };
    this.api.post('get_group', params).subscribe((response) => {
      this.rate_item = response.data?.pagedRates;
      this.pagination_data = response.data;
      this.common.set_pagination_data(this.pagination_data, 'ratemaster');
    });
  }

  hasPermission(permissionName: any): boolean {
    return this.permission.hasPermission(permissionName);
  }

  convert_to_currency(rate) {
    if (rate) {
      var parts = rate.toString().split('.');
      parts[0] = parts[0].replace(/(\d)(?=(\d\d)+\d$)/g, '$1,');
      return parts.join('.');
    } else {
      return 0;
    }
  }

  delete(id) {
    let params = {
      id: id,
      user: this.user,
    };
    this.api.post('delete_rate', params).subscribe((response) => {
      this.get_rate(1);
      this.common.alert({
        msg: response.message,
        type: response.status ? 'success' : 'danger',
      });
    });
  }

  confirm_delete(data) {
    data.page = 'ratemaster';
    data.message = 'Are you sure to delete this Rate?';
    this.common.set_delete_confirmation_data(data);
  }
}
