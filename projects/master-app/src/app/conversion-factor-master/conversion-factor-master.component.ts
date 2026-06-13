import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgForm } from '@angular/forms';
import { ApiService } from '../shared/api/api.service';
import { CommonService } from '../shared/api/common.service';
import { PermissionService } from '../shared/permission/permission.service';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-conversion-factor-master',
  templateUrl: './conversion-factor-master.component.html',
  styleUrls: ['./conversion-factor-master.component.scss'],
})
export class ConversionFactorMasterComponent implements OnInit {
  page_loading = false;
  btn_loading = false;
  rate_loading = false;

  factor: { _id: string; name: string; inrToUsd: number; updatedAt: string } | null = null;

  constructor(
    private api: ApiService,
    private http: HttpClient,
    private common: CommonService,
    private permission: PermissionService,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit(): void {
    this.getConversionFactor();
  }

  getConversionFactor() {
    this.page_loading = true;
    this.api.post('get_conversion_factor', {}).subscribe((response) => {
      this.page_loading = false;
      const data = response?.data?.[0];
      if (data) {
        this.factor = {
          _id: data._id,
          name: data.name,
          inrToUsd: data.inrToUsd,
          updatedAt: data.updatedAt,
        };
      }
    });
  }

  fetchLiveRate() {
    this.rate_loading = true;
    this.http.get<any>('https://open.er-api.com/v6/latest/USD').subscribe({
      next: (res) => {
        const inrPerUsd = res?.rates?.INR;
        if (inrPerUsd && this.factor) {
          this.factor.inrToUsd = parseFloat(inrPerUsd.toFixed(2));
          this.common.alert({ msg: `Live rate fetched: 1 USD = ₹${this.factor.inrToUsd}`, type: 'success' });
        } else {
          this.common.alert({ msg: 'Could not read rate from API response', type: 'danger' });
        }
      },
      error: () => {
        this.common.alert({ msg: 'Failed to fetch live rate. Check internet connection.', type: 'danger' });
      },
      complete: () => {
        this.rate_loading = false;
      }
    });
  }

  formSubmit(formData: NgForm) {
    if (!formData.valid || !this.factor) return;
    this.btn_loading = true;
    this.api.post('update_conversion_factor', { id: this.factor._id, name: this.factor.name, inrToUsd: this.factor.inrToUsd }).subscribe({
      next: (response) => {
        this.common.alert({ msg: response.message, type: response.status ? 'success' : 'danger' });
        if (response.status) {
          this.getConversionFactor();
        }
      },
      error: () => {
        this.common.alert({ msg: 'Something went wrong', type: 'danger' });
      },
      complete: () => {
        this.btn_loading = false;
      }
    });
  }

  hasPermission(permissionName: string): boolean {
    return this.permission.hasPermission(permissionName);
  }
}
