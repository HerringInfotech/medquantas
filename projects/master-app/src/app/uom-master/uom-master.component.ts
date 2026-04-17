import { Component, OnInit } from '@angular/core';
import { ApiService } from '../shared/api/api.service';
import { CommonService } from '../shared/api/common.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { PermissionService } from '../shared/permission/permission.service';
import { faEdit, faPlus, faSearch, faSort, faSortUp, faTrashAlt } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-uom-master',
  templateUrl: './uom-master.component.html',
  styleUrls: ['./uom-master.component.scss']
})
export class UomMasterComponent implements OnInit {
  measurement_list
  page = 1;
  page_loading: Boolean = false;
  pagination_data;
  search = '';
  sort = "";
  faTrashAlt = faTrashAlt;
  faEdit = faEdit;
  faSortUp = faSortUp;
  faSort = faSort;
  faPlus = faPlus;
  faSearch = faSearch;

  constructor(private api: ApiService, private common: CommonService, private spinner: NgxSpinnerService, private permission: PermissionService) {
    this.common.delete_detail.subscribe(value => {
      if (value.page == 'uom') {
        this.delete(value.id);
      }
    })
    this.common.change_page.subscribe(data => {
      if (data.section == "uom") {
        this.get_unit(data.page)
      }
    })
  }

  ngOnInit(): void {
    this.get_unit(1);
  }

  toggleSort(column) {
    this.sort = this.sort.startsWith(`${column}_asc`) ? `${column}_desc` : `${column}_asc`;
    this.get_unit(1);
  }

  getSortIcon(column) {
    return this.sort.startsWith(`${column}_asc`) ? this.faSortUp : this.faSort;
  }

  hasPermission(permissionName: any): boolean {
    return this.permission.hasPermission(permissionName);
  }

  get_unit(page) {
    this.spinner.show();
    let params = {
      pagination: "true",
      page: page,
      per_page: 10,
      language: "en",
      search: this.search,
      sort: this.sort
    }
    this.api.post('get_unit', params).subscribe((response) => {
      this.page_loading = false;
      this.spinner.hide();
      this.measurement_list = response.data.units.docs
      this.pagination_data = response.data.units;
      this.common.set_pagination_data(this.pagination_data, 'uom');
    })
  }

  delete(id) {
    let params =
    {
      id: id
    }
    this.api.post('delete_unit', params).subscribe((response) => {
      this.get_unit(1);
      this.common.alert({ msg: response.message, type: (response.status) ? 'success' : 'danger' });
    })
  }
  confirm_delete(data) {
    data.page = "uom";
    data.message = "Are you sure to delete this Measurement UOM?";
    this.common.set_delete_confirmation_data(data);
  }
}
