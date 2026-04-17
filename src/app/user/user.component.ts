import { Component, OnInit } from '@angular/core';
import { ApiService } from '../shared/api/api.service';
import { CommonService } from '../shared/api/common.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { faEdit, faPlus, faSearch, faTrashAlt } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent implements OnInit {
  user_list;
  btn_loading: Boolean = false;
  form;
  pagination_data;
  page = 1;
  data: { status: string };
  faEdit = faEdit;
  faPlus = faPlus;

  constructor(private spinner: NgxSpinnerService, private api: ApiService, private common: CommonService) {
    this.common.change_page.subscribe(data => {
      if (data.section == "users") {
        this.get_user(data.page)
      }
    })
  }

  ngOnInit(): void {
    this.get_user(1)
  }

  get_user(page) {
    this.spinner.show();
    let params = {
      pagination: "true",
      page: page,
      per_page: 10,
      language: "en",
    }
    this.api.post('get_user', params).subscribe((response) => {
      this.spinner.hide();
      if (response.status) {
        this.user_list = response.data?.users.docs;
        this.pagination_data = response.data.users;
        this.common.set_pagination_data(this.pagination_data, 'users');
      }
    })
  }

  formatDateWithoutTimeZone(dateString) {
    if (!dateString) return "";
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    };
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", options);
  }


  toggleStatus(data) {
    data.status = data.status === 'Active' ? 'Inactive' : 'Active';
    let params = {
      "id": data.id,
      "newStatus": data.status
    }
    this.api.post('change_status', params).subscribe((response) => {
      this.common.alert({ msg: response.message, type: (response.status) ? 'success' : 'danger' });
    })
  }
}
