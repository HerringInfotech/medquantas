import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ApiService } from '../../shared/api/api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonService } from '../../shared/api/common.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { Location } from '@angular/common';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-pack-form',
  templateUrl: './pack-form.component.html',
  styleUrls: ['./pack-form.component.scss'],
})
export class PackFormComponent implements OnInit {
  btn_loading: boolean = false;
  formValues: Object = {
    name: '',
  };
  packId;
  codeError = '';
  faArrowLeft = faArrowLeft;
  user;
  constructor(
    private api: ApiService,
    private location: Location,
    private router: Router,
    private route: ActivatedRoute,
    private spinner: NgxSpinnerService,
    private common: CommonService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.packId = params.id;
      if (this.packId) {
        this.get_packtype(this.packId);
      }
    });
    this.get_current_user();
    
  }

  formSubmit(formData: NgForm) {
    if (formData.valid) {
      this.btn_loading = true;
      const payload = {
        ...this.formValues,
        user: this.user,
      };
      this.api.post('update_pack', payload).subscribe((response) => {
        this.btn_loading = false;
        this.common.alert({
          msg: response.message,
          type: response.status ? 'success' : 'danger',
        });
        if (response.status) this.router.navigateByUrl('pack');
      });
    }
  }
  get_current_user() {
    let params = {
      id: localStorage.getItem('user_id'),
    };
    this.api.post('get_user', params).subscribe((response) => {
      this.user = response.data?.users[0];
    });
  }
  get_packtype(id) {
    this.spinner.show();
    let params = {
      id: id,
    };
    this.api.post('get_pack', params).subscribe((response) => {
      this.spinner.hide();
      this.formValues = response.data.packtype[0];
    });
  }

  pack_code() {
    this.codeError = '';
    let params = {
      code: this.formValues['pack_code'],
    };
    this.api.post('pack_code', params).subscribe((response) => {
      if (!response.status) {
        this.codeError = response.message;
      }
    });
  }

  resetForm(formData: NgForm) {
    formData.resetForm();
  }

  goBack(): void {
    this.location.back();
  }
}
