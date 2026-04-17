import { Component, OnInit } from '@angular/core';
import { faEdit, faEye, faSearch, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { PermissionService } from '../shared/permission/permission.service';
import { ApiService } from '../shared/api/api.service';
import { CommonService } from '../shared/api/common.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss']
})
export class ReportComponent implements OnInit {
  report_list;
  faEye = faEye;
  faSearch = faSearch;
  pagination_data;
  page_loading: Boolean = false;
  btn_loading: Boolean = false;
  // check_approve: Boolean = false;

  search = '';
  sort = '';
  selectbomtype = '';
  get_param;
  bomtype;
  showDetails: number = -1;

  constructor(private api: ApiService, public router: Router, private common: CommonService, private spinner: NgxSpinnerService, private permission: PermissionService, private route: ActivatedRoute) {
    this.route.params.subscribe((params) => {
      this.get_param = params['search'];
    });
    this.common.change_page.subscribe(data => {
      if (data.section == "commercial") {
        this.get_report(data.page)
      }
    })
  }

  ngOnInit(): void {
    this.get_report(1)
    this.get_bomtype()
  }

  hasPermission(permissionName: any): boolean {
    return this.permission.hasPermission(permissionName);
  }



  get_report(page) {
    this.spinner.show();
    this.page_loading = false;
    let params = {
      pagination: "true",
      page: page,
      per_page: 10,
      language: "en",
      search: this.search,
      selectbomtype: this.selectbomtype,
      sort: this.sort,
      status: this.get_param ? this.get_param : "Approved",
      user: localStorage.getItem("id"),
    }
    this.api.post('get_report', params).subscribe((response) => {
      this.spinner.hide();
      this.page_loading = true;

      if (response.status) {
        this.report_list = response.data?.data;
        // this.check_approve = this.report_list.some(report => report.status === "Approved");
        this.pagination_data = response.data;
        this.common.set_pagination_data(this.pagination_data, 'commercial');
      }
    })
  }

  toggleDetails(index: number) {
    this.showDetails = this.showDetails === index ? -1 : index;
  }

  get_bomtype() {
    let params = {
      pagination: "false",
    }
    this.api.post('get_bomtype', params).subscribe((response) => {
      this.bomtype = response.data.bomtype
    })
  }

  formatDateWithoutTimeZone(dateString) {
    if (!dateString) return "";
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", options);
  }


  change_page(da) {
    this.router.navigateByUrl(`report/form/${da._id}`);
  }
}
