import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../shared/api/api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { CommonService } from '../../shared/api/common.service';
import { Location } from '@angular/common';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-conversion-factor-form',
  templateUrl: './conversion-factor-form.component.html',
  styleUrls: ['./conversion-factor-form.component.scss'],
})
export class ConversionFactorFormComponent implements OnInit {
  btn_loading = false;
  conversionFactorId: string | null = null;

  formValues = {
    name: '',
    inrToUsd: null as number | null,
    updatedAt: null as string | null,
  };

  constructor(
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
    private spinner: NgxSpinnerService,
    private common: CommonService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.conversionFactorId = params['id'] || null;
      if (this.conversionFactorId) {
        this.getConversionFactor(this.conversionFactorId);
      }
    });
  }

  getConversionFactor(id: string) {
    this.spinner.show();
    this.api.post('get_conversion_factor', { id }).subscribe((response) => {
      this.spinner.hide();
      if (response?.data) {
        const data = response.data[0];
        this.formValues = {
          name: data.name,
          inrToUsd: data.inrToUsd,
          updatedAt: data.updatedAt,
        };
      }
    });
  }

  formSubmit(formData: NgForm) {
    if (!formData.valid) return;

    this.btn_loading = true;

    const payload: any = {
      name: this.formValues.name,
      inrToUsd: this.formValues.inrToUsd,
    };

    if (this.conversionFactorId) {
      payload.id = this.conversionFactorId;
    }

    this.api.post('update_conversion_factor', payload).subscribe({
      next: (response) => {
        this.common.alert({
          msg: response.message,
          type: response.status ? 'success' : 'danger',
        });

        if (response.status) {
          this.router.navigateByUrl('/conversionfactor');
        }
      },
      error: () => {
        this.common.alert({
          msg: 'Something went wrong',
          type: 'danger',
        });
      },
      complete: () => {
        this.btn_loading = false;
      }
    });
  }


  goBack() {
    this.location.back();
  }
}
