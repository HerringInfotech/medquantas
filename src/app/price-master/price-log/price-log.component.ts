import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ApiService } from '../../shared/api/api.service';
import { CommonService } from '../../shared/api/common.service';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe, Location } from "@angular/common";
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-price-log',
  templateUrl: './price-log.component.html',
  styleUrls: ['./price-log.component.scss']
})
export class PriceLogComponent implements OnInit {
  log_id
  itemLog
  pagination_data
  page = 1
  page_loading: Boolean = false;

  constructor(private api: ApiService, private spinner: NgxSpinnerService, private location: Location, private common: CommonService, private router: Router, private route: ActivatedRoute) {
    this.common.change_page.subscribe(data => {
      if (data.section == "ratelog") {
        this.get_log(data.page)
      }
    })
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.log_id = params.id
      if (this.log_id) {
        this.get_log(1);
      }
    })
  }

  get_log(page) {
    this.spinner.show();
    let params = {
      pagination: "true",
      page: page,
      per_page: 10,
      id: this.log_id,
    }
    this.api.post('get_log', params).subscribe((response) => {
      this.spinner.hide();
      this.page_loading = false;
      this.itemLog = response.data.ratelogs.docs
      this.pagination_data = response.data.ratelogs;
      this.common.set_pagination_data(this.pagination_data, 'ratelog');
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
    };
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", options);
  }

  goBack(): void {
    this.location.back();
  }
}
