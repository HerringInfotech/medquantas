import { Component, OnInit } from '@angular/core';
import { ApiService } from '../shared/api/api.service';
import { CommonService } from '../shared/api/common.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { PermissionService } from '../shared/permission/permission.service';
import { faEdit, faPlus, faSearch, faSort, faSortUp, faTrashAlt } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-stage-master',
  templateUrl: './stage-master.component.html',
  styleUrls: ['./stage-master.component.scss']
})
export class StageMasterComponent implements OnInit {
  page = 1;
  page_loading: Boolean = false;
  stageList=[]
  pagination_data;
  search = '';
  sort = "";
  permissions;
  faTrashAlt = faTrashAlt;
  faEdit = faEdit;
  faSearch = faSearch;
  faSortUp = faSortUp;
  faSort = faSort;
  faPlus = faPlus


  constructor(private api: ApiService, private common: CommonService, private spinner: NgxSpinnerService, private permission: PermissionService) {
    this.common.delete_detail.subscribe(value => {
      if (value.page == 'stage') {
        this.delete(value.id);
      }
    })
    this.common.change_page.subscribe(data => {
      if (data.section == "stage") {
        this.get_stage(data.page)
      }
    })
  }

  toggleSort(column) {
    this.sort = this.sort.startsWith(`${column}_asc`) ? `${column}_desc` : `${column}_asc`;
    this.get_stage(1);
  }

  getSortIcon(column) {
    return this.sort.startsWith(`${column}_asc`) ? this.faSortUp : this.faSort;
  }

  ngOnInit(): void {
    this.get_stage(1);
  }

  get_stage(page) {
    this.spinner.show();
    let params = {
      pagination: "true",
      page: page,
      per_page: 10,
      language: "en",
      search: this.search,
      sort: this.sort
    }
    this.api.post('get_stage', params).subscribe((response) => {
      this.page_loading = false;
      this.spinner.hide();
      this.stageList = response.data?.stage.docs
      this.pagination_data = response.data.stage;
      this.common.set_pagination_data(this.pagination_data, 'stage');
    })
  }

  hasPermission(permissionName: any): boolean {
    return this.permission.hasPermission(permissionName);
  }

  delete(id) {
    let params =
    {
      id: id
    }
    this.api.post('delete_itemtype', params).subscribe((response) => {
      this.get_stage(1);
      this.common.alert({ msg: response.message, type: (response.status) ? 'success' : 'danger' });
    })
  }


  confirm_delete(data) {
    data.page = "stage";
    data.message = "Are you sure to delete this Item Type?";
    this.common.set_delete_confirmation_data(data);
  }
}
