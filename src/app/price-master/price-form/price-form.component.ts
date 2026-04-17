import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ApiService } from '../../shared/api/api.service';
import { CommonService } from '../../shared/api/common.service';
import { ActivatedRoute, Router } from '@angular/router';
import { faArrowLeft, faCalendar } from '@fortawesome/free-solid-svg-icons';
import { Location } from '@angular/common';
import { CurrencyService } from '../../shared/currency.service';

@Component({
  selector: 'app-price-form',
  templateUrl: './price-form.component.html',
  styleUrls: ['./price-form.component.scss'],
})
export class PriceFormComponent implements OnInit {
  btn_loading: boolean = false;
  Isdata: boolean = false;
  israte: boolean = false;
  formValues: any = {};
  search_data;
  isValidate: boolean = false;
  rateID;
  minDate = new Date();
  delivery_date;
  faCalendar = faCalendar;
  codeError = '';
  IsExpired: boolean = false;
  faArrowLeft = faArrowLeft;
  page_loader: boolean = false;
  role;
  user;

  constructor(
    private api: ApiService,
    private location: Location,
    private common: CommonService,
    private router: Router,
    private route: ActivatedRoute,
    public currencyService: CurrencyService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.rateID = params.id;
      if (this.rateID) {
        this.get_rate(this.rateID);
      }
    });
    this.get_role();
    this.get_user();
  }

  get_role() {
    let params = {
      id: localStorage.getItem('id'),
    };
    this.api.post('get_role', params).subscribe((response) => {
      this.role = response.data?.roles[0];
    });
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
      if (
        formData.valid &&
        this.formValues['itemID'] !== '' &&
        this.codeError == ''
      ) {
        this.btn_loading = true;
        const payload = {
          ...this.formValues,
          user: this.user,
          role: this.role,
        };
        this.api.post('update_rate', payload).subscribe((response) => {
          this.btn_loading = false;
          this.common.alert({
            msg: response.message,
            type: response.status ? 'success' : 'danger',
          });
          if (response.status) this.router.navigateByUrl('price');
        });
      } else {
        if (this.formValues['itemID'] == '') {
          this.israte = true;
        }
        let message = 'please fill all the data';
        this.common.alert({ msg: message, type: 'danger' });
      }
    } catch (e) {
    }
  }

  Check_item(e) {
    this.codeError = '';
    this.formValues['itemID'] = '';
    let params = {
      search: this.formValues['item_name'],
    };
    this.api.post('get_item', params).subscribe((response) => {
      if (response.data?.item.length !== 0) {
        this.Isdata = true;
        this.search_data = response.data.item;
      } else {
        this.Isdata = false;
        this.search_data = [];
      }
    });
  }

  calculation_rate() {
    const item_rate = parseFloat(this.formValues['rate']);
    const item_gst = parseFloat(this.formValues['gst']);
  }

  update_gst() {
    const currency = (this.formValues['currency'] || '').toUpperCase();
    if (currency !== 'INR') {
      this.formValues['gst'] = 0;
      this.formValues['gstSGST'] = 0;
      this.formValues['gstCGST'] = 0;
      return;
    }
    const gstVal = parseFloat(this.formValues['gst']) || 0;
    this.formValues['gst'] = gstVal;
    this.formValues['gstSGST'] = parseFloat((gstVal / 2).toFixed(3));
    this.formValues['gstCGST'] = parseFloat((gstVal / 2).toFixed(3));
  }

  clearZero(field: string) {
    if (Number(this.formValues[field]) === 0) {
      this.formValues[field] = null;
    }
  }

  check_price(data) {
    let params = {
      code: data.item_code,
    };
    this.api.post('check_price', params).subscribe((response) => {
      if (response.message) {
        this.codeError = response.message;
      } else {
        this.codeError = '';
      }
    });
  }

  selectdata(data) {
    this.Isdata = false;
    this.formValues['item_name'] = data.name;
    this.formValues['itemID'] = data.id;
    if (this.codeError == '') {
      this.formValues['item_name'] = data.name;
      this.formValues['item_code'] = data.code;
      this.formValues['code'] = data.code;
      this.formValues['itemtypeID'] = data.itemtypeID;
      this.formValues['convertUnit'] = data.convertUnit;
      this.formValues['issueUom'] = data.buyUnit;
      this.israte = false;
    }
  }

  convert_to_currency(rate) {
    if (rate) {
      var parts = rate.toString().split('.');
      parts[0] = parts.replace(/(\d)(?=(\d{2})+(?!\d))/g, '$1,'); // ✅ Fixed regex
      return parts.join('.');
    } else {
      return 0;
    }
  }

  parseFloatValue(value: any): number {
    return parseFloat(value) || 0;
  }

  get_rate(id) {
    this.page_loader = true;
    let params = { id: id };
    this.api.post('get_rate', params).subscribe({
      next: (response) => {
        this.page_loader = false;
        this.formValues = response.data.rate[0];
        if (this.formValues.item_pop) {
          this.formValues.convertUnit = this.formValues.item_pop.convertUnit;
          this.formValues.issueUom = this.formValues.item_pop.buyUnit;
        }
        if (!this.formValues.grnRate) {
          this.formValues.grnRate = "0";
        }
        if (!this.formValues.prevGrnrate) {
          this.formValues.prevGrnrate = "0";
        }
        if (!this.formValues.prevrate) {
          this.formValues.prevrate = "0";
        }

        // Normalize numeric fields to strip trailing zeros from API strings
        const fieldsToNormalize = ['gst', 'gstCGST', 'gstSGST', 'rate', 'grnRate', 'convert', 'bsrt', 'prevrate', 'prevGrnrate'];
        fieldsToNormalize.forEach(field => {
          if (this.formValues[field] != null) {
            this.formValues[field] = parseFloat(this.formValues[field]);
          }
        });
      },
      error: (error) => {
        this.page_loader = false; // ✅ Reset on error
        console.error('Error fetching rate:', error);
        this.common.alert({
          msg: 'Failed to load rate data',
          type: 'danger'
        });
      }
    });
  }

  resetForm(formData: NgForm) {
    formData.resetForm();
  }

  goBack(): void {
    this.location.back();
  }

  getDisplayGrnRate() {
    const grnRate = this.formValues?.grnRate || "0";
    const numericRate = parseFloat(grnRate);

    if (isNaN(numericRate)) {
      return 0;
    }

    if (this.currencyService.isActive) {
      return this.currencyService.convert(numericRate);
    }
    return numericRate;
  }

  hasGrnRate(): boolean {
    return this.formValues?.grnRate && this.parseFloatValue(this.formValues.grnRate) > 0;
  }
}