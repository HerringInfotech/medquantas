import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ApiService } from '../../shared/api/api.service';
import { CommonService } from '../../shared/api/common.service';
import { ActivatedRoute, Router } from '@angular/router';
import { faArrowLeft, faCalendar } from '@fortawesome/free-solid-svg-icons';
import * as moment from 'moment';
import { DatePipe, Location } from "@angular/common";
import { BsDatepickerDirective } from 'ngx-bootstrap/datepicker';

@Component({
  selector: 'app-group-form',
  templateUrl: './group-form.component.html',
  styleUrls: ['./group-form.component.scss']
})
export class GroupFormComponent implements OnInit {
  btn_loading: Boolean = false;
  Isdata: Boolean = false;
  israte: Boolean = false;
  formValues: object = {}
  search_data;
  isValidate: Boolean = false;
  rateID;
  minDate = new Date();
  delivery_date;
  faCalendar = faCalendar;
  isVendor: Boolean = false;
  codeError = '';
  IsExpired: Boolean = false;
  faArrowLeft = faArrowLeft
  page_loader: boolean = false
user;
  constructor(private api: ApiService, private location: Location, private common: CommonService, private router: Router, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.rateID = params.id
      if (this.rateID) {
        this.get_rate(this.rateID);
      }


    })
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

  formSubmit(formData: NgForm) {
    try {
      if (formData.valid && this.formValues['itemID'] !== "" && this.codeError == '') {
        this.btn_loading = true;
        this.formValues['user_ID'] = localStorage.getItem('user_id')
        const payload = {
          ...this.formValues,
          user: this.user,
        };
        this.api.post('update_group', payload).subscribe(response => {
          this.btn_loading = false;
          this.common.alert({ msg: response.message, type: (response.status) ? 'success' : 'danger' });
          if (response.status) this.router.navigateByUrl('group');
        })
      }
      else {
        if (this.formValues['itemID'] == "") {
          this.israte = true;
        }
        let message = "please fill all the data"
        this.common.alert({ msg: message, type: 'danger' });
      }
    } catch (e) {
    }
  }

  Check_item(e) {
    this.codeError = "";
    this.formValues['itemID'] = "";
    let params = {
      search: this.formValues['item_name']
    };
    this.api.post('get_item', params).subscribe(response => {
      if (response.data?.item.length !== 0) {
        this.Isdata = true;
        this.search_data = response.data.item
      }
      else {
        this.Isdata = false;
        this.search_data = []
      }
    })
  }

  calculation_rate() {
    const item_rate = parseFloat(this.formValues['rate']);
    const item_gst = parseFloat(this.formValues['gst']);
  }

  update_gst() {
    this.formValues['gstSGST'] = parseFloat(this.formValues['gst']) / 2;
    this.formValues['gstCGST'] = parseFloat(this.formValues['gst']) / 2;
  }

  check_price(data) {
    let params = {
      code: data.item_code,
    }
    this.api.post('check_price', params).subscribe((response) => {
      if (response.message) {
        this.codeError = response.message;
      }
      else {
        this.codeError = "";
      }
    })
  }

  selectdata(data) {
    this.Isdata = false;
    this.formValues['item_name'] = data.name;
    this.formValues['itemID'] = data.id;
    if (this.codeError == "") {
      this.formValues['item_name'] = data.name;
      this.formValues['item_code'] = data.code;
      this.formValues['itemtypeID'] = data.itemtypeID;
      this.israte = false;
    }
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

  get_rate(id) {
    this.page_loader = true;

    let params = {
      id: id,
    }
    this.api.post('get_group', params).subscribe((response) => {
      this.page_loader = false;

      var data = response.data.pagedRates[0]
      this.formValues = data;
    })
  }

  onVendorChange() {
    this.isVendor = false;
  }

  resetForm(formData: NgForm) {
    formData.resetForm();
  }

  goBack(): void {
    this.location.back();
  }
}
